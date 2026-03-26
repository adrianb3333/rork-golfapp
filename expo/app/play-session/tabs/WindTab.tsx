import React, { useState, useEffect, useMemo } from "react";
import { StyleSheet, View, ScrollView, ActivityIndicator, Platform } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from 'expo-location';

import WindCompass from "@/components/WinCom/Index";
import BallFlightToggle from "@/components/WinCom/BallFlightToggle";
import DistanceInput from "@/components/WinCom/DistanceInput";
import AdjustedDistance from "@/components/WinCom/AdjustedDistance";
import StatCard from "@/components/reusables/StatCard";

import { useWeather } from "@/hooks/useWeather";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import { calculateGolfShot, decomposeWind, GolfCalculationResult } from "@/services/golfCalculations";
import Colors from '@/constants/colors';

type FlightOption = 'Low' | 'Normal' | 'High';

interface WindTabProps {
  externalDistance?: number;
  externalAdjustedDistance?: number;
}

export default function WindTab({ externalDistance, externalAdjustedDistance }: WindTabProps) {
  const [ballFlight, setBallFlight] = useState<FlightOption>('Normal');
  const [distance, setDistance] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const deviceHeading = useDeviceHeading();

  const { weather, loading } = useWeather(userLocation?.lat || null, userLocation?.lon || null, 0);

  const liveWind = useMemo(() => {
    if (!weather) return null;
    return decomposeWind(weather.windMs, weather.windDeg, deviceHeading);
  }, [weather, deviceHeading]);

  const calculation = useMemo<GolfCalculationResult | null>(() => {
    const distanceNum = parseFloat(distance);
    if (!weather || !liveWind || !(distanceNum > 0)) return null;
    return calculateGolfShot(
      distanceNum,
      ballFlight,
      weather.windMs,
      liveWind.headTail,
      liveWind.cross,
      weather.temp,
      weather.pressureMb
    );
  }, [distance, ballFlight, weather, liveWind]);

  useEffect(() => {
    if (externalDistance && externalDistance > 0) {
      console.log('[WindTab] Received live distance from GPS:', externalDistance);
      setDistance(String(externalDistance));
    }
  }, [externalDistance]);

  useEffect(() => {
    if (externalAdjustedDistance && externalAdjustedDistance > 0) {
      console.log('[WindTab] Received adjusted distance from GPS:', externalAdjustedDistance);
    }
  }, [externalAdjustedDistance]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setUserLocation({ lat: 59.3293, lon: 18.0686 });
      return;
    }

    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setUserLocation({ lat: 59.3293, lon: 18.0686 });
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });
      } catch {
        setUserLocation({ lat: 59.3293, lon: 18.0686 });
      }
    };

    void getLocation();
    const interval = setInterval(getLocation, 60000);
    return () => clearInterval(interval);
  }, []); 

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.compassWrapper}>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.white || "#ffffff"} />
            ) : (
              <WindCompass windDirectionFromAPI={weather?.windDeg || 0} deviceHeading={deviceHeading} />
            )}
          </View>

          <BallFlightToggle 
            selected={ballFlight} 
            onSelect={setBallFlight} 
          />

          <View style={styles.distanceRow}>
            <View style={styles.distanceInputWrapper}>
              <DistanceInput 
                value={distance} 
                onChange={setDistance}
                label="Distance to target (m)"
              />
            </View>
            
            {calculation && (
              <View style={styles.adjustedDistanceWrapper}>
                <AdjustedDistance
                  adjustedDistance={calculation.adjustedDistance}
                  originalDistance={calculation.originalDistance}
                  windAdjustment={calculation.windAdjustment}
                  tempAdjustment={calculation.tempAdjustment}
                  crosswindDrift={calculation.crosswindDrift}
                />
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard label="Wind💨" value={weather ? `${weather.windMs} m/s` : '-- m/s'} />
              <StatCard label="Sea Level🏔️" value={weather ? `${weather.seaLevel}m` : '--m'} />
              <StatCard label="Temp☀️" value={weather ? `${weather.temp}°C` : '--°C'} />
            </View>
            
            <View style={styles.statsRow}>
              <StatCard label="Speed🏎️" value={weather ? `${weather.windMs} m/s` : '-- m/s'} />
              <StatCard label="From" value={weather ? `${weather.windDeg}°` : '--°'} />
              <StatCard label="Gust" value={weather ? `${weather.gustMs} m/s` : '-- m/s'} />
            </View>
            
            <View style={styles.statsRow}>
              <StatCard label="Cross" value={liveWind ? `${liveWind.cross > 0 ? '+' : ''}${liveWind.cross} m/s` : '-- m/s'} />
              <StatCard label="Head/Tail" value={liveWind ? `${liveWind.headTail > 0 ? '+' : ''}${liveWind.headTail} m/s` : '-- m/s'} />
              <StatCard label="Update" value={weather?.lastUpdated || '--:--'} />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#020d12',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  compassWrapper: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 30,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statsRow: {
    flexDirection: 'row' as const,
    marginBottom: 8,
  },
  bottomSpacer: {
    height: 20,
  },
  distanceRow: {
    width: '100%' as const,
  },
  distanceInputWrapper: {
    width: '100%' as const,
  },
  adjustedDistanceWrapper: {
    width: '100%' as const,
  },
});
