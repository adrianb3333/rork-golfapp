import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, TrendingUp, Calendar, Crosshair } from 'lucide-react-native';

export interface DrillHistoryEntry {
  id: string;
  drillName: string;
  date: number;
  rounds: number;
  targetsPerRound: number;
  roundScores: number[];
  totalHits: number;
  totalShots: number;
  percentage: number;
}

interface DrillHistoryScreenProps {
  onBack: () => void;
  history: DrillHistoryEntry[];
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getPercentColor(pct: number): string {
  if (pct >= 80) return '#2D6A4F';
  if (pct >= 50) return '#E76F51';
  return '#C1121F';
}

export default function DrillHistoryScreen({ onBack, history }: DrillHistoryScreenProps) {
  const insets = useSafeAreaInsets();

  const avgScore = useMemo(() => {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, h) => sum + h.percentage, 0);
    return Math.round(total / history.length);
  }, [history]);

  const drillsSinceJan = useMemo(() => {
    const now = new Date();
    const janFirst = new Date(now.getFullYear(), 0, 1).getTime();
    return history.filter(h => h.date >= janFirst).length;
  }, [history]);

  const totalDrillShots = useMemo(() => {
    return history.reduce((sum, h) => sum + h.totalShots, 0);
  }, [history]);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => b.date - a.date);
  }, [history]);

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
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statBoxGradient}
            >
              <View style={styles.statBoxInner}>
                <TrendingUp size={22} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.statValue}>{avgScore}%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.statBox}>
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statBoxGradient}
            >
              <View style={styles.statBoxInner}>
                <Calendar size={22} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.statValue}>{drillsSinceJan}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.statBox}>
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statBoxGradient}
            >
              <View style={styles.statBoxInner}>
                <Crosshair size={22} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.statValue}>{totalDrillShots}</Text>
                <Text style={styles.statLabel}>Total Drill Shots</Text>
                <Text style={styles.statSubLabel}>(Sensors Only)</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {sortedHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete a drill to see your results here
            </Text>
          </View>
        ) : (
          sortedHistory.map((entry) => (
            <View key={entry.id} style={styles.historyCard}>
              <View style={styles.historyCardBorder}>
                <View style={styles.historyCardBody}>
                  <View style={styles.historyCardTop}>
                    <View style={styles.historyCardInfo}>
                      <Text style={styles.historyDrillName}>{entry.drillName}</Text>
                      <Text style={styles.historyMeta}>
                        {entry.totalHits}/{entry.totalShots} hits · {entry.rounds} round{entry.rounds !== 1 ? 's' : ''}
                      </Text>
                      <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                    </View>
                    <View style={[styles.percentBadge, { backgroundColor: getPercentColor(entry.percentage) + '18' }]}>
                      <Text style={[styles.percentText, { color: getPercentColor(entry.percentage) }]}>
                        {entry.percentage}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.roundsRow}>
                    {entry.roundScores.map((score, idx) => (
                      <View key={idx} style={styles.roundChip}>
                        <Text style={styles.roundChipText}>
                          R{idx + 1}: {score}/{entry.targetsPerRound}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  statBoxGradient: {
    borderRadius: 16,
  },
  statBoxInner: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center' as const,
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
  },
  statSubLabel: {
    fontSize: 9,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.4)',
    marginTop: -4,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 50,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center' as const,
    maxWidth: 240,
    lineHeight: 20,
  },
  historyCard: {
    marginBottom: 12,
  },
  historyCardBorder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2D6A4F',
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  historyCardBody: {
    padding: 16,
    gap: 12,
  },
  historyCardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  historyCardInfo: {
    flex: 1,
    gap: 2,
  },
  historyDrillName: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
  historyMeta: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#666',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#999',
    marginTop: 1,
  },
  percentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 12,
  },
  percentText: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  roundsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  roundChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  roundChipText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#444',
  },
});
