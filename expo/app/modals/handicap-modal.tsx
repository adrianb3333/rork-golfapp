import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '@/contexts/ProfileContext';

interface RoundEntry {
  date: string;
  course: string;
  roundNumber: number;
  before: number;
  result: number;
  after: number;
}

const MOCK_ROUNDS: RoundEntry[] = [
  { date: '2026-03-05', course: 'Ullna GK', roundNumber: 1, before: 14.2, result: 78, after: 13.9 },
  { date: '2026-02-28', course: 'Bro Hof Slott', roundNumber: 1, before: 14.5, result: 82, after: 14.2 },
  { date: '2026-02-20', course: 'Ullna GK', roundNumber: 2, before: 14.8, result: 85, after: 14.5 },
  { date: '2026-02-20', course: 'Ullna GK', roundNumber: 1, before: 15.0, result: 80, after: 14.8 },
  { date: '2026-02-10', course: 'Djursholms GK', roundNumber: 1, before: 15.1, result: 84, after: 15.0 },
  { date: '2026-01-30', course: 'Bro Hof Slott', roundNumber: 1, before: 15.6, result: 83, after: 15.1 },
  { date: '2026-01-15', course: 'Ullna GK', roundNumber: 1, before: 15.9, result: 81, after: 15.6 },
  { date: '2025-12-20', course: 'Djursholms GK', roundNumber: 1, before: 16.0, result: 86, after: 15.9 },
];

const SEASON_START_HANDICAP = 16.0;
const CURRENT_HANDICAP = 14.2;
const SEASON_PROGRESS = +(CURRENT_HANDICAP - SEASON_START_HANDICAP).toFixed(1);
const SEASON_TREND: 'up' | 'down' = CURRENT_HANDICAP > SEASON_START_HANDICAP ? 'up' : 'down';
const SEASON_LOWEST = 13.9;
const TOTAL_ROUNDS = 8;
const ROUNDS_UNDER = 5;
const ROUNDS_OVER = 3;

