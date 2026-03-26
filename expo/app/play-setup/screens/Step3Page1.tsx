import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Switch, Platform } from 'react-native';
import { Lock, Clock, Thermometer, Timer, Radio, Smartphone, BarChart3 } from 'lucide-react-native';
import { fetchGolfWeather } from '@/services/weatherApi';
import { useSensor } from '@/contexts/SensorContext';
import SensorLockOverlay from '@/components/SensorLockOverlay';

interface Step3Page1Props {
  onRoundNameChange?: (name: string) => void;
  roundDate: string;
  onPrivateChange?: (isPrivate: boolean) => void;
  onAdvancedDataChange?: (enabled: boolean) => void;
}

export default function Step3Page1({ onRoundNameChange, roundDate, onPrivateChange, onAdvancedDataChange }: Step3Page1Props) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [roundName, setRoundName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [sensorsEnabled, setSensorsEnabled] = useState<boolean>(false);
  const [deviceEnabled, setDeviceEnabled] = useState<boolean>(false);
  const [advancedData, setAdvancedData] = useState<boolean>(false);
  const { isPaired: sensorsPaired } = useSensor();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);
  const [tempLoading, setTempLoading] = useState(true);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    clockRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
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

  const handleNameChange = (text: string) => {
    setRoundName(text);
    onRoundNameChange?.(text);
  };

  const handlePrivateToggle = (val: boolean) => {
    setIsPrivate(val);
    onPrivateChange?.(val);
  };

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Session Overview</Text>

      <View style={styles.miniStatsRow}>
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

      <View style={styles.nameDateCard}>
        <View style={styles.nameDateRow}>
          <View style={styles.nameColumn}>
            <Text style={styles.columnLabel}>NAMN</Text>
            {isEditingName ? (
              <TextInput
                style={styles.nameInput}
                value={roundName}
                onChangeText={handleNameChange}
                onBlur={() => setIsEditingName(false)}
                autoFocus
                placeholder=""
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            ) : (
              <Pressable onPress={() => setIsEditingName(true)}>
                <Text style={styles.nameValue}>
                  {roundName || ' '}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={styles.dateColumn}>
            <Text style={styles.columnLabel}>DATUM</Text>
            <Text style={styles.dateValue}>{roundDate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.toggleCard}>
        <View style={styles.toggleLeft}>
          <View style={styles.toggleIcon}>
            <Lock size={20} color={isPrivate ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} strokeWidth={2} />
          </View>
          <Text style={styles.toggleText}>PRIVATE</Text>
        </View>
        <Switch
          value={isPrivate}
          onValueChange={handlePrivateToggle}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.35)' }}
          thumbColor={isPrivate ? '#FFFFFF' : '#CCC'}
          ios_backgroundColor="rgba(255,255,255,0.2)"
        />
      </View>

      <View style={styles.toggleCard}>
        <View style={styles.toggleLeft}>
          <View style={styles.toggleIcon}>
            <BarChart3 size={20} color={advancedData ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} strokeWidth={2} />
          </View>
          <View>
            <View style={styles.advancedRow}>
              <Text style={styles.toggleText}>ADVANCED DATA</Text>
              <Text style={styles.advancedMiniText}>For all players</Text>
            </View>
          </View>
        </View>
        <Switch
          value={advancedData}
          onValueChange={(val: boolean) => {
            setAdvancedData(val);
            onAdvancedDataChange?.(val);
          }}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.35)' }}
          thumbColor={advancedData ? '#FFFFFF' : '#CCC'}
          ios_backgroundColor="rgba(255,255,255,0.2)"
        />
      </View>

      <View style={styles.toggleCard}>
        {!sensorsPaired && <SensorLockOverlay compact />}
        <View style={styles.toggleLeft}>
          <View style={styles.toggleIcon}>
            <Radio size={20} color={sensorsEnabled ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} strokeWidth={2} />
          </View>
          <Text style={styles.toggleText}>SENSORS</Text>
        </View>
        <Switch
          value={sensorsEnabled}
          onValueChange={sensorsPaired ? setSensorsEnabled : undefined}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.35)' }}
          thumbColor={sensorsEnabled ? '#FFFFFF' : '#CCC'}
          ios_backgroundColor="rgba(255,255,255,0.2)"
          disabled={!sensorsPaired}
        />
      </View>

      <View style={styles.toggleCard}>
        {!sensorsPaired && <SensorLockOverlay compact />}
        <View style={styles.toggleLeft}>
          <View style={styles.toggleIcon}>
            <Smartphone size={20} color={deviceEnabled ? '#FFFFFF' : 'rgba(255,255,255,0.6)'} strokeWidth={2} />
          </View>
          <Text style={styles.toggleText}>DEVICE</Text>
        </View>
        <Switch
          value={deviceEnabled}
          onValueChange={sensorsPaired ? setDeviceEnabled : undefined}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.35)' }}
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
    paddingHorizontal: 24,
    paddingTop: 8,
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
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
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
  nameDateCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nameDateRow: {
    flexDirection: 'row' as const,
  },
  nameColumn: {
    flex: 1,
  },
  dateColumn: {
    flex: 1,
    alignItems: 'flex-end' as const,
  },
  columnLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  nameValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    minHeight: 22,
  },
  nameInput: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    padding: 0,
    margin: 0,
    minHeight: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#FFFFFF',
  },
  toggleCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
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
  advancedRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  advancedMiniText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic' as const,
  },
});
