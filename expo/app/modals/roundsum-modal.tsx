import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Flag } from 'lucide-react-native';
import { useSession } from '@/contexts/SessionContext';
import { useScoring } from '@/contexts/ScoringContext';
import { computeRoundStats, pctOf } from '@/services/statsHelper';

interface RoundSumModalProps {
  onClose: () => void;
  roundData: {
    totalScore: number;
    totalPar: number;
    holesPlayed: number;
    courseName: string;
    players: { name: string; score: number; toPar: string }[];
    roundDate: string;
    roundName: string;
    duration: string;
    temperature: number | null;
  };
}

export default function RoundSumModal({ onClose, roundData }: RoundSumModalProps) {
  const insets = useSafeAreaInsets();
  const { finishRoundWithData } = useSession();
  const { allScores, holes, completeSupabaseRound } = useScoring();

  const stats = useMemo(() => computeRoundStats(allScores, holes), [allScores, holes]);

  const scoreDiff = roundData.totalScore - roundData.totalPar;
  const toParDisplay = scoreDiff === 0 ? 'E' : scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`;

  const handleFinish = async () => {
    await completeSupabaseRound();
    finishRoundWithData({
      totalScore: roundData.totalScore,
      totalPar: roundData.totalPar,
      holesPlayed: roundData.holesPlayed,
      courseName: roundData.courseName,
      players: roundData.players.map((p) => p.name),
      roundDate: roundData.roundDate,
      roundName: roundData.roundName,
      duration: roundData.duration,
    });
    onClose();
  };

  const maxScoreCount = Math.max(...stats.scoreCategories.map((c) => c.count), 1);

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Round Summary</Text>
        <Text style={styles.headerSubtitle}>{roundData.courseName}</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreHero}>
          <Text style={styles.scoreHeroLabel}>Total Score</Text>
          <Text style={styles.scoreHeroValue}>{roundData.totalScore}</Text>
          <View style={[styles.toParBadge, scoreDiff < 0 && styles.toParUnder, scoreDiff === 0 && styles.toParEven]}>
            <Text style={styles.toParText}>{toParDisplay}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statGridBox}>
            <Text style={styles.statLabel}>Holes</Text>
            <Text style={styles.statValue}>{roundData.holesPlayed}</Text>
          </View>
          <View style={styles.statGridBox}>
            <Text style={styles.statLabel}>Par</Text>
            <Text style={styles.statValue}>{roundData.totalPar}</Text>
          </View>
          <View style={styles.statGridBox}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{roundData.duration}</Text>
          </View>
          <View style={styles.statGridBox}>
            <Text style={styles.statLabel}>Temp</Text>
            <Text style={styles.statValue}>{roundData.temperature !== null ? `${roundData.temperature}°C` : '--'}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Date</Text>
          <Text style={styles.dateValue}>{roundData.roundDate}</Text>
        </View>
        {roundData.roundName ? (
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Name</Text>
            <Text style={styles.dateValue}>{roundData.roundName}</Text>
          </View>
        ) : null}

        <View style={styles.playersSection}>
          <Text style={styles.playersSectionTitle}>Players</Text>
          {roundData.players.map((player, idx) => (
            <View key={idx} style={styles.playerRow}>
              <Text style={styles.playerPosition}>{idx + 1}.</Text>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerScore}>{player.score > 0 ? player.score : '—'}</Text>
              <Text style={styles.playerToPar}>{player.toPar}</Text>
            </View>
          ))}
        </View>

        {stats.holesPlayed > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.detailedTitle}>Detailed Stats</Text>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Score</Text>
              <View style={styles.barChart}>
                {stats.scoreCategories.map((cat) => {
                  const barH = Math.max((cat.count / maxScoreCount) * 80, 6);
                  return (
                    <View key={cat.label} style={styles.barColumn}>
                      <Text style={styles.barPct}>{cat.percentage}%</Text>
                      <View style={[styles.bar, { height: barH, backgroundColor: cat.color === '#FFFFFF' ? 'rgba(255,255,255,0.9)' : cat.color }]} />
                      <Text style={styles.barLabel}>{cat.label}</Text>
                      <Text style={styles.barCount}>{cat.count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Fairway</Text>
              <View style={styles.fairwayArc}>
                <View style={[styles.fairwaySegLeft, { opacity: stats.fairwayMissLeft > 0 ? 1 : 0.3 }]} />
                <View style={[styles.fairwaySegCenter, { opacity: stats.fairwayHit > 0 ? 1 : 0.3 }]} />
                <View style={[styles.fairwaySegRight, { opacity: stats.fairwayMissRight > 0 ? 1 : 0.3 }]} />
              </View>
              <View style={styles.fairwayStats}>
                <View style={styles.fairwayStat}>
                  <Text style={styles.fairwayPctRed}>{pctOf(stats.fairwayMissLeft, stats.fairwayTotal)}%</Text>
                  <Text style={styles.fairwayStatLabel}>Miss Left</Text>
                  <Text style={styles.fairwayStatCount}>{stats.fairwayMissLeft}</Text>
                </View>
                <View style={styles.fairwayStat}>
                  <Text style={styles.fairwayPctWhite}>{pctOf(stats.fairwayHit, stats.fairwayTotal)}%</Text>
                  <Text style={styles.fairwayStatLabelWhite}>Fairway</Text>
                  <Text style={styles.fairwayStatCount}>{stats.fairwayHit}</Text>
                </View>
                <View style={styles.fairwayStat}>
                  <Text style={styles.fairwayPctRed}>{pctOf(stats.fairwayMissRight, stats.fairwayTotal)}%</Text>
                  <Text style={styles.fairwayStatLabel}>Miss Right</Text>
                  <Text style={styles.fairwayStatCount}>{stats.fairwayMissRight}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>GIR</Text>
              <View style={styles.girVisual}>
                <View style={styles.girTop}>
                  <Text style={styles.girLabel}>Long</Text>
                  <Text style={styles.girPct}>{pctOf(stats.girMissLong, stats.girTotal)}%</Text>
                </View>
                <View style={styles.girMiddle}>
                  <View style={styles.girSide}>
                    <Text style={styles.girLabel}>Left</Text>
                    <Text style={styles.girPct}>{pctOf(stats.girMissLeft, stats.girTotal)}%</Text>
                  </View>
                  <View style={styles.girGreen}>
                    <Flag size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.girSide}>
                    <Text style={styles.girLabel}>Right</Text>
                    <Text style={styles.girPct}>{pctOf(stats.girMissRight, stats.girTotal)}%</Text>
                  </View>
                </View>
                <View style={styles.girBottom}>
                  <Text style={styles.girLabel}>Short</Text>
                  <Text style={styles.girPct}>{pctOf(stats.girMissShort, stats.girTotal)}%</Text>
                </View>
              </View>
              <View style={styles.girSummary}>
                <Text style={styles.girSummaryText}>Made: {stats.girMade}/{stats.girTotal} ({pctOf(stats.girMade, stats.girTotal)}%)</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Putting</Text>
              <View style={styles.puttSummary}>
                <View style={styles.puttItem}>
                  <Text style={styles.puttValue}>{stats.totalPutts}</Text>
                  <Text style={styles.puttLabel}>Total</Text>
                </View>
                <View style={styles.puttItem}>
                  <Text style={styles.puttValue}>{stats.avgPutts}</Text>
                  <Text style={styles.puttLabel}>Avg/Hole</Text>
                </View>
              </View>
              <View style={styles.barChart}>
                {[
                  { label: '1-Putt', count: stats.putts1, color: '#FFFFFF' },
                  { label: '2-Putt', count: stats.putts2, color: 'rgba(255,255,255,0.6)' },
                  { label: '3-Putt', count: stats.putts3, color: '#FF6B6B' },
                  { label: '4+', count: stats.putts4Plus, color: '#FF3B3B' },
                ].filter((d) => d.count > 0).map((item) => {
                  const maxP = Math.max(stats.putts1, stats.putts2, stats.putts3, stats.putts4Plus, 1);
                  const barH = Math.max((item.count / maxP) * 60, 6);
                  return (
                    <View key={item.label} style={styles.barColumn}>
                      <Text style={styles.barPct}>{pctOf(item.count, stats.holesPlayed)}%</Text>
                      <View style={[styles.bar, { height: barH, backgroundColor: item.color }]} />
                      <Text style={styles.barLabel}>{item.label}</Text>
                      <Text style={styles.barCount}>{item.count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Bunker, Penalty, Chips</Text>
              <View style={styles.boxRow}>
                <View style={styles.miniBox}>
                  <Text style={styles.miniBoxValue}>{stats.totalBunker}</Text>
                  <Text style={styles.miniBoxLabel}>Bunker</Text>
                </View>
                <View style={styles.miniBox}>
                  <Text style={styles.miniBoxValue}>{stats.totalPenalty}</Text>
                  <Text style={styles.miniBoxLabel}>Penalty</Text>
                </View>
                <View style={styles.miniBox}>
                  <Text style={styles.miniBoxValue}>{stats.totalChips}</Text>
                  <Text style={styles.miniBoxLabel}>Chips</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Sand Saves, Up & Downs</Text>
              <View style={styles.boxRow}>
                <View style={styles.miniBoxWide}>
                  <Text style={styles.miniBoxValue}>{stats.totalSandSaves}/{stats.totalSandSaveAttempts}</Text>
                  <Text style={styles.miniBoxLabel}>Sand Saves</Text>
                </View>
                <View style={styles.miniBoxWide}>
                  <Text style={styles.miniBoxValue}>{stats.totalUpAndDowns}/{stats.totalUpAndDownAttempts}</Text>
                  <Text style={styles.miniBoxLabel}>Up & Downs</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinish} activeOpacity={0.8}>
          <Text style={styles.finishButtonText}>Finish</Text>
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
    alignItems: 'center' as const,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scoreHero: {
    alignItems: 'center' as const,
    paddingVertical: 32,
  },
  scoreHeroLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  scoreHeroValue: {
    fontSize: 72,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginTop: 4,
  },
  toParBadge: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  toParUnder: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  toParEven: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  toParText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  statGridBox: {
    flex: 1,
    minWidth: '45%' as unknown as number,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase' as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dateLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500' as const,
  },
  dateValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  playersSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  playersSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  playerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  playerPosition: {
    width: 28,
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  playerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  playerScore: {
    width: 50,
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  playerToPar: {
    width: 50,
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 20,
  },
  detailedTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  barChart: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingTop: 8,
  },
  barColumn: {
    alignItems: 'center' as const,
    minWidth: 32,
    flex: 1,
  },
  barPct: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bar: {
    width: '65%' as unknown as number,
    borderRadius: 5,
    minWidth: 14,
  },
  barLabel: {
    fontSize: 7,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center' as const,
  },
  barCount: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginTop: 1,
  },
  fairwayArc: {
    flexDirection: 'row' as const,
    height: 36,
    width: 180,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    overflow: 'hidden' as const,
    marginBottom: 12,
    alignSelf: 'center' as const,
  },
  fairwaySegLeft: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderTopLeftRadius: 90,
  },
  fairwaySegCenter: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fairwaySegRight: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderTopRightRadius: 90,
  },
  fairwayStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  fairwayStat: {
    alignItems: 'center' as const,
    flex: 1,
  },
  fairwayPctRed: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FF6B6B',
  },
  fairwayPctWhite: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  fairwayStatLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  fairwayStatLabelWhite: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginTop: 2,
  },
  fairwayStatCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginTop: 1,
  },
  girVisual: {
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  girTop: {
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  girMiddle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%' as unknown as number,
    marginBottom: 6,
  },
  girSide: {
    flex: 1,
    alignItems: 'center' as const,
  },
  girGreen: {
    width: 60,
    height: 45,
    borderRadius: 30,
    backgroundColor: 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  girBottom: {
    alignItems: 'center' as const,
    marginTop: 6,
  },
  girLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  girPct: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  girSummary: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    marginTop: 8,
    alignItems: 'center' as const,
  },
  girSummaryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.8)',
  },
  puttSummary: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: 12,
  },
  puttItem: {
    alignItems: 'center' as const,
  },
  puttValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  puttLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  boxRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  miniBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  miniBoxWide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  miniBoxValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  miniBoxLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  finishButton: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
