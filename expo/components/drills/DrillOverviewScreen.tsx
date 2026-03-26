import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flag, Play, RotateCcw, Target, ArrowLeft } from 'lucide-react-native';
import type { CustomDrill } from './CreateDrillScreen';
import type { SensorDrill } from './CreateSensorDrillScreen';

type DrillItem = CustomDrill | SensorDrill;

interface DrillOverviewScreenProps {
  drill: DrillItem;
  onCancel: () => void;
  onStart: () => void;
  onSetPin: () => void;
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

const CATEGORY_COLORS: Record<string, string> = {
  Putting: '#2D6A4F',
  Wedges: '#E76F51',
  Irons: '#7B2CBF',
  Woods: '#40916C',
};

function isSensorDrill(drill: DrillItem): drill is SensorDrill {
  return 'isSensorDrill' in drill && drill.isSensorDrill === true;
}

export default function DrillOverviewScreen({ drill, onCancel, onStart, onSetPin }: DrillOverviewScreenProps) {
  const insets = useSafeAreaInsets();
  const isSensor = isSensorDrill(drill);
  const [pinSet, setPinSet] = useState(false);
  const [showPinWarning, setShowPinWarning] = useState(false);
  const shakeAnim = useState(new Animated.Value(0))[0];

  const handleSetPin = useCallback(() => {
    setPinSet(true);
    setShowPinWarning(false);
    onSetPin();
  }, [onSetPin]);

  const handleStart = useCallback(() => {
    if (isSensor && !pinSet) {
      setShowPinWarning(true);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      return;
    }
    onStart();
  }, [isSensor, pinSet, onStart, shakeAnim]);

  const catColor = CATEGORY_COLORS[drill.category] || '#2D6A4F';

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
          <View style={styles.backCircle}>
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drill Overview</Text>
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <TouchableOpacity
            onPress={handleSetPin}
            style={[styles.setPinBtn, pinSet && styles.setPinBtnActive]}
            activeOpacity={0.7}
          >
            <Flag size={16} color="#FFFFFF" />
            <Text style={styles.setPinText}>{pinSet ? 'Pin Set' : 'Set Pin'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {showPinWarning && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>Set Pin before starting Drill!</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={[styles.categoryBadge, { backgroundColor: catColor + '30' }]}>
          <Text style={[styles.categoryText, { color: '#FFFFFF' }]}>{drill.category}</Text>
        </View>

        <Text style={styles.drillName}>{drill.name}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <RotateCcw size={22} color="#C9A84C" strokeWidth={2} />
            <Text style={styles.statValue}>{drill.rounds}</Text>
            <Text style={styles.statLabel}>Rounds</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={22} color="#C9A84C" strokeWidth={2} />
            <Text style={styles.statValue}>{drill.targetsPerRound}</Text>
            <Text style={styles.statLabel}>Targets/Round</Text>
          </View>
          <View style={styles.statCard}>
            <Play size={22} color="#C9A84C" strokeWidth={2} />
            <Text style={styles.statValue}>{drill.totalShots}</Text>
            <Text style={styles.statLabel}>Total{'\n'}Shots</Text>
          </View>
        </View>

        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>How it works</Text>
          <Text style={styles.howText}>
            Each round shows {drill.targetsPerRound} targets. Tap the highest target you hit — all below it count as made. After all rounds, you'll see your score summary.
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <View style={styles.startButtonOuter}>
            <LinearGradient
              colors={['rgba(0,0,0,0.32)', 'rgba(0,0,0,0.22)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButton}
            >
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Drill</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  setPinBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 7,
  },
  setPinBtnActive: {
    backgroundColor: '#1B5E20',
  },
  setPinText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  warningBanner: {
    backgroundColor: 'rgba(255,243,205,0.9)',
    marginHorizontal: 20,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#856404',
    textAlign: 'center' as const,
  },
  body: {
    flex: 1,
    alignItems: 'center' as const,
    paddingTop: 30,
    paddingHorizontal: 24,
  },
  categoryBadge: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  drillName: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginBottom: 28,
    textAlign: 'center' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 14,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    gap: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center' as const,
  },
  howItWorks: {
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 16,
    padding: 20,
    width: '100%' as const,
  },
  howTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  howText: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 20,
  },
  startButtonOuter: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  startButton: {
    flexDirection: 'row' as const,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
