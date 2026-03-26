import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flag } from 'lucide-react-native';
import type { RoundStats } from '@/services/statsHelper';
import { getToParString, pctOf } from '@/services/statsHelper';

interface RoundStatsDisplayProps {
  stats: RoundStats;
  headerLabel?: string;
  glassMode?: boolean;
}

export default function RoundStatsDisplay({ stats, headerLabel, glassMode }: RoundStatsDisplayProps) {
  const toParStr = getToParString(stats.scoreToPar);

  return (
    <View style={styles.wrapper}>
      {headerLabel ? (
        <Text style={[styles.headerLabel, glassMode && { color: 'rgba(255,255,255,0.5)' }]}>{headerLabel}</Text>
      ) : null}

      <View style={[styles.heroRow, glassMode && glassCard]}>
        <View style={styles.heroItem}>
          <Text style={styles.heroLabel}>Shots</Text>
          <Text style={styles.heroValue}>{stats.totalShots}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroItem}>
          <Text style={styles.heroLabel}>Score</Text>
          <Text style={[styles.heroValue, stats.scoreToPar < 0 && styles.heroUnder, stats.scoreToPar > 0 && styles.heroOver]}>{toParStr}</Text>
        </View>
      </View>

      {stats.scoreCategories.length > 0 && <ScoreSection categories={stats.scoreCategories} glass={glassMode} />}
      {stats.fairwayTotal > 0 && <FairwaySection hit={stats.fairwayHit} missLeft={stats.fairwayMissLeft} missRight={stats.fairwayMissRight} total={stats.fairwayTotal} glass={glassMode} />}
      {stats.girTotal > 0 && <GIRSection made={stats.girMade} missShort={stats.girMissShort} missLong={stats.girMissLong} missLeft={stats.girMissLeft} missRight={stats.girMissRight} total={stats.girTotal} glass={glassMode} />}
      {stats.holesPlayed > 0 && <PuttingSection p1={stats.putts1} p2={stats.putts2} p3={stats.putts3} p4={stats.putts4Plus} totalPutts={stats.totalPutts} avgPutts={stats.avgPutts} holesPlayed={stats.holesPlayed} glass={glassMode} />}
      {(stats.totalBunker > 0 || stats.totalPenalty > 0 || stats.totalChips > 0) && <ExtraSection bunker={stats.totalBunker} penalty={stats.totalPenalty} chips={stats.totalChips} totalShots={stats.totalShots} glass={glassMode} />}
      {(stats.totalSandSaveAttempts > 0 || stats.totalUpAndDownAttempts > 0) && <SavesSection sandSaves={stats.totalSandSaves} sandAttempts={stats.totalSandSaveAttempts} upDowns={stats.totalUpAndDowns} upDownAttempts={stats.totalUpAndDownAttempts} glass={glassMode} />}
    </View>
  );
}

