import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Flag, ChevronLeft, ChevronRight, Backpack } from 'lucide-react-native';
import { useSensor } from '@/contexts/SensorContext';
import ClubSelectorPopup from '@/components/ClubSelectorPopup';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useWeather } from '@/hooks/useWeather';
import { useDeviceHeading } from '@/hooks/useDeviceHeading';
import { calculateGolfShot, decomposeWind } from '@/services/golfCalculations';
import { useScoring } from '@/contexts/ScoringContext';
import { loadCourseLocation } from '@/mocks/courseData';
import type { CourseLocation } from '@/mocks/courseData';

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

function offsetCoordinate(base: Coordinate, bearingDeg: number, distanceMeters: number): Coordinate {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(base.latitude);
  const lon1 = toRad(base.longitude);
  const bearing = toRad(bearingDeg);
  const d = distanceMeters / R;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing));
  const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return { latitude: toDeg(lat2), longitude: toDeg(lon2) };
}

interface MiniCompassProps {
  windDeg: number;
  windMs: number;
  deviceHeading: number;
}

const MINI_CENTER = 32;
const MINI_RADIUS = 28;
const MINI_TEXT_R = 18;

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

interface ShotMarker {
  clubId: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  rowId?: string;
}

interface GPSTabProps {
  onDistanceChange?: (distance: number) => void;
  onAdjustedDistanceChange?: (adjustedDistance: number) => void;
  externalHoleIndex?: number;
  onHoleIndexChange?: (index: number) => void;
}

