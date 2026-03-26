import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import RoundStatsDisplay from '@/components/PlaSta/RoundStatsDisplay';
import { fetchAllTimeStats } from '@/services/roundStatsService';
import type { RoundStats } from '@/services/statsHelper';

export default function Step2Page2() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RoundStats | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await fetchAllTimeStats();
      if (result) {
        setStats(result);
      }
    } catch (e) {
      console.log('[PracticeStep2Page2] Error loading all-time stats:', e);
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
        <Text style={styles.emptyTitle}>All-Time Stats</Text>
        <Text style={styles.emptyText}>No round data yet</Text>
        <Text style={styles.emptySubtext}>Complete rounds to see your all-time averages here</Text>
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
        <Text style={styles.pageTitle}>All-Time Stats</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <TrendingUp size={12} color="#FFFFFF" />
            <Text style={styles.metaText}>{stats.holesPlayed} holes played</Text>
          </View>
        </View>
      </View>

      <RoundStatsDisplay stats={stats} headerLabel="CAREER AVERAGES" glassMode />

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