function ScoreSection({ categories, glass }: { categories: { label: string; count: number; percentage: number; color: string }[]; glass?: boolean }) {
  const maxCount = Math.max(...categories.map((c) => c.count), 1);
  const MAX_BAR = 100;

  return (
    <View style={[styles.sectionCard, glass && glassCard]}>
      <Text style={styles.sectionTitle}>Score</Text>
      <View style={styles.barChart}>
        {categories.map((cat) => {
          const barH = Math.max((cat.count / maxCount) * MAX_BAR, 6);
          const isWhite = cat.color === '#FFFFFF';
          return (
            <View key={cat.label} style={styles.barColumn}>
              <Text style={styles.barPct}>{cat.percentage}%</Text>
              <View style={[styles.bar, { height: barH, backgroundColor: cat.color, borderWidth: isWhite ? 1 : 0, borderColor: isWhite ? '#ccc' : 'transparent' }]} />
              <Text style={styles.barLabel}>{cat.label}</Text>
              <Text style={styles.barCount}>{cat.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function FairwaySection({ hit, missLeft, missRight, total, glass }: { hit: number; missLeft: number; missRight: number; total: number; glass?: boolean }) {
  const hitPct = pctOf(hit, total);
  const leftPct = pctOf(missLeft, total);
  const rightPct = pctOf(missRight, total);

  return (
    <View style={[styles.sectionCard, glass && glassCard]}>
      <Text style={styles.sectionTitle}>Fairway</Text>
      <View style={styles.fairwayVisual}>
        <View style={styles.fairwayArc}>
          <View style={[styles.fairwaySegLeft, { opacity: leftPct > 0 ? 1 : 0.3 }]} />
          <View style={[styles.fairwaySegCenter, { opacity: hitPct > 0 ? 1 : 0.3 }]} />
          <View style={[styles.fairwaySegRight, { opacity: rightPct > 0 ? 1 : 0.3 }]} />
        </View>
        <View style={styles.fairwayStats}>
          <View style={styles.fairwayStat}>
            <Text style={styles.fairwayStatPct}>{leftPct}%</Text>
            <Text style={styles.fairwayStatLabel}>Miss Left</Text>
            <Text style={styles.fairwayStatCount}>{missLeft}</Text>
          </View>
          <View style={styles.fairwayStat}>
            <Text style={[styles.fairwayStatPct, styles.fairwayHitPct]}>{hitPct}%</Text>
            <Text style={[styles.fairwayStatLabel, styles.fairwayHitLabel]}>Fairway</Text>
            <Text style={styles.fairwayStatCount}>{hit}</Text>
          </View>
          <View style={styles.fairwayStat}>
            <Text style={styles.fairwayStatPct}>{rightPct}%</Text>
            <Text style={styles.fairwayStatLabel}>Miss Right</Text>
            <Text style={styles.fairwayStatCount}>{missRight}</Text>
          </View>
        </View>
      </View>
      <View style={styles.fairwaySummaryRow}>
        <Text style={styles.fairwaySummaryText}>Hit: {hit}/{total}</Text>
        <Text style={styles.fairwaySummaryText}>{hitPct}% accuracy</Text>
      </View>
    </View>
  );
}

function GIRSection({ made, missShort, missLong, missLeft, missRight, total, glass }: { made: number; missShort: number; missLong: number; missLeft: number; missRight: number; total: number; glass?: boolean }) {
  const madePct = pctOf(made, total);
  const shortPct = pctOf(missShort, total);
  const longPct = pctOf(missLong, total);
  const leftPct = pctOf(missLeft, total);
  const rightPct = pctOf(missRight, total);
  const missed = total - made;

  return (
    <View style={[styles.sectionCard, glass && glassCard]}>
      <Text style={styles.sectionTitle}>GIR</Text>
      <View style={styles.girVisual}>
        <View style={styles.girTop}>
          <Text style={styles.girDirectionLabel}>Long</Text>
          <Text style={styles.girDirectionPct}>{longPct}%</Text>
        </View>
        <View style={styles.girMiddle}>
          <View style={styles.girSide}>
            <Text style={styles.girDirectionLabel}>Left</Text>
            <Text style={styles.girDirectionPct}>{leftPct}%</Text>
          </View>
          <View style={styles.girGreen}>
            <Flag size={20} color="#e53935" />
            <View style={styles.girGreenOval} />
          </View>
          <View style={styles.girSide}>
            <Text style={styles.girDirectionLabel}>Right</Text>
            <Text style={styles.girDirectionPct}>{rightPct}%</Text>
          </View>
        </View>
        <View style={styles.girBottom}>
          <Text style={styles.girDirectionLabel}>Short</Text>
          <Text style={styles.girDirectionPct}>{shortPct}%</Text>
        </View>
      </View>
      <View style={styles.girSummaryRow}>
        <View style={styles.girSummaryItem}>
          <Text style={styles.girSummaryValue}>{made}/{total}</Text>
          <Text style={styles.girSummaryLabel}>Made ({madePct}%)</Text>
        </View>
        <View style={styles.girSummaryItem}>
          <Text style={styles.girSummaryValue}>{missed}/{total}</Text>
          <Text style={styles.girSummaryLabel}>Missed ({pctOf(missed, total)}%)</Text>
        </View>
      </View>
    </View>
  );
}

function PuttingSection({ p1, p2, p3, p4, totalPutts, avgPutts, holesPlayed, glass }: { p1: number; p2: number; p3: number; p4: number; totalPutts: number; avgPutts: number; holesPlayed: number; glass?: boolean }) {
  const puttData: { label: string; count: number; color: string }[] = [];
  if (p1 > 0) puttData.push({ label: '1-Putt', count: p1, color: '#FFFFFF' });
  if (p2 > 0) puttData.push({ label: '2-Putt', count: p2, color: '#888888' });
  if (p3 > 0) puttData.push({ label: '3-Putt', count: p3, color: '#e53935' });
  if (p4 > 0) puttData.push({ label: '4+ Putt', count: p4, color: '#B71C1C' });

  const maxCount = Math.max(...puttData.map((d) => d.count), 1);
  const MAX_BAR = 80;

  return (
    <View style={[styles.sectionCard, glass && glassCard]}>
      <Text style={styles.sectionTitle}>Putting</Text>
      <View style={styles.puttSummaryRow}>
        <View style={styles.puttSummaryItem}>
          <Text style={styles.puttSummaryValue}>{totalPutts}</Text>
          <Text style={styles.puttSummaryLabel}>Total Putts</Text>
        </View>
        <View style={styles.puttSummaryItem}>
          <Text style={styles.puttSummaryValue}>{avgPutts}</Text>
          <Text style={styles.puttSummaryLabel}>Avg / Hole</Text>
        </View>
      </View>
      {puttData.length > 0 && (
        <View style={styles.barChart}>
          {puttData.map((item) => {
            const barH = Math.max((item.count / maxCount) * MAX_BAR, 6);
            return (
              <View key={item.label} style={styles.barColumn}>
                <Text style={styles.barPct}>{pctOf(item.count, holesPlayed)}%</Text>
                <View style={[styles.bar, { height: barH, backgroundColor: item.color }]} />
                <Text style={styles.barLabel}>{item.label}</Text>
                <Text style={styles.barCount}>{item.count}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ExtraSection({ bunker, penalty, chips, totalShots, glass }: { bunker: number; penalty: number; chips: number; totalShots: number; glass?: boolean }) {
  return (
    <View style={[styles.sectionCard, glass && glassCard]}>
      <Text style={styles.sectionTitle}>Bunker, Penalty, Chips</Text>
      <View style={styles.boxRow}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{bunker}</Text>
          <Text style={styles.statBoxLabel}>Bunker</Text>
          <Text style={styles.statBoxPct}>{pctOf(bunker, totalShots)}% of shots</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{penalty}</Text>
          <Text style={styles.statBoxLabel}>Penalty</Text>
          <Text style={styles.statBoxPct}>{pctOf(penalty, totalShots)}% of shots</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{chips}</Text>
          <Text style={styles.statBoxLabel}>Chips</Text>
          <Text style={styles.statBoxPct}>{pctOf(chips, totalShots)}% of shots</Text>
        </View>
      </View>
    </View>
  );
}

function SavesSection({ sandSaves, sandAttempts, upDowns, upDownAttempts, glass }: { sandSaves: number; sandAttempts: number; upDowns: number; upDownAttempts: number; glass?: boolean }) {
  return (
    <View style={[styles.sectionCard, glass && glassCard]}>
      <Text style={styles.sectionTitle}>Sand Saves, Up & Downs</Text>
      <View style={styles.boxRow}>
        <View style={[styles.statBox, styles.statBoxWide]}>
          <Text style={styles.statBoxValue}>{sandSaves}/{sandAttempts}</Text>
          <Text style={styles.statBoxLabel}>Sand Saves</Text>
          <Text style={styles.statBoxPct}>{pctOf(sandSaves, sandAttempts)}%</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxWide]}>
          <Text style={styles.statBoxValue}>{upDowns}/{upDownAttempts}</Text>
          <Text style={styles.statBoxLabel}>Up & Downs</Text>
          <Text style={styles.statBoxPct}>{pctOf(upDowns, upDownAttempts)}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: 'row' as const,
    backgroundColor: 'transparent',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  heroItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8A9B90',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginTop: 2,
  },
  heroUnder: {
    color: '#FFFFFF',
  },
  heroOver: {
    color: '#FF5252',
  },
  heroDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#333',
  },
  sectionCard: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#F5F7F6',
    marginBottom: 14,
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
    minWidth: 36,
    flex: 1,
  },
  barPct: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#F5F7F6',
    marginBottom: 4,
  },
  bar: {
    width: '70%' as unknown as number,
    borderRadius: 6,
    minWidth: 16,
  },
  barLabel: {
    fontSize: 8,
    fontWeight: '700' as const,
    color: '#8A9B90',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  barCount: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#F5F7F6',
    marginTop: 2,
  },
  fairwayVisual: {
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  fairwayArc: {
    flexDirection: 'row' as const,
    height: 40,
    width: 200,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    overflow: 'hidden' as const,
    marginBottom: 12,
  },
  fairwaySegLeft: {
    flex: 1,
    backgroundColor: '#e53935',
    borderTopLeftRadius: 100,
  },
  fairwaySegCenter: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fairwaySegRight: {
    flex: 1,
    backgroundColor: '#e53935',
    borderTopRightRadius: 100,
  },
  fairwayStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    width: '100%' as unknown as number,
  },
  fairwayStat: {
    alignItems: 'center' as const,
    flex: 1,
  },
  fairwayStatPct: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#e53935',
  },
  fairwayHitPct: {
    color: '#FFFFFF',
  },
  fairwayStatLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8A9B90',
    marginTop: 2,
  },
  fairwayHitLabel: {
    color: '#FFFFFF',
  },
  fairwayStatCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#F5F7F6',
    marginTop: 2,
  },
  fairwaySummaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#243028',
  },
  fairwaySummaryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8A9B90',
  },
  girVisual: {
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  girTop: {
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  girMiddle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%' as unknown as number,
    marginBottom: 8,
  },
  girSide: {
    flex: 1,
    alignItems: 'center' as const,
  },
  girGreen: {
    width: 80,
    height: 60,
    borderRadius: 40,
    backgroundColor: '#2A2A2A',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  girGreenOval: {
    position: 'absolute' as const,
    bottom: 0,
    width: 80,
    height: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: '#1A1A1A',
  },
  girBottom: {
    alignItems: 'center' as const,
    marginTop: 8,
  },
  girDirectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#8A9B90',
  },
  girDirectionPct: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  girSummaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#243028',
    marginTop: 8,
  },
  girSummaryItem: {
    alignItems: 'center' as const,
  },
  girSummaryValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  girSummaryLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8A9B90',
    marginTop: 2,
  },
  puttSummaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: 14,
  },
  puttSummaryItem: {
    alignItems: 'center' as const,
  },
  puttSummaryValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#F5F7F6',
  },
  puttSummaryLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8A9B90',
    marginTop: 2,
  },
  boxRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statBoxWide: {
    flex: 1,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  statBoxLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statBoxPct: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
});

const glassCard = {
  backgroundColor: 'rgba(0,0,0,0.25)',
  borderColor: 'rgba(255,255,255,0.12)',
  borderWidth: 1,
};
