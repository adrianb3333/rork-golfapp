import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Flag, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useSession } from '@/contexts/SessionContext';
import { useScoring } from '@/contexts/ScoringContext';
import { computeRoundStats, getToParString, pctOf } from '@/services/statsHelper';
import { useSensor } from '@/contexts/SensorContext';
import SensorLockOverlay from '@/components/SensorLockOverlay';
import DistancesModal from '@/app/modals/distances-modal';
import StrokesGainedModal from '@/app/modals/strokesgained-modal';

const SG_SEGMENTS: { key: string; label: string }[] = [
  { key: 'ovve', label: 'Ovve' },
  { key: 'ott', label: 'OTT' },
  { key: 'app', label: 'APP' },
  { key: 'arg', label: 'ARG' },
  { key: 'p', label: 'P' },
];

const SG_MOCK_DATA: Record<string, number> = {
  ovve: -1.3,
  ott: -2.6,
  app: 1.2,
  arg: 1.0,
  p: -0.9,
};

const SG_TITLES: Record<string, string> = {
  ovve: 'Overall',
  ott: 'Off the Tee',
  app: 'Approach',
  arg: 'Around the Green',
  p: 'Putting',
};

interface DataTabProps {
  hideQuitButton?: boolean;
  bottomOverride?: React.ReactNode;
}

