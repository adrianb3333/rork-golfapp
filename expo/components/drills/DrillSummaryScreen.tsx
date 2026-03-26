import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { RotateCcw, Home, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { DrillResult } from './ActiveDrillScreen';
import type { CustomDrill } from './CreateDrillScreen';
import type { SensorDrill } from './CreateSensorDrillScreen';

type DrillItem = CustomDrill | SensorDrill;

interface DrillSummaryScreenProps {
  drill: DrillItem;
  result: DrillResult;
  onRetry: () => void;
  onHome: () => void;
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

const SIZE = 160;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreColor(pct: number): string {
  if (pct >= 80) return '#7AE582';
  if (pct >= 50) return '#FFD166';
  return '#EF476F';
}

export default function DrillSummaryScreen({ drill, result, onRetry, onHome }: DrillSummaryScreenProps) {
  const insets = useSafeAreaInsets();
  const strokeDashoffset = CIRCUMFERENCE * (1 - result.percentage / 100);
  const scoreColor = getScoreColor(result.percentage);

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 20 }]}>
        <View style={styles.circleContainer}>
          <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              stroke="rgba(255,255,255,0.12)"
              fill="none"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE_WIDTH}
            />
            <Circle
              stroke={scoreColor}
              fill="none"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </Svg>
          <View style={styles.circleInner}>
            <Award size={24} color={scoreColor} strokeWidth={1.5} />
            <Text style={[styles.percentText, { color: scoreColor }]}>{result.percentage}%</Text>
            <Text style={styles.overallLabel}>Overall Score</Text>
          </View>
        </View>

        <Text style={styles.drillName}>{drill.name}</Text>
        <Text style={styles.hitsText}>{result.totalHits} / {result.totalShots} targets hit</Text>

        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>ROUND BREAKDOWN</Text>
          {result.roundScores.map((score, idx) => {
            const roundPct = drill.targetsPerRound > 0 ? score / drill.targetsPerRound : 0;
            return (
              <View key={idx} style={styles.roundRow}>
                <Text style={styles.roundLabel}>Round {idx + 1}</Text>
                <View style={styles.roundBarBg}>
                  <View style={[styles.roundBarFill, { width: `${roundPct * 100}%` }]} />
                </View>
                <Text style={styles.roundScore}>{score}/{drill.targetsPerRound}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={onRetry}
            style={styles.retryButton}
            activeOpacity={0.8}
          >
            <RotateCcw size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onHome}
            activeOpacity={0.8}
            style={styles.homeButton}
          >
            <LinearGradient
              colors={['#2E7D32', '#1B5E20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.homeGradient}
            >
              <Home size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.homeText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center' as const,
  },
  circleContainer: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  circleInner: {
    position: 'absolute' as const,
    alignItems: 'center' as const,
    gap: 2,
  },
  percentText: {
    fontSize: 36,
    fontWeight: '900' as const,
  },
  overallLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
  },
  drillName: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  hitsText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 30,
  },
  breakdownCard: {
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 18,
    padding: 20,
    width: '90%',
    marginBottom: 30,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  roundRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
    gap: 12,
  },
  roundLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    width: 70,
  },
  roundBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  roundBarFill: {
    height: 8,
    backgroundColor: '#C9A84C',
    borderRadius: 4,
  },
  roundScore: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    width: 45,
    textAlign: 'right' as const,
  },
  footer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    gap: 12,
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: GLASS_BG,
  },
  retryText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  homeButton: {
    flex: 1.4,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  homeGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  homeText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
