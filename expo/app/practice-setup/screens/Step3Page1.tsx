import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Switch } from 'react-native';
import { Clock, Thermometer, Timer, Radio, Smartphone } from 'lucide-react-native';

import { fetchGolfWeather } from '@/services/weatherApi';
import { useSession } from '@/contexts/SessionContext';
import { useSensor } from '@/contexts/SensorContext';
import SensorLockOverlay from '@/components/SensorLockOverlay';

export default function Step3Page1() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);
  const [tempLoading, setTempLoading] = useState(true);
  const { sensorsEnabled, setSensorsEnabled } = useSession();
  const [deviceEnabled, setDeviceEnabled] = useState<boolean>(false);
  const { isPaired: sensorsPaired } = useSensor();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const loadTemp = async () => {
      setTempLoading(true);
      try {
        if (Platform.OS !== 'web' || navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          const result = await fetchGolfWeather(position.coords.latitude, position.coords.longitude);
          if (result) {
            setTemperature(result.temp);
          }
        }
      } catch (e) {
        console.log('Could not get location/weather:', e);
        const result = await fetchGolfWeather(59.33, 18.07);
        if (result) {
          setTemperature(result.temp);
        }
      } finally {
        setTempLoading(false);
      }
    };
    void loadTemp();
  }, []);

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Session Overview</Text>

      <View
        style={styles.miniStatsRow}
      >
        <View style={styles.miniStat}>
          <Clock size={16} color="#FFFFFF" />
          <Text style={styles.miniStatLabel}>Time</Text>
          <Text style={styles.miniStatValue}>{formatTime(currentTime)}</Text>
        </View>
        <View style={styles.miniStatDivider} />
        <View style={styles.miniStat}>
          <Thermometer size={16} color="#FFFFFF" />
          <Text style={styles.miniStatLabel}>Temp</Text>
          <Text style={styles.miniStatValue}>
            {tempLoading ? '...' : temperature !== null ? `${temperature}°C` : '--°C'}
          </Text>
        </View>
        <View style={styles.miniStatDivider} />
        <View style={styles.miniStat}>
          <Timer size={16} color="#FFFFFF" />
          <Text style={styles.miniStatLabel}>Timer</Text>
          <Text style={styles.miniStatValue}>0:00</Text>
        </View>
      </View>

      <View style={[styles.toggleCard, { marginTop: 12 }]}>
        {!sensorsPaired && <SensorLockOverlay compact />}
        <View style={styles.toggleLeft}>
          <View style={styles.toggleIcon}>
            <Radio size={20} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.toggleText}>SENSORS</Text>
        </View>
        <Switch
          value={sensorsEnabled}
          onValueChange={sensorsPaired ? setSensorsEnabled : undefined}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#1075E3' }}
          thumbColor={sensorsEnabled ? '#FFFFFF' : '#CCC'}
          ios_backgroundColor="rgba(255,255,255,0.2)"
          disabled={!sensorsPaired}
        />
      </View>

      <View style={[styles.toggleCard, { marginTop: 12 }]}>
        {!sensorsPaired && <SensorLockOverlay compact />}
        <View style={styles.toggleLeft}>
          <View style={styles.toggleIcon}>
            <Smartphone size={20} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.toggleText}>DEVICE</Text>
        </View>
        <Switch
          value={deviceEnabled}
          onValueChange={sensorsPaired ? setDeviceEnabled : undefined}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#1075E3' }}
          thumbColor={deviceEnabled ? '#FFFFFF' : '#CCC'}
          ios_backgroundColor="rgba(255,255,255,0.2)"
          disabled={!sensorsPaired}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  miniStatsRow: {
    flexDirection: 'row' as const,
    borderRadius: 12,
    overflow: 'hidden' as const,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  miniStat: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 4,
  },
  miniStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 4,
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  toggleCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden' as const,
  },
  toggleLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