export default function DataTab({ hideQuitButton, bottomOverride }: DataTabProps = {}) {
  const { quitSession } = useSession();
  const { allScores, holes } = useScoring();
  const { isPaired } = useSensor();

  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showSGModal, setShowSGModal] = useState(false);
  const [showDistancesModal, setShowDistancesModal] = useState(false);
  const [showStrokesGainedModal, setShowStrokesGainedModal] = useState(false);
  const [sgSegment, setSgSegment] = useState<string>('ovve');
  const selectedHandicap = 'Scratch';

  const stats = useMemo(() => computeRoundStats(allScores, holes), [allScores, holes]);
  const toParStr = getToParString(stats.scoreToPar);

  const sgValue = SG_MOCK_DATA[sgSegment] ?? 0;
  const sgFormatted = sgValue >= 0 ? `+${sgValue.toFixed(1)}` : sgValue.toFixed(1);

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topCardsRow}>
        <TouchableOpacity
          style={styles.topCard}
          onPress={() => setShowDistancesModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.topCardTitle}>Distances</Text>
          <Text style={styles.topCardSubtext}>(Sensors Needed)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topCard}
          onPress={() => setShowStrokesGainedModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.topCardTitle}>Short Game (SG)</Text>
          <Text style={styles.topCardSubtext}>(Sensors Needed)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topCard}
          onPress={() => setShowSGModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.topCardTitle}>Strokes Gained</Text>
          <Text style={styles.topCardSubtext}>(Sensors Needed)</Text>
        </TouchableOpacity>
      </View>

      {stats.holesPlayed === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Ingen data ännu</Text>
          <Text style={styles.emptySubtext}>Börja spela för att se din statistik här</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
          <View style={styles.heroRow}>
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

          <ScoreSection categories={stats.scoreCategories} />
          <FairwaySection hit={stats.fairwayHit} missLeft={stats.fairwayMissLeft} missRight={stats.fairwayMissRight} total={stats.fairwayTotal} />
          <GIRSection made={stats.girMade} missShort={stats.girMissShort} missLong={stats.girMissLong} missLeft={stats.girMissLeft} missRight={stats.girMissRight} total={stats.girTotal} />
          <PuttingSection p1={stats.putts1} p2={stats.putts2} p3={stats.putts3} p4={stats.putts4Plus} totalPutts={stats.totalPutts} avgPutts={stats.avgPutts} holesPlayed={stats.holesPlayed} />
          <ExtraSection bunker={stats.totalBunker} penalty={stats.totalPenalty} chips={stats.totalChips} totalShots={stats.totalShots} />
          <SavesSection sandSaves={stats.totalSandSaves} sandAttempts={stats.totalSandSaveAttempts} upDowns={stats.totalUpAndDowns} upDownAttempts={stats.totalUpAndDownAttempts} />
        </ScrollView>
      )}

      {bottomOverride ? bottomOverride : !hideQuitButton && (
        <TouchableOpacity style={styles.quitButton} onPress={() => setShowQuitConfirm(true)}>
          <Text style={styles.quitText}>Quit Round</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showDistancesModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowDistancesModal(false)}
      >
        <DistancesModal onClose={() => setShowDistancesModal(false)} />
      </Modal>

      <Modal
        visible={showStrokesGainedModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowStrokesGainedModal(false)}
      >
        <StrokesGainedModal onClose={() => setShowStrokesGainedModal(false)} />
      </Modal>

      <Modal
        visible={showSGModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSGModal(false)}
      >
        <View style={styles.sgModalOverlay}>
          <View style={styles.sgModalCard}>
            {!isPaired && <SensorLockOverlay />}
            <View style={styles.sgModalHeader}>
              <TouchableOpacity onPress={() => setShowSGModal(false)} activeOpacity={0.7}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.sgModalTitle}>Strokes Gained</Text>
              <View style={{ width: 22 }} />
            </View>

            <View style={styles.sgSegmentWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sgSegmentScroll}>
                {SG_SEGMENTS.map((seg) => (
                  <TouchableOpacity
                    key={seg.key}
                    style={[styles.sgSegmentBtn, sgSegment === seg.key && styles.sgSegmentBtnActive]}
                    onPress={() => setSgSegment(seg.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sgSegmentText, sgSegment === seg.key && styles.sgSegmentTextActive]}>
                      {seg.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.sgVsBadge}>
              <Text style={styles.sgVsText}>vs {selectedHandicap}</Text>
            </View>

            <View style={styles.sgValueContainer}>
              <Text style={styles.sgRoundAvgLabel}>Round AVG for {SG_TITLES[sgSegment]}</Text>
              <Text style={[
                styles.sgValueText,
                sgValue >= 0 ? styles.sgValuePositive : styles.sgValueNegative,
              ]}>
                {sgFormatted}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showQuitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuitConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <LinearGradient
            colors={['#4BA35B', '#3D954D', '#2D803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmBox}
          >
            <Text style={styles.confirmTitle}>End Round?</Text>
            <Text style={styles.confirmMessage}>Are you sure you want to quit this round?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmNo}
                onPress={() => setShowQuitConfirm(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmNoText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmYes}
                onPress={() => {
                  setShowQuitConfirm(false);
                  quitSession();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmYesText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

interface ScoreSectionProps {
  categories: { label: string; count: number; percentage: number; color: string }[];
}

function ScoreSection({ categories }: ScoreSectionProps) {
  const maxCount = Math.max(...categories.map((c) => c.count), 1);
  const MAX_BAR = 100;

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Score</Text>
      <View style={styles.barChart}>
        {categories.map((cat) => {
          const barH = Math.max((cat.count / maxCount) * MAX_BAR, 6);
          const isWhite = cat.color === '#FFFFFF';
          return (
            <View key={cat.label} style={styles.barColumn}>
              <Text style={styles.barPct}>{cat.percentage}%</Text>
              <View style={[styles.bar, { height: barH, backgroundColor: cat.color, borderWidth: isWhite ? 1 : 0, borderColor: isWhite ? 'rgba(255,255,255,0.4)' : 'transparent' }]} />
              <Text style={styles.barLabel}>{cat.label}</Text>
              <Text style={styles.barCount}>{cat.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface FairwaySectionProps {
  hit: number;
  missLeft: number;
  missRight: number;
  total: number;
}

function FairwaySection({ hit, missLeft, missRight, total }: FairwaySectionProps) {
  const hitPct = pctOf(hit, total);
  const leftPct = pctOf(missLeft, total);
  const rightPct = pctOf(missRight, total);

  return (
    <View style={styles.sectionCard}>
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

interface GIRSectionProps {
  made: number;
  missShort: number;
  missLong: number;
  missLeft: number;
  missRight: number;
  total: number;
}

function GIRSection({ made, missShort, missLong, missLeft, missRight, total }: GIRSectionProps) {
  const madePct = pctOf(made, total);
  const shortPct = pctOf(missShort, total);
  const longPct = pctOf(missLong, total);
  const leftPct = pctOf(missLeft, total);
  const rightPct = pctOf(missRight, total);
  const missed = total - made;

  return (
    <View style={styles.sectionCard}>
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

interface PuttingSectionProps {
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  totalPutts: number;
  avgPutts: number;
  holesPlayed: number;
}

function PuttingSection({ p1, p2, p3, p4, totalPutts, avgPutts, holesPlayed }: PuttingSectionProps) {
  const puttData: { label: string; count: number; color: string }[] = [];
  if (p1 > 0) puttData.push({ label: '1-Putt', count: p1, color: '#FFFFFF' });
  if (p2 > 0) puttData.push({ label: '2-Putt', count: p2, color: 'rgba(255,255,255,0.6)' });
  if (p3 > 0) puttData.push({ label: '3-Putt', count: p3, color: '#e53935' });
  if (p4 > 0) puttData.push({ label: '4+ Putt', count: p4, color: '#B71C1C' });

  const maxCount = Math.max(...puttData.map((d) => d.count), 1);
  const MAX_BAR = 80;

  return (
    <View style={styles.sectionCard}>
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

interface ExtraSectionProps {
  bunker: number;
  penalty: number;
  chips: number;
  totalShots: number;
}

function ExtraSection({ bunker, penalty, chips, totalShots }: ExtraSectionProps) {
  return (
    <View style={styles.sectionCard}>
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

interface SavesSectionProps {
  sandSaves: number;
  sandAttempts: number;
  upDowns: number;
  upDownAttempts: number;
}

function SavesSection({ sandSaves, sandAttempts, upDowns, upDownAttempts }: SavesSectionProps) {
  return (
    <View style={styles.sectionCard}>
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
  container: {
    flex: 1,
    paddingTop: 0,
  },
  topCardsRow: {
    flexDirection: 'row' as const,
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  topCard: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  topCardTitle: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  topCardSubtext: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500' as const,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  scrollInner: {
    paddingBottom: 16,
  },
  heroRow: {
    flexDirection: 'row' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  barCount: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
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
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  fairwayHitLabel: {
    color: '#FFFFFF',
  },
  fairwayStatCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginTop: 2,
  },
  fairwaySummaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  fairwaySummaryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
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
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  girBottom: {
    alignItems: 'center' as const,
    marginTop: 8,
  },
  girDirectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  girDirectionPct: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  girSummaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    marginTop: 8,
  },
  girSummaryItem: {
    alignItems: 'center' as const,
  },
  girSummaryValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  girSummaryLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
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
    color: '#FFFFFF',
  },
  puttSummaryLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  boxRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
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
  quitButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginTop: 12,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  quitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  confirmBox: {
    borderRadius: 20,
    padding: 28,
    width: '80%' as unknown as number,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 21,
  },
  confirmButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%' as unknown as number,
  },
  confirmNo: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  confirmNoText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000000',
  },
  confirmYes: {
    flex: 1,
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  confirmYesText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  dataHeaderRow: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  sgButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  sgButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  sgModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end' as const,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sgModalCard: {
    height: '75%' as unknown as number,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sgModalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 24,
  },
  sgModalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  sgSegmentWrap: {
    marginBottom: 24,
  },
  sgSegmentScroll: {
    gap: 8,
  },
  sgSegmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sgSegmentBtnActive: {
    backgroundColor: '#4BA35B',
    borderColor: '#4BA35B',
  },
  sgSegmentText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  sgSegmentTextActive: {
    color: '#FFFFFF',
  },
  sgVsBadge: {
    alignSelf: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 32,
  },
  sgVsText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  sgValueContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flex: 1,
  },
  sgRoundAvgLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  sgValueText: {
    fontSize: 56,
    fontWeight: '800' as const,
  },
  sgValuePositive: {
    color: '#A4D15F',
  },
  sgValueNegative: {
    color: '#FF5252',
  },
});
