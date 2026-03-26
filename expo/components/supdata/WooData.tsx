import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchDrillHistory, DrillResultRow } from '@/services/drillResultsService';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function WooData() {
  const [drills, setDrills] = useState<DrillResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const results = await fetchDrillHistory();
        const woodsDrills = results.filter(r => r.category === 'Woods' || r.category === 'Driver');
        setDrills(woodsDrills);
        console.log('[WooData] Loaded woods/driver drills:', woodsDrills.length);
      } catch (e) {
        console.log('[WooData] Error loading drills:', e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, { entries: DrillResultRow[]; avgPct: number; lastDate: string }> = {};
    drills.forEach(d => {
      if (!map[d.drill_name]) {
        map[d.drill_name] = { entries: [], avgPct: 0, lastDate: '' };
      }
      map[d.drill_name].entries.push(d);
    });
    Object.keys(map).forEach(key => {
      const entries = map[key].entries;
      map[key].avgPct = Math.round(entries.reduce((s, e) => s + e.percentage, 0) / entries.length);
      const sorted = [...entries].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
      map[key].lastDate = sorted[0]?.completed_at ?? '';
    });
    return map;
  }, [drills]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  const drillNames = Object.keys(grouped);

  if (drillNames.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No woods/driver drill data yet</Text>
        <Text style={styles.emptySubtext}>Complete woods or driver drills to see stats here</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {drillNames.map((name) => {
        const data = grouped[name];
        return (
          <View key={name} style={styles.drillCard}>
            <View style={styles.drillCardTop}>
              <View style={styles.drillInfo}>
                <Text style={styles.drillName}>{name}</Text>
                <Text style={styles.drillMeta}>
                  {data.entries.length} session{data.entries.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.avgBadge}>
                <Text style={styles.avgValue}>{data.avgPct}%</Text>
                <Text style={styles.avgLabel}>AVG</Text>
              </View>
            </View>
            {data.lastDate ? (
              <Text style={styles.lastDate}>Last: {formatDate(data.lastDate)}</Text>
            ) : null}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.max(data.avgPct, 5)}%` as unknown as number }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%' as unknown as number,
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  drillCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  drillCardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  drillInfo: {
    flex: 1,
    gap: 2,
  },
  drillName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  drillMeta: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
  },
  avgBadge: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginLeft: 8,
  },
  avgValue: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  avgLabel: {
    fontSize: 8,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    marginTop: -2,
  },
  lastDate: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.4)',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#40916C',
  },
});