function NativeMap({ onDistanceChange, onAdjustedDistanceChange, externalHoleIndex, onHoleIndexChange }: GPSTabProps) {
  const MapView = require('react-native-maps').default;
  const { Marker, Polyline } = require('react-native-maps');
  const insets = useSafeAreaInsets();
  const { holes } = useScoring();
  const deviceHeading = useDeviceHeading();
  const { isPaired } = useSensor();
  const [clubSelectorVisible, setClubSelectorVisible] = useState<boolean>(false);
  const showClubBag = !isPaired;

  const mapRef = useRef<any>(null);
  const locationWatchRef = useRef<any>(null);
  const [courseLocation, setCourseLocation] = useState<CourseLocation | null>(null);
  const [currentGpsHoleIndex, setCurrentGpsHoleIndex] = useState<number>(externalHoleIndex ?? 0);

  const [shotMarkersMap, setShotMarkersMap] = useState<Record<number, ShotMarker[]>>({});

  const currentShotMarkers = useMemo(() => {
    return shotMarkersMap[currentGpsHoleIndex] ?? [];
  }, [shotMarkersMap, currentGpsHoleIndex]);

  const handleClubSelected = useCallback(async (marker: ShotMarker) => {
    console.log('[GPSTab] Shot marker added:', marker.clubId, 'lat:', marker.latitude, 'lon:', marker.longitude, 'hole:', currentGpsHoleIndex, 'rowId:', marker.rowId);

    const currentMarkers = shotMarkersMap[currentGpsHoleIndex] ?? [];
    let distanceMeters: number | undefined;
    let prevRowId: string | undefined;

    if (currentMarkers.length > 0) {
      const prevMarker = currentMarkers[currentMarkers.length - 1];
      const distM = haversineDistance(
        { latitude: prevMarker.latitude, longitude: prevMarker.longitude },
        { latitude: marker.latitude, longitude: marker.longitude }
      );
      distanceMeters = Math.round(distM);
      prevRowId = prevMarker.rowId;
      console.log('[GPSTab] Distance from previous shot:', distanceMeters, 'm, prevRowId:', prevRowId);

      const updatedMarkers = [...currentMarkers];
      updatedMarkers[updatedMarkers.length - 1] = {
        ...prevMarker,
        distanceMeters,
      };

      setShotMarkersMap(prev => ({
        ...prev,
        [currentGpsHoleIndex]: [...updatedMarkers, { ...marker }],
      }));
    } else {
      setShotMarkersMap(prev => ({
        ...prev,
        [currentGpsHoleIndex]: [...currentMarkers, { ...marker }],
      }));
    }

    if (distanceMeters != null && prevRowId != null) {
      try {
        const { updateClubSelectionDistanceById } = await import('@/services/clubSelectionService');
        console.log('[GPSTab] Calling updateClubSelectionDistanceById, rowId:', prevRowId, 'distance:', distanceMeters, 'm');
        const ok = await updateClubSelectionDistanceById(prevRowId, distanceMeters);
        console.log('[GPSTab] Distance update to DB result:', ok);
        if (!ok) {
          console.error('[GPSTab] FAILED to update distance in DB for rowId:', prevRowId);
        }
      } catch (err) {
        console.error('[GPSTab] Failed to save distance to DB:', err);
      }
    } else {
      console.log('[GPSTab] No distance update needed (first shot on hole or missing rowId)');
    }
  }, [currentGpsHoleIndex, shotMarkersMap]);
  const [teePosition, setTeePosition] = useState<Coordinate | null>(null);
  const [greenPosition, setGreenPosition] = useState<Coordinate | null>(null);
  const [midPosition, setMidPosition] = useState<Coordinate | null>(null);
  const [distanceToGreen, setDistanceToGreen] = useState<number>(0);
  const [distanceToTee, setDistanceToTee] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [pinnedPosition, setPinnedPosition] = useState<Coordinate | null>(null);

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
    if (adjustedDistance) {
      onAdjustedDistanceChange?.(Math.round(adjustedDistance.adjustedDistance));
    }
  }, [adjustedDistance, onAdjustedDistanceChange]);

  useEffect(() => {
    if (totalDistance > 0) {
      onDistanceChange?.(totalDistance);
    }
  }, [totalDistance, onDistanceChange]);

  const holeCoordinates = useMemo(() => {
    if (!courseLocation?.latitude || !courseLocation?.longitude) return [];
    const baseCoord: Coordinate = { latitude: courseLocation.latitude, longitude: courseLocation.longitude };

    return holes.map((hole) => {
      const tee = baseCoord;
      const greenDistMeters = hole.distance > 0 ? hole.distance * 0.9144 : 350;
      const green = offsetCoordinate(tee, 0, greenDistMeters);
      const mid: Coordinate = {
        latitude: (tee.latitude + green.latitude) / 2,
        longitude: (tee.longitude + green.longitude) / 2,
      };
      return { tee, green, mid, hole };
    });
  }, [courseLocation, holes]);

  const currentGpsHole = useMemo(() => {
    if (holeCoordinates.length === 0) return null;
    return holeCoordinates[currentGpsHoleIndex] ?? null;
  }, [holeCoordinates, currentGpsHoleIndex]);

  const currentHoleData = useMemo(() => {
    if (currentGpsHoleIndex < holes.length) return holes[currentGpsHoleIndex];
    return null;
  }, [holes, currentGpsHoleIndex]);

  useEffect(() => {
    void loadCourseAndLocation();
  }, []);

  const loadCourseAndLocation = async () => {
    try {
      const loc = await loadCourseLocation();
      if (loc && loc.latitude && loc.longitude) {
        console.log('[GPSTab] Loaded course location:', loc.latitude, loc.longitude);
        setCourseLocation(loc);
      } else {
        console.log('[GPSTab] No course location found, using user location');
      }
    } catch (e) {
      console.log('[GPSTab] Error loading course location:', e);
    }
    void initLocation();
  };

  const initLocation = async () => {
    const LocationModule = require('expo-location');
    try {
      const { status } = await LocationModule.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      const loc = await LocationModule.getCurrentPositionAsync({
        accuracy: LocationModule.Accuracy.High,
      });
      console.log('Got user location:', loc.coords.latitude, loc.coords.longitude);
      setGeoLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      setLoading(false);
    } catch (err) {
      console.log('Error getting location:', err);
      setPermissionDenied(true);
      setLoading(false);
    }
  };

  const recalcDistances = useCallback((tee: Coordinate, green: Coordinate, mid: Coordinate) => {
    const dGreen = Math.round(haversineDistance(mid, green));
    const dTee = Math.round(haversineDistance(mid, tee));
    const dTotal = Math.round(haversineDistance(tee, green));
    setDistanceToGreen(dGreen);
    setDistanceToTee(dTee);
    setTotalDistance(dTotal);
  }, []);

  useEffect(() => {
    if (!loading && currentGpsHole) {
      const tee = currentGpsHole.tee;
      const green = currentGpsHole.green;
      const mid = currentGpsHole.mid;
      setTeePosition(tee);
      setGreenPosition(green);
      setMidPosition(mid);
      recalcDistances(tee, green, mid);

      if (mapRef.current) {
        mapRef.current.fitToCoordinates(
          [tee, green],
          { edgePadding: { top: 140, right: 60, bottom: 100, left: 60 }, animated: true }
        );
      }
    }
  }, [loading, currentGpsHole, recalcDistances]);

  useEffect(() => {
    if (externalHoleIndex !== undefined && externalHoleIndex !== currentGpsHoleIndex) {
      console.log('[GPSTab] Syncing to external hole index:', externalHoleIndex);
      setPinnedPosition(null);
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
        locationWatchRef.current = null;
      }
      setCurrentGpsHoleIndex(externalHoleIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalHoleIndex]);

  const handleNextHole = useCallback(() => {
    if (currentGpsHoleIndex < holes.length - 1) {
      const nextIdx = currentGpsHoleIndex + 1;
      setPinnedPosition(null);
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
        locationWatchRef.current = null;
      }
      setCurrentGpsHoleIndex(nextIdx);
      onHoleIndexChange?.(nextIdx);
    }
  }, [currentGpsHoleIndex, holes.length, onHoleIndexChange]);

  const handlePrevHole = useCallback(() => {
    if (currentGpsHoleIndex > 0) {
      const prevIdx = currentGpsHoleIndex - 1;
      setPinnedPosition(null);
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
        locationWatchRef.current = null;
      }
      setCurrentGpsHoleIndex(prevIdx);
      onHoleIndexChange?.(prevIdx);
    }
  }, [currentGpsHoleIndex, onHoleIndexChange]);

  const stopLocationWatch = useCallback(() => {
    if (locationWatchRef.current) {
      locationWatchRef.current.remove();
      locationWatchRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopLocationWatch();
    };
  }, [stopLocationWatch]);

  const handleMidDrag = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    setMidPosition(newCoord);
    if (teePosition && greenPosition) {
      recalcDistances(teePosition, greenPosition, newCoord);
    }
  }, [teePosition, greenPosition, recalcDistances]);

  const handleMidDragEnd = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    console.log('[GPSTab] Mid drag ended:', newCoord.latitude, newCoord.longitude);
    setMidPosition(newCoord);
    if (teePosition && greenPosition) {
      recalcDistances(teePosition, greenPosition, newCoord);
    }
  }, [teePosition, greenPosition, recalcDistances]);

  const handleTeeDrag = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    setTeePosition(newCoord);
    if (midPosition && greenPosition) {
      recalcDistances(newCoord, greenPosition, midPosition);
    }
  }, [midPosition, greenPosition, recalcDistances]);

  const handleTeeDragEnd = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    console.log('[GPSTab] Tee drag ended:', newCoord.latitude, newCoord.longitude);
    setTeePosition(newCoord);
    if (midPosition && greenPosition) {
      recalcDistances(newCoord, greenPosition, midPosition);
    }
  }, [midPosition, greenPosition, recalcDistances]);

  const handleGreenDrag = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    setGreenPosition(newCoord);
    if (teePosition && midPosition) {
      recalcDistances(teePosition, newCoord, midPosition);
    }
  }, [teePosition, midPosition, recalcDistances]);

  const handleGreenDragEnd = useCallback((e: any) => {
    const newCoord: Coordinate = e.nativeEvent.coordinate;
    console.log('[GPSTab] Green drag ended:', newCoord.latitude, newCoord.longitude);
    setGreenPosition(newCoord);
    if (teePosition && midPosition) {
      recalcDistances(teePosition, newCoord, midPosition);
    }
  }, [teePosition, midPosition, recalcDistances]);

  const handleReset = useCallback(() => {
    if (pinnedPosition || !currentGpsHole) return;
    setTeePosition(currentGpsHole.tee);
    setGreenPosition(currentGpsHole.green);
    setMidPosition(currentGpsHole.mid);
    recalcDistances(currentGpsHole.tee, currentGpsHole.green, currentGpsHole.mid);
    mapRef.current?.fitToCoordinates(
      [currentGpsHole.tee, currentGpsHole.green],
      { edgePadding: { top: 140, right: 60, bottom: 100, left: 60 }, animated: true }
    );
  }, [pinnedPosition, currentGpsHole, recalcDistances]);

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
        <Text style={styles.loadingSubtext}>Enable location to use the GPS tool</Text>
      </View>
    );
  }

  const displayTee = teePosition ?? { latitude: 0, longitude: 0 };
  const displayGreen = greenPosition ?? displayTee;
  const displayMid = midPosition ?? {
    latitude: (displayTee.latitude + displayGreen.latitude) / 2,
    longitude: (displayTee.longitude + displayGreen.longitude) / 2,
  };

  const initialRegion = {
    latitude: (displayTee.latitude + displayGreen.latitude) / 2,
    longitude: (displayTee.longitude + displayGreen.longitude) / 2,
    latitudeDelta: Math.abs(displayGreen.latitude - displayTee.latitude) * 2.5 + 0.002,
    longitudeDelta: Math.abs(displayGreen.longitude - displayTee.longitude) * 2.5 + 0.002,
  };

  const handleMapReady = () => {
    if (mapRef.current && teePosition && greenPosition) {
      mapRef.current.fitToCoordinates(
        [teePosition, greenPosition],
        { edgePadding: { top: 140, right: 60, bottom: 100, left: 60 }, animated: false }
      );
    }
  };

  const windDistText = adjustedDistance ? Math.round(adjustedDistance.adjustedDistance) : null;
  const isFirstHole = currentGpsHoleIndex === 0;
  const isLastHole = currentGpsHoleIndex === holes.length - 1;

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
        {teePosition && greenPosition && midPosition && (
          <>
            <Polyline
              coordinates={[displayTee, displayMid]}
              strokeColor="#FFFFFF"
              strokeWidth={7}
            />
            <Polyline
              coordinates={[displayMid, displayGreen]}
              strokeColor="#FFFFFF"
              strokeWidth={7}
            />

            <Marker
              coordinate={displayTee}
              draggable
              onDrag={handleTeeDrag}
              onDragEnd={handleTeeDragEnd}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
            >
              <View style={styles.endpointHitArea}>
                <View style={styles.endpointMarkerOuter}>
                  <View style={styles.endpointMarkerInner} />
                </View>
              </View>
            </Marker>

            <Marker
              coordinate={displayGreen}
              draggable
              onDrag={handleGreenDrag}
              onDragEnd={handleGreenDragEnd}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
            >
              <View style={styles.endpointHitArea}>
                <View style={styles.greenMarkerOuter}>
                  <View style={styles.greenMarkerRing} />
                  <View style={styles.greenMarkerDot} />
                </View>
              </View>
            </Marker>

            {!pinnedPosition && (
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
            )}

            {currentShotMarkers.length >= 2 && (
              <Polyline
                coordinates={currentShotMarkers.map(m => ({ latitude: m.latitude, longitude: m.longitude }))}
                strokeColor="rgba(255,255,255,0.85)"
                strokeWidth={3}
              />
            )}

            {currentShotMarkers.map((marker, idx) => (
              <Marker
                key={`shot-${currentGpsHoleIndex}-${idx}`}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={true}
              >
                <View style={styles.shotMarkerContainer}>
                  <View style={styles.shotMarkerDot}>
                    <View style={styles.shotMarkerInner} />
                  </View>
                  <View style={styles.shotLabelRow}>
                    <View style={styles.shotLabelBubble}>
                      <Text style={styles.shotLabelText}>{marker.clubId}</Text>
                    </View>
                    {marker.distanceMeters != null && marker.distanceMeters > 0 && (
                      <View style={styles.shotDistanceBubble}>
                        <Text style={styles.shotDistanceText}>{marker.distanceMeters} m</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Marker>
            ))}

            <Marker
              coordinate={{
                latitude: (displayMid.latitude + displayGreen.latitude) / 2,
                longitude: (displayMid.longitude + displayGreen.longitude) / 2,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
            >
              <View style={styles.distanceBubble}>
                <Text style={styles.distanceBubbleText}>{distanceToGreen}</Text>
              </View>
            </Marker>

            <Marker
              coordinate={{
                latitude: (displayMid.latitude + displayTee.latitude) / 2,
                longitude: (displayMid.longitude + displayTee.longitude) / 2,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
            >
              <View style={styles.distanceBubble}>
                <Text style={styles.distanceBubbleText}>{distanceToTee}</Text>
              </View>
            </Marker>
          </>
        )}
      </MapView>

      <View style={[styles.holeHeaderCompact, { top: insets.top + 10 }]}>
        <TouchableOpacity
          style={[styles.holeNavArrowSmall, isFirstHole && styles.holeNavArrowDisabled]}
          onPress={handlePrevHole}
          disabled={isFirstHole}
          activeOpacity={0.6}
        >
          <ChevronLeft size={16} color={isFirstHole ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
        </TouchableOpacity>
        <Text style={styles.holeCompactText}>
          H{currentHoleData?.number ?? currentGpsHoleIndex + 1} • P{currentHoleData?.par ?? '-'} • {currentHoleData?.distance ?? '-'}y
        </Text>
        <TouchableOpacity
          style={[styles.holeNavArrowSmall, isLastHole && styles.holeNavArrowDisabled]}
          onPress={handleNextHole}
          disabled={isLastHole}
          activeOpacity={0.6}
        >
          <ChevronRight size={16} color={isLastHole ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      <View style={[styles.distanceOverlay, { top: insets.top + 64 }]}>
        <Text style={styles.distanceMainValue}>{totalDistance}</Text>
        <Text style={styles.distanceMainUnit}>Meters</Text>
        {windDistText !== null && (
          <View style={styles.windDistRow}>
            <Text style={styles.windDistValueOrange}>{windDistText}</Text>
            <Text style={styles.windDistUnitOrange}>Meters</Text>
            <Text style={styles.windDistSubtext}>Adjusted based on weather data</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
        <Text style={styles.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.zoomBtn}
        onPress={() => {
          if (greenPosition && mapRef.current) {
            const metersView = 30;
            const delta = metersView / 111320;
            mapRef.current.animateToRegion({
              latitude: greenPosition.latitude,
              longitude: greenPosition.longitude,
              latitudeDelta: delta,
              longitudeDelta: delta,
            }, 600);
          }
        }}
        activeOpacity={0.7}
      >
        <Flag size={20} color="#fff" fill="#fff" />
      </TouchableOpacity>

      {weather && (
        <View style={[styles.miniCompassBox, { top: insets.top + 64 }]}>
          <MiniWindCompass windDeg={weather.windDeg} windMs={weather.windMs} deviceHeading={deviceHeading} />
        </View>
      )}

      {showClubBag && (
        <TouchableOpacity
          style={styles.clubBagBtn}
          onPress={() => setClubSelectorVisible(true)}
          activeOpacity={0.8}
          testID="club-bag-button"
        >
          <Backpack size={26} color="#333" strokeWidth={2} />
        </TouchableOpacity>
      )}

      {showClubBag && (
        <ClubSelectorPopup
          visible={clubSelectorVisible}
          onClose={() => setClubSelectorVisible(false)}
          onClubSelected={handleClubSelected}
        />
      )}
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
        <MapPin size={40} color="#34C759" />
      </View>
      <Text style={styles.webTitle}>GPS Map</Text>
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

export default function GPSTab({ onDistanceChange, onAdjustedDistanceChange, externalHoleIndex, onHoleIndexChange }: GPSTabProps) {
  if (Platform.OS === 'web') {
    return <WebMapFallback />;
  }
  return <NativeMap onDistanceChange={onDistanceChange} onAdjustedDistanceChange={onAdjustedDistanceChange} externalHoleIndex={externalHoleIndex} onHoleIndexChange={onHoleIndexChange} />;
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
  holeHeaderCompact: {
    position: 'absolute' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 4,
    justifyContent: 'center' as const,
  },
  holeNavArrowSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  holeNavArrowDisabled: {
    opacity: 0.4,
  },
  holeCompactText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    paddingHorizontal: 4,
  },
  endpointHitArea: {
    width: 50,
    height: 50,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  endpointMarkerOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  endpointMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  greenMarkerOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  greenMarkerRing: {
    position: 'absolute' as const,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  greenMarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
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

  distanceOverlay: {
    position: 'absolute' as const,
    left: 16,
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
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: -4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  windDistRow: {
    marginTop: 4,
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
    color: 'rgba(255,149,0,0.75)',
    fontSize: 16,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  windDistSubtext: {
    color: '#FF9500',
    fontSize: 8,
    fontWeight: '500' as const,
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  resetBtn: {
    position: 'absolute' as const,
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  zoomBtn: {
    position: 'absolute' as const,
    bottom: 90,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  miniCompassBox: {
    position: 'absolute' as const,
    right: 16,
  },
  clubBagBtn: {
    position: 'absolute' as const,
    bottom: 24,
    left: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
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
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  openBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  shotMarkerContainer: {
    alignItems: 'center' as const,
  },
  shotMarkerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 3,
    borderColor: '#34C759',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  shotMarkerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  shotLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 3,
    gap: 4,
  },
  shotLabelBubble: {
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.4)',
  },
  shotLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  shotDistanceBubble: {
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  shotDistanceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
});
