import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Calendar } from 'lucide-react-native';
import RoundStatsDisplay from '@/components/PlaSta/RoundStatsDisplay';
import { fetchLastRoundStats } from '@/services/roundStatsService';
import type { RoundStats } from '@/services/statsHelper';

export default function Step2Page1() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RoundStats | null>(null);
  const [courseName, setCourseName] = useState<string>('');
  const [roundDate, setRoundDate] = useState<string>('');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await fetchLastRoundStats();
      if (result) {
        setStats(result.stats);
        setCourseName(result.round.course_name);
        const date = new Date(result.round.created_at);
        setRoundDate(date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
      }
    } catch (e) {
      console.log('[PracticeStep2Page1] Error loading last round:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  if (!stats || stats.holesPlayed === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Last Round</Text>
        <Text style={styles.emptyText}>No completed rounds yet</Text>
        <Text style={styles.emptySubtext}>Play a round and finish it to see your stats here</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Last Round</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Calendar size={12} color="#FFFFFF" />
            <Text style={styles.metaText}>{roundDate}</Text>
          </View>
          {courseName ? (
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>{courseName}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <RoundStatsDisplay stats={stats} glassMode />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#8A9B90',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#5A6B60',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  header: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row' as const,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  metaBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
});