export default function HandicapModal() {
  const router = useRouter();
  const { profile } = useProfile();
  const username = profile?.display_name || profile?.username || 'User';
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);

  const selectedRound = MOCK_ROUNDS[selectedRoundIndex];

  const roundLabel = useMemo(() => {
    const r = MOCK_ROUNDS[selectedRoundIndex];
    const sameDay = MOCK_ROUNDS.filter(rd => rd.date === r.date && rd.course === r.course);
    if (sameDay.length > 1) {
      return `${r.date}  •  ${r.course} (${r.roundNumber})`;
    }
    return `${r.date}  •  ${r.course}`;
  }, [selectedRoundIndex]);

  const canGoLeft = selectedRoundIndex < MOCK_ROUNDS.length - 1;
  const canGoRight = selectedRoundIndex > 0;

  const maxBarValue = Math.max(ROUNDS_UNDER, ROUNDS_OVER);
  const overBarHeight = maxBarValue > 0 ? (ROUNDS_OVER / maxBarValue) * 120 : 0;
  const underBarHeight = maxBarValue > 0 ? (ROUNDS_UNDER / maxBarValue) * 120 : 0;

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <GlassBackButton onPress={() => router.back()} />
          <Text style={styles.headerTitle}>{username} Handicap</Text>
          <TouchableOpacity
            onPress={() => router.push('/modals/rounds-history-modal')}
            activeOpacity={0.7}
            testID="handicap-sgf-icon"
          >
            <Image
              source={require('@/assets/images/sgf-icon.png')}
              style={styles.sgfIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={styles.bodyContent}>
        <View style={styles.topSection}>
          <View style={styles.topRow}>
            <View style={styles.currentBlock}>
              <Text style={styles.handicapNumber}>{CURRENT_HANDICAP.toFixed(1)}</Text>
              <Text style={styles.currentLabel}>Player Current</Text>
            </View>

            <View style={styles.progressBlock}>
              <View style={styles.progressValueRow}>
                <Text style={styles.progressNumber}>
                  {SEASON_PROGRESS > 0 ? '+' : ''}{SEASON_PROGRESS.toFixed(1)}
                </Text>
                {SEASON_TREND === 'up' ? (
                  <TrendingUp size={14} color="#E74C3C" style={styles.trendIcon} />
                ) : (
                  <TrendingDown size={14} color="#2ECC40" style={styles.trendIcon} />
                )}
              </View>
              <Text style={styles.progressLabel}>Progress</Text>
            </View>
          </View>
        </View>

        <View style={styles.pastRoundsSection}>
          <Text style={styles.pastRoundsHeader}>Past Rounds</Text>
          <View style={styles.roundSelector}>
            <TouchableOpacity
              onPress={() => canGoLeft && setSelectedRoundIndex(prev => prev + 1)}
              activeOpacity={0.7}
              style={styles.roundArrow}
              disabled={!canGoLeft}
            >
              <ChevronLeft size={20} color={canGoLeft ? '#fff' : '#ffffff40'} />
            </TouchableOpacity>
            <View style={styles.roundLabelWrap}>
              <Text style={styles.roundLabelText} numberOfLines={1}>{roundLabel}</Text>
            </View>
            <TouchableOpacity
              onPress={() => canGoRight && setSelectedRoundIndex(prev => prev - 1)}
              activeOpacity={0.7}
              style={styles.roundArrow}
              disabled={!canGoRight}
            >
              <ChevronRight size={20} color={canGoRight ? '#fff' : '#ffffff40'} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.roundStatsRow}>
          <View style={styles.roundStatItem}>
            <Text style={styles.roundStatValue}>{selectedRound.before.toFixed(1)}</Text>
            <Text style={styles.roundStatLabel}>Before</Text>
          </View>
          <View style={styles.roundStatItem}>
            <Text style={styles.roundStatValue}>{selectedRound.result}</Text>
            <Text style={styles.roundStatLabel}>Result</Text>
          </View>
          <View style={styles.roundStatItem}>
            <Text style={styles.roundStatValue}>{selectedRound.after.toFixed(1)}</Text>
            <Text style={styles.roundStatLabel}>After</Text>
          </View>
        </View>

        <View style={styles.dividerLine} />

        <View style={styles.seasonHeaderRow}>
          <Text style={styles.seasonHeader}>Season Summary</Text>
          <Text style={styles.seasonSubtext}>(Jan-Dec)</Text>
        </View>

        <View style={styles.seasonContent}>
          <View style={styles.lowestSection}>
            <Text style={styles.lowestValue}>{SEASON_LOWEST.toFixed(1)}</Text>
            <Text style={styles.lowestLabel}>Lowest</Text>
          </View>

          <View style={styles.barsSection}>
            <View style={styles.totalRoundsWrap}>
              <Text style={styles.totalRoundsHeader}>Total Rounds</Text>
              <Text style={styles.totalRoundsValue}>{TOTAL_ROUNDS}</Text>
            </View>

            <View style={styles.barsRow}>
              <View style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, styles.barOver, { height: overBarHeight }]} />
                </View>
                <Text style={styles.barLabel}>Over</Text>
                <Text style={styles.barCount}>{ROUNDS_OVER}</Text>
              </View>
              <View style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, styles.barUnder, { height: underBarHeight }]} />
                </View>
                <Text style={styles.barLabel}>Under</Text>
                <Text style={styles.barCount}>{ROUNDS_UNDER}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeTop: {},
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  sgfIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: 'center' as const,
    marginBottom: 30,
  },
  topRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 32,
  },
  currentBlock: {
    alignItems: 'center' as const,
  },
  handicapNumber: {
    fontSize: 68,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 74,
  },
  currentLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffffCC',
    marginTop: 4,
  },
  progressBlock: {
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  progressValueRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  progressNumber: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: '#fff',
    lineHeight: 40,
  },
  trendIcon: {
    marginLeft: 2,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffffCC',
    marginTop: 4,
  },
  pastRoundsSection: {
    marginBottom: 20,
  },
  pastRoundsHeader: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 10,
  },
  roundSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#3279D7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  roundArrow: {
    padding: 4,
  },
  roundLabelWrap: {
    flex: 1,
    alignItems: 'center' as const,
  },
  roundLabelText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center' as const,
  },
  roundStatsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  roundStatItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  roundStatValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 4,
  },
  roundStatLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ffffffAA',
  },
  dividerLine: {
    height: 2,
    backgroundColor: '#3279D7',
    marginBottom: 20,
  },
  seasonHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    marginBottom: 20,
  },
  seasonHeader: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  seasonSubtext: {
    fontSize: 11,
    color: '#ffffffAA',
    marginLeft: 6,
    fontWeight: '500' as const,
  },
  seasonContent: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
  },
  lowestSection: {
    alignItems: 'center' as const,
    flex: 1,
  },
  lowestValue: {
    fontSize: 40,
    fontWeight: '900' as const,
    color: '#fff',
    marginBottom: 4,
  },
  lowestLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffffAA',
  },
  barsSection: {
    flex: 1.5,
    alignItems: 'center' as const,
  },
  totalRoundsWrap: {
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  totalRoundsHeader: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffffAA',
  },
  totalRoundsValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
    marginTop: 2,
  },
  barsRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 24,
  },
  barColumn: {
    alignItems: 'center' as const,
  },
  barTrack: {
    width: 40,
    height: 120,
    backgroundColor: '#ffffff20',
    borderRadius: 8,
    justifyContent: 'flex-end' as const,
    overflow: 'hidden' as const,
  },
  barFill: {
    width: '100%' as const,
    borderRadius: 8,
  },
  barOver: {
    backgroundColor: '#3279D7',
  },
  barUnder: {
    backgroundColor: '#fff',
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffffAA',
    marginTop: 6,
  },
  barCount: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
    marginTop: 2,
  },
});
