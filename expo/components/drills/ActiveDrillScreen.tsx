import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ArrowLeft, Plane, Navigation } from 'lucide-react-native';
import type { CustomDrill } from './CreateDrillScreen';
import type { SensorDrill } from './CreateSensorDrillScreen';

type DrillItem = CustomDrill | SensorDrill;

export interface DrillResult {
  roundScores: number[];
  totalHits: number;
  totalShots: number;
  percentage: number;
}

interface ActiveDrillScreenProps {
  drill: DrillItem;
  onBack: () => void;
  onFinish: (result: DrillResult) => void;
  onNavigateToTab?: (tab: 'flight' | 'position') => void;
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

export default function ActiveDrillScreen({ drill, onBack, onFinish, onNavigateToTab }: ActiveDrillScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentRound, setCurrentRound] = useState(0);
  const [roundHighest, setRoundHighest] = useState<number[]>(
    Array.from({ length: drill.rounds }, () => 0)
  );

  const currentHits = useMemo(() => {
    return roundHighest[currentRound] ?? 0;
  }, [roundHighest, currentRound]);

  const totalHitsAllRounds = useMemo(() => {
    return roundHighest.reduce((sum, h) => sum + h, 0);
  }, [roundHighest]);

  const totalShotsSoFar = useMemo(() => {
    return (currentRound + 1) * drill.targetsPerRound;
  }, [currentRound, drill.targetsPerRound]);

  const liveAvg = useMemo(() => {
    if (totalShotsSoFar === 0) return 0;
    return Math.round((totalHitsAllRounds / totalShotsSoFar) * 100);
  }, [totalHitsAllRounds, totalShotsSoFar]);

  const isLastRound = currentRound === drill.rounds - 1;

  const toggleTarget = useCallback((targetIndex: number) => {
    const targetNumber = targetIndex + 1;
    setRoundHighest(prev => {
      const updated = [...prev];
      const currentHighest = updated[currentRound];
      if (targetNumber === currentHighest) {
        updated[currentRound] = targetNumber - 1;
      } else {
        updated[currentRound] = targetNumber;
      }
      return updated;
    });
  }, [currentRound]);

  const handleNextRound = useCallback(() => {
    if (isLastRound) {
      const allHits = roundHighest.reduce((sum, h) => sum + h, 0);
      const total = drill.rounds * drill.targetsPerRound;
      const pct = total > 0 ? Math.round((allHits / total) * 100) : 0;
      onFinish({
        roundScores: roundHighest,
        totalHits: allHits,
        totalShots: total,
        percentage: pct,
      });
    } else {
      setCurrentRound(prev => prev + 1);
    }
  }, [isLastRound, roundHighest, drill, onFinish]);

  const highestInRound = roundHighest[currentRound] ?? 0;

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <View style={styles.backCircle}>
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{drill.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressBarContainer}>
        {Array.from({ length: drill.rounds }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i <= currentRound ? styles.progressSegmentActive : styles.progressSegmentInactive,
              i < drill.rounds - 1 && { marginRight: 4 },
            ]}
          />
        ))}
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statItemLabel}>Round</Text>
          <Text style={styles.statItemValue}>{currentRound + 1}/{drill.rounds}</Text>
        </View>
        <View style={[styles.statItem, styles.statItemBorder]}>
          <Text style={styles.statItemLabel}>Hits</Text>
          <Text style={[styles.statItemValue, styles.statItemHits]}>{currentHits}/{drill.targetsPerRound}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statItemLabel}>Live Avg</Text>
          <Text style={[styles.statItemValue, styles.statItemAvg]}>{liveAvg}%</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tapInstruction}>Tap the highest target you hit</Text>

        <View style={styles.targetsGrid}>
          {Array.from({ length: drill.targetsPerRound }).map((_, idx) => {
            const targetNumber = idx + 1;
            const isHit = targetNumber <= highestInRound;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.targetCircle, isHit && styles.targetCircleHit]}
                onPress={() => toggleTarget(idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.targetText, isHit && styles.targetTextHit]}>
                  {targetNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerRow}>
          {onNavigateToTab && (
            <TouchableOpacity
              onPress={() => onNavigateToTab('flight')}
              activeOpacity={0.7}
              style={styles.navCircleWrap}
            >
              <View style={styles.navCircle}>
                <Plane size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.navCircleLabel}>Flight</Text>
            </TouchableOpacity>
          )}

          <View style={styles.nextButtonFlex}>
            <TouchableOpacity
              onPress={handleNextRound}
              activeOpacity={0.8}
            >
              <View style={styles.nextButtonOuter}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.32)', 'rgba(0,0,0,0.22)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextButtonText}>
                    {isLastRound ? 'Finish Drill' : 'Next Round'}
                  </Text>
                  <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </View>

          {onNavigateToTab && (
            <TouchableOpacity
              onPress={() => onNavigateToTab('position')}
              activeOpacity={0.7}
              style={styles.navCircleWrap}
            >
              <View style={styles.navCircle}>
                <Navigation size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.navCircleLabel}>Position</Text>
            </TouchableOpacity>
          )}
        </View>
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
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
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
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 38,
  },
  progressBarContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#FFFFFF',
  },
  progressSegmentInactive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statsBar: {
    flexDirection: 'row' as const,
    marginHorizontal: 20,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    overflow: 'hidden' as const,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 14,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: GLASS_BORDER,
  },
  statItemLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 4,
  },
  statItemValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  statItemHits: {
    color: '#7AE582',
  },
  statItemAvg: {
    color: '#FFD166',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tapInstruction: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  targetsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: 16,
  },
  targetCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GLASS_BG,
    borderWidth: 2,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  targetCircleHit: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  targetText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.55)',
  },
  targetTextHit: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 16,
  },
  footerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  navCircleWrap: {
    alignItems: 'center' as const,
    gap: 4,
  },
  navCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  navCircleLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  nextButtonFlex: {
    flex: 1,
  },
  nextButtonOuter: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  nextButton: {
    flexDirection: 'row' as const,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
