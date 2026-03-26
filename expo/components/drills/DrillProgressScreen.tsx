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
import { ArrowLeft, TrendingUp } from 'lucide-react-native';
import type { CustomDrill } from '@/components/drills/CreateDrillScreen';
import type { SensorDrill } from '@/components/drills/CreateSensorDrillScreen';
import type { DrillHistoryEntry } from '@/components/drills/DrillHistoryScreen';

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

const CATEGORY_COLORS: Record<string, string> = {
  Putting: '#2D6A4F',
  Wedges: '#E76F51',
  Irons: '#7B2CBF',
  Woods: '#40916C',
  Driver: '#1B5E20',
};

interface DrillProgressScreenProps {
  onBack: () => void;
  drills: CustomDrill[];
  sensorDrills: SensorDrill[];
  history: DrillHistoryEntry[];
}

interface DrillStats {
  name: string;
  category: string;
  avgScore: number;
  totalRounds: number;
  lastPerformed: number | null;
  isSensor: boolean;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function DrillProgressScreen({ onBack, drills, sensorDrills, history }: DrillProgressScreenProps) {
  const insets = useSafeAreaInsets();

  const drillStats = useMemo(() => {
    const allDrills: { name: string; category: string; isSensor: boolean }[] = [
      ...drills.map(d => ({ name: d.name, category: d.category, isSensor: false })),
      ...sensorDrills.map(d => ({ name: d.name, category: d.category, isSensor: true })),
    ];

    const statsMap: DrillStats[] = allDrills.map(drill => {
      const drillHistory = history.filter(h => h.drillName === drill.name);
      const avgScore = drillHistory.length > 0
        ? Math.round(drillHistory.reduce((sum, h) => sum + h.percentage, 0) / drillHistory.length)
        : 0;
      const totalRounds = drillHistory.reduce((sum, h) => sum + h.rounds, 0);
      const lastPerformed = drillHistory.length > 0
        ? Math.max(...drillHistory.map(h => h.date))
        : null;

      return {
        name: drill.name,
        category: drill.category,
        avgScore,
        totalRounds,
        lastPerformed,
        isSensor: drill.isSensor,
      };
    });

    return statsMap;
  }, [drills, sensorDrills, history]);

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
        <Text style={styles.headerTitle}>Drill Progress</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {drillStats.length === 0 ? (
          <View style={styles.emptyState}>
            <TrendingUp size={36} color="rgba(255,255,255,0.35)" />
            <Text style={styles.emptyTitle}>No drills yet</Text>
            <Text style={styles.emptySubtitle}>
              Create and complete drills to see your progress
            </Text>
          </View>
        ) : (
          drillStats.map((drill, index) => {
            const catColor = CATEGORY_COLORS[drill.category] || '#2D6A4F';
            const barWidth = Math.max(drill.avgScore, 5);

            return (
              <View key={`${drill.name}-${index}`} style={styles.drillCard}>
                <View style={styles.drillCardBody}>
                  <View style={styles.drillCardTop}>
                    <View style={styles.drillCardInfo}>
                      <View style={styles.drillNameRow}>
                        <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
                        <Text style={styles.drillName}>{drill.name}</Text>
                        {drill.isSensor && (
                          <View style={styles.sensorBadge}>
                            <Text style={styles.sensorBadgeText}>Sensor</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.drillCategory}>{drill.category}</Text>
                    </View>
                    <View style={styles.avgBadge}>
                      <Text style={styles.avgValue}>{drill.avgScore}%</Text>
                      <Text style={styles.avgLabel}>AVG</Text>
                    </View>
                  </View>

                  <View style={styles.progressBarBg}>
                    <LinearGradient
                      colors={[catColor, catColor + 'AA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBarFill, { width: `${barWidth}%` as unknown as number }]}
                    />
                  </View>

                  <View style={styles.drillMetaRow}>
                    <Text style={styles.drillMetaText}>
                      {drill.totalRounds} round{drill.totalRounds !== 1 ? 's' : ''} completed
                    </Text>
                    {drill.lastPerformed && (
                      <Text style={styles.drillMetaDate}>
                        Last: {formatDate(drill.lastPerformed)}
                      </Text>
                    )}
                    {!drill.lastPerformed && (
                      <Text style={styles.drillMetaDate}>Not performed yet</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })
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
  drillCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
  },
  drillCardBody: {
    padding: 16,
    gap: 12,
  },
  drillCardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  drillCardInfo: {
    flex: 1,
    gap: 4,
  },
  drillNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  drillName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  sensorBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sensorBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  drillCategory: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
    marginLeft: 18,
  },
  avgBadge: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginLeft: 10,
  },
  avgValue: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  avgLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    marginTop: -2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  drillMetaRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  drillMetaText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  drillMetaDate: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.45)',
  },
});
