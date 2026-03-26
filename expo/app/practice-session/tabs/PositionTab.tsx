import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin, Navigation, Crosshair, RotateCcw } from 'lucide-react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import Colors from '@/constants/colors';
import { useWeather } from '@/hooks/useWeather';
import { useDeviceHeading } from '@/hooks/useDeviceHeading';
import { calculateGolfShot, decomposeWind } from '@/services/golfCalculations';

interface Coordinate {
  latitude: number;
  longitude: number;
}

function haversineDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MINI_CENTER = 32;
const MINI_RADIUS = 28;
const MINI_TEXT_R = 18;

interface MiniCompassProps {
  windDeg: number;
  windMs: number;
  deviceHeading: number;
}

function MiniWindCompass({ windDeg, windMs, deviceHeading }: MiniCompassProps) {
  const rotation = -deviceHeading;

  const MARKERS = [
    { deg: 0, label: 'N' },
    { deg: 90, label: 'E' },
    { deg: 180, label: 'S' },
    { deg: 270, label: 'W' },
  ];

  const pos = (degree: number, radius: number) => {
    const rad = ((degree + rotation - 90) * Math.PI) / 180;
    return { x: MINI_CENTER + radius * Math.cos(rad), y: MINI_CENTER + radius * Math.sin(rad) };
  };

  const arrowRad = ((windDeg + 180 + rotation - 90) * Math.PI) / 180;
  const tipR = MINI_RADIUS - 4;
  const baseR = 8;
  const tipX = MINI_CENTER + tipR * Math.cos(arrowRad);
  const tipY = MINI_CENTER + tipR * Math.sin(arrowRad);
  const leftRad = arrowRad + Math.PI - 0.35;
  const rightRad = arrowRad + Math.PI + 0.35;
  const lx = MINI_CENTER + baseR * Math.cos(leftRad);
  const ly = MINI_CENTER + baseR * Math.sin(leftRad);
  const rx = MINI_CENTER + baseR * Math.cos(rightRad);
  const ry = MINI_CENTER + baseR * Math.sin(rightRad);

  return (
    <View style={miniStyles.wrapper}>
      <Svg width={64} height={64} viewBox="0 0 64 64">
        <Circle cx={MINI_CENTER} cy={MINI_CENTER} r={MINI_RADIUS} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
        <Circle cx={MINI_CENTER} cy={MINI_CENTER} r={MINI_RADIUS - 6} stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" fill="none" />
        {MARKERS.map(({ deg, label }) => {
          const outer = pos(deg, MINI_RADIUS);
          const inner = pos(deg, MINI_RADIUS - 5);
          const textP = pos(deg, MINI_TEXT_R);
          return (
            <React.Fragment key={deg}>
              <Line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="white" strokeWidth={deg === 0 ? '2' : '1'} />
              <SvgText x={textP.x} y={textP.y} fill="white" fontSize="7" fontWeight={deg === 0 ? 'bold' : '500'} textAnchor="middle" alignmentBaseline="middle">
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Polygon points={`${tipX},${tipY} ${lx},${ly} ${rx},${ry}`} fill="white" opacity="0.85" />
      </Svg>
      <Text style={miniStyles.speedText}>{windMs} m/s</Text>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center' as const,
  },
  speedText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '600' as const,
    marginTop: 2,
  },
});

interface PositionTabProps {
  onDistanceChange?: (distance: number) => void;
  externalPinnedPosition?: Coordinate | null;
  onPinChange?: (pin: Coordinate | null) => void;
}

function NativeMap({ onDistanceChange, externalPinnedPosition, onPinChange }: PositionTabProps) {
  const MapView = require('react-native-maps').default;
  const { Marker, Polyline } = require('react-native-maps');
  const Location = require('expo-location');

  const mapRef = useRef<any>(null);
  const locationSubRef = useRef<any>(null);
  const deviceHeading = useDeviceHeading();

  const [userPosition, setUserPosition] = useState<Coordinate | null>(null);
  const [pinnedPosition, setPinnedPosition] = useState<Coordinate | null>(externalPinnedPosition ?? null);
  const [midPosition, setMidPosition] = useState<Coordinate | null>(null);
  const [distanceToPin, setDistanceToPin] = useState<number>(0);
  const [distanceToUser, setDistanceToUser] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lon: number } | null>(null);

  const { weather } = useWeather(geoLocation?.lat || null, geoLocation?.lon || null, 0);

  const liveWind = useMemo(() => {
    if (!weather) return null;
    return decomposeWind(weather.windMs, weather.windDeg, deviceHeading);
  }, [weather, deviceHeading]);

  const adjustedDistance = useMemo(() => {
    if (!weather || !liveWind || totalDistance <= 0) return null;
    return calculateGolfShot(totalDistance, 'Normal', weather.windMs, liveWind.headTail, liveWind.cross, weather.temp, weather.pressureMb);
  }, [weather, liveWind, totalDistance]);

  useEffect(() => {
    let mounted = true;
    const Loc = Location;
    void (async () => {
      try {
        const { status } = await Loc.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          if (mounted) {
            setPermissionDenied(true);
            setLoading(false);
          }
          return;
        }
        const loc = await Loc.getCurrentPositionAsync({
          accuracy: Loc.Accuracy.High,
        });
        console.log('Got user location:', loc.coords.latitude, loc.coords.longitude);
        if (mounted) {
          const pos: Coordinate = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserPosition(pos);
          setGeoLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
          setLoading(false);
        }
      } catch (err) {
        console.log('Error getting location:', err);
        if (mounted) {
          setPermissionDenied(true);
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let sub: any = null;
    void (async () => {
      try {
        const Loc = require('expo-location');
        sub = await Loc.watchPositionAsync(
          { accuracy: Loc.Accuracy.High, distanceInterval: 1, timeInterval: 1000 },
          (loc: any) => {
            const newPos: Coordinate = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setUserPosition(newPos);
            setGeoLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
          }
        );
        locationSubRef.current = sub;
      } catch (err) {
        console.log('Error watching position:', err);
      }
    })();
    return () => {
      if (locationSubRef.current?.remove) {
        locationSubRef.current.remove();
      }
    };
  }, []);

  const recalcDistances = useCallback((pin: Coordinate, user: Coordinate, mid: Coordinate) => {
    const dPin = Math.round(haversineDistance(mid, pin));
    const dUser = Math.round(haversineDistance(mid, user));
    const dTotal = Math.round(haversineDistance(pin, user));
    setDistanceToPin(dPin);
    setDistanceToUser(dUser);
    setTotalDistance(dTotal);
    onDistanceChange?.(dTotal);
  }, [onDistanceChange]);

  useEffect(() => {
    if (pinnedPosition && userPosition && midPosition) {
      recalcDistances(pinnedPosition, userPosition, midPosition);
    }
  }, [pinnedPosition, userPosition, midPosition, recalcDistances]);

  useEffect(() => {
    if (pinnedPosition && userPosition && !midPosition) {
      const mid: Coordinate = {
        latitude: (pinnedPosition.latitude + userPosition.latitude) / 2,
        longitude: (pinnedPosition.longitude + userPosition.longitude) / 2,
      };
      setMidPosition(mid);
    }
  }, [pinnedPosition, userPosition, midPosition]);

  useEffect(() => {
    if (externalPinnedPosition && !pinnedPosition) {
      setPinnedPosition(externalPinnedPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPinnedPosition]);

  const handleSetPin = useCallback(() => {
    if (!userPosition) return;
    console.log('Set Pin at:', userPosition.latitude, userPosition.longitude);
    const newPin = { ...userPosition };
    setPinnedPosition(newPin);
    onPinChange?.(newPin);
    setMidPosition(null);
    setTotalDistance(0);
    setDistanceToPin(0);
    setDistanceToUser(0);
    onDistanceChange?.(0);
  }, [userPosition, onDistanceChange, onPinChange]);

  const handleClearPin = useCallback(() => {
    console.log('Clearing pin');
    setPinnedPosition(null);
    setMidPosition(null);
    onPinChange?.(null);
    setTotalDistance(0);
    setDistanceToPin(0);
    setDistanceToUser(0);
    onDistanceChange?.(0);
  }, [onDistanceChange, onPinChange]);

  const handleResetDrag = useCallback(() => {
    if (pinnedPosition && userPosition) {
      console.log('[PositionTab] Resetting drag tool to midpoint');
      const mid: Coordinate = {
        latitude: (pinnedPosition.latitude + userPosition.latitude) / 2,
        longitude: (pinnedPosition.longitude + userPosition.longitude) / 2,
      };
      setMidPosition(mid);
      recalcDistances(pinnedPosition, userPosition, mid);
    }
  }, [pinnedPosition, userPosition, recalcDistances]);

  const handleMidDrag = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    setMidPosition(newCoord);
    if (pinnedPosition && userPosition) {
      recalcDistances(pinnedPosition, userPosition, newCoord);
    }
  }, [pinnedPosition, userPosition, recalcDistances]);

  const handleMidDragEnd = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    console.log('[PositionTab] Mid drag ended:', newCoord.latitude, newCoord.longitude);
    setMidPosition(newCoord);
    if (pinnedPosition && userPosition) {
      recalcDistances(pinnedPosition, userPosition, newCoord);
    }
  }, [pinnedPosition, userPosition, recalcDistances]);

  const fitToBoth = useCallback(() => {
    if (mapRef.current && pinnedPosition && userPosition) {
      mapRef.current.fitToCoordinates(
        [pinnedPosition, userPosition],
        { edgePadding: { top: 120, right: 60, bottom: 120, left: 60 }, animated: true }
      );
    }
  }, [pinnedPosition, userPosition]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Getting your position...</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.loadingContainer}>
        <MapPin size={40} color="#FF5252" />
        <Text style={styles.loadingText}>Location permission required</Text>
        <Text style={styles.loadingSubtext}>Enable location to use the Position tool</Text>
      </View>
    );
  }

  const centerCoord = userPosition ?? { latitude: 0, longitude: 0 };

  const initialRegion = {
    latitude: centerCoord.latitude,
    longitude: centerCoord.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  const handleMapReady = () => {
    if (mapRef.current && userPosition) {
      mapRef.current.animateToRegion({
        latitude: userPosition.latitude,
        longitude: userPosition.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 300);
    }
  };

  const windDistText = adjustedDistance ? Math.round(adjustedDistance.adjustedDistance) : null;

  const displayPin = pinnedPosition ?? { latitude: 0, longitude: 0 };
  const displayUser = userPosition ?? { latitude: 0, longitude: 0 };
  const displayMid = midPosition ?? {
    latitude: (displayPin.latitude + displayUser.latitude) / 2,
    longitude: (displayPin.longitude + displayUser.longitude) / 2,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={handleMapReady}
        mapType="hybrid"
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {pinnedPosition && userPosition && (
          <>
            <Marker
              coordinate={displayPin}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.pinMarker}>
                <View style={styles.pinMarkerInner} />
              </View>
            </Marker>

            <Polyline
              coordinates={[displayPin, displayMid]}
              strokeColor="#FFFFFF"
              strokeWidth={7}
            />
            <Polyline
              coordinates={[displayMid, displayUser]}
              strokeColor="#FFFFFF"
              strokeWidth={7}
            />

            <Marker
              coordinate={displayMid}
              draggable
              onDrag={handleMidDrag}
              onDragEnd={handleMidDragEnd}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
            >
              <View style={styles.dragMarkerHitArea}>
                <View style={styles.dragMarkerOuter}>
                  <View style={styles.dragMarkerDot} />
                </View>
              </View>
            </Marker>

            <Marker
              coordinate={{
                latitude: (displayMid.latitude + displayPin.latitude) / 2,
                longitude: (displayMid.longitude + displayPin.longitude) / 2,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
            >
              <View style={styles.distanceBubble}>
                <Text style={styles.distanceBubbleText}>{distanceToPin}</Text>
              </View>
            </Marker>

            <Marker
              coordinate={{
                latitude: (displayMid.latitude + displayUser.latitude) / 2,
                longitude: (displayMid.longitude + displayUser.longitude) / 2,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
            >
              <View style={styles.distanceBubble}>
                <Text style={styles.distanceBubbleText}>{distanceToUser}</Text>
              </View>
            </Marker>
          </>
        )}
      </MapView>

      {weather && (
        <View style={styles.miniCompassBox}>
          <MiniWindCompass windDeg={weather.windDeg} windMs={weather.windMs} deviceHeading={deviceHeading} />
        </View>
      )}

      <View style={styles.setPinArea}>
        {!pinnedPosition ? (
          <TouchableOpacity style={styles.actionCircleBtn} onPress={handleSetPin} activeOpacity={0.7}>
            <MapPin size={22} color="#fff" />
            <Text style={styles.actionCircleBtnText}>Set Pin</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionCircleBtn} onPress={handleClearPin} activeOpacity={0.7}>
            <MapPin size={22} color="#fff" />
            <Text style={styles.actionCircleBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {pinnedPosition && (
        <View style={styles.distanceOverlay}>
          <View style={styles.distanceRow}>
            <Text style={styles.distanceMainValue}>{totalDistance}</Text>
            <Text style={styles.distanceMainUnit}>Meters</Text>
          </View>
          <Text style={styles.distanceLabel}>GPS Distance</Text>
          {windDistText !== null && (
            <View style={styles.windDistRow}>
              <Text style={styles.windDistValueOrange}>{windDistText}</Text>
              <Text style={styles.windDistUnitOrange}>Meters</Text>
            </View>
          )}
          {windDistText !== null && (
            <Text style={styles.windDistLabel}>Adjusted Weather Distance</Text>
          )}
        </View>
      )}

      <View style={styles.bottomRightButtons}>
        <TouchableOpacity
          style={styles.actionCircleBtn}
          onPress={() => {
            if (userPosition && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: userPosition.latitude,
                longitude: userPosition.longitude,
                latitudeDelta: 0.003,
                longitudeDelta: 0.003,
              }, 500);
            }
          }}
          activeOpacity={0.7}
        >
          <Navigation size={20} color="#fff" fill="#fff" />
          <Text style={styles.actionCircleBtnText}>Live</Text>
        </TouchableOpacity>

        {pinnedPosition && (
          <TouchableOpacity style={styles.actionCircleBtn} onPress={fitToBoth} activeOpacity={0.7}>
            <Crosshair size={20} color="#fff" />
            <Text style={styles.actionCircleBtnText}>Zoom</Text>
          </TouchableOpacity>
        )}
        {pinnedPosition && (
          <TouchableOpacity style={styles.actionCircleBtn} onPress={handleResetDrag} activeOpacity={0.7}>
            <RotateCcw size={20} color="#fff" />
            <Text style={styles.actionCircleBtnText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function WebMapFallback() {
  const openInMaps = () => {
    void Linking.openURL(
      `https://www.google.com/maps/@40.7128,-74.0060,17z/data=!3m1!1e1`
    );
  };

  return (
    <View style={styles.webFallback}>
      <View style={styles.iconCircle}>
        <MapPin size={40} color={Colors.accent} />
      </View>
      <Text style={styles.webTitle}>Position Map</Text>
      <Text style={styles.webSubtitle}>
        The satellite map is available on your mobile device.{"\n"}
        Open the app on your phone to view the full map.
      </Text>
      <TouchableOpacity style={styles.openBtn} onPress={openInMaps} activeOpacity={0.7}>
        <Text style={styles.openBtnText}>Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PositionTab({ onDistanceChange, externalPinnedPosition, onPinChange }: PositionTabProps) {
  if (Platform.OS === 'web') {
    return <WebMapFallback />;
  }
  return (
    <NativeMap
      onDistanceChange={onDistanceChange}
      externalPinnedPosition={externalPinnedPosition}
      onPinChange={onPinChange}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#0a1a0a',
    gap: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 8,
  },
  loadingSubtext: {
    color: '#888',
    fontSize: 13,
  },
  pinMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(52,199,89,0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(52,199,89,0.6)',
  },
  pinMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  dragMarkerHitArea: {
    width: 100,
    height: 100,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dragMarkerOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dragMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  distanceBubble: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 48,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  distanceBubbleText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  miniCompassBox: {
    position: 'absolute' as const,
    top: 60,
    right: 16,
  },
  setPinArea: {
    position: 'absolute' as const,
    top: 60,
    right: 90,
    alignItems: 'center' as const,
  },
  actionCircleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  actionCircleBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700' as const,
    marginTop: 2,
  },
  distanceOverlay: {
    position: 'absolute' as const,
    left: 16,
    top: 110,
  },
  distanceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 6,
  },
  distanceMainValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900' as const,
    lineHeight: 52,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  distanceMainUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  distanceLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '500' as const,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  windDistRow: {
    marginTop: 10,
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  windDistValueOrange: {
    color: '#FF9500',
    fontSize: 36,
    fontWeight: '900' as const,
    lineHeight: 40,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  windDistUnitOrange: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '700' as const,
    marginLeft: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  windDistLabel: {
    color: 'rgba(255,149,0,0.6)',
    fontSize: 10,
    fontWeight: '500' as const,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomRightButtons: {
    position: 'absolute' as const,
    bottom: 24,
    right: 16,
    alignItems: 'center' as const,
    gap: 12,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#0a1a0a',
    padding: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52,199,89,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  webTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 10,
  },
  webSubtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 24,
  },
  openBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  openBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
