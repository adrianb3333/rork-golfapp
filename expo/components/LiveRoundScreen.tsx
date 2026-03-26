import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, WifiOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { wp, fp } from '@/utils/responsive';
import type { LiveRoundData } from '@/contexts/LiveRoundContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface LiveRoundScreenProps {
  round: LiveRoundData;
  onClose: () => void;
}

function getToParDisplay(score: number, par: number): string {
  if (par === 0) return 'E';
  const diff = score - par;
  if (diff === 0) return 'E';
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function getToParColor(score: number, par: number): string {
  if (par === 0) return '#FFFFFF';
  const diff = score - par;
  if (diff < 0) return '#4ADE80';
  if (diff === 0) return '#FFFFFF';
  return '#FF6B6B';
}

function CourseNameTab({ round }: { round: LiveRoundData }) {
  const mainPlayer = round.players[0];

  const elapsedTime = useMemo(() => {
    const elapsed = Math.floor((Date.now() - round.startedAt) / 1000);
    const hrs = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }, [round.startedAt]);

  return (
    <ScrollView
      style={courseStyles.scroll}
      contentContainerStyle={courseStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={courseStyles.gameHeader}>
        <Text style={courseStyles.gameDateText}>
          Game {new Date(round.startedAt).toISOString().split('T')[0]} ({mainPlayer?.holesPlayed ?? 0})
        </Text>
        <Text style={courseStyles.courseSubtext}>{round.courseName}</Text>
      </View>

      <View style={courseStyles.leaderboardCard}>
        <View style={courseStyles.leaderboardHeader}>
          <Text style={courseStyles.lbHashCol}>#</Text>
          <Text style={courseStyles.lbNameCol}>NAMN</Text>
          <Text style={courseStyles.lbStatCol}>RESULTAT</Text>
          <Text style={courseStyles.lbStatCol}>TILL PAR</Text>
          <Text style={courseStyles.lbStatCol}>SPELAT</Text>
        </View>

        {round.players.map((player, index) => {
          const toPar = getToParDisplay(player.totalScore, player.totalPar);
          const toParColor = getToParColor(player.totalScore, player.totalPar);

          return (
            <View key={player.playerId} style={courseStyles.lbRow}>
              <Text style={courseStyles.lbHashVal}>{index + 1}.</Text>
              <View style={courseStyles.lbNameWrap}>
                <Text style={courseStyles.lbPlayerName} numberOfLines={1}>
                  {player.playerName}
                </Text>
                <Text style={courseStyles.lbPlayerHcp}>HCP {player.hcp}</Text>
              </View>
              <Text style={courseStyles.lbStatVal}>
                {player.totalScore > 0 ? player.totalScore : '—'}
              </Text>
              <Text style={[courseStyles.lbStatVal, { color: toParColor, fontWeight: '800' as const }]}>
                {toPar}
              </Text>
              <Text style={courseStyles.lbStatVal}>{player.holesPlayed}</Text>
            </View>
          );
        })}
      </View>

      <View style={courseStyles.advancedSection}>
        <Text style={courseStyles.advancedTitle}>Advanced Data</Text>

        {mainPlayer && mainPlayer.holeScores.length > 0 ? (
          <>
            <View style={courseStyles.advStatRow}>
              <View style={courseStyles.advStatBox}>
                <Text style={courseStyles.advStatValue}>{mainPlayer.totalScore || '—'}</Text>
                <Text style={courseStyles.advStatLabel}>Total Score</Text>
              </View>
              <View style={courseStyles.advStatBox}>
                <Text style={[courseStyles.advStatValue, { color: getToParColor(mainPlayer.totalScore, mainPlayer.totalPar) }]}>
                  {getToParDisplay(mainPlayer.totalScore, mainPlayer.totalPar)}
                </Text>
                <Text style={courseStyles.advStatLabel}>To Par</Text>
              </View>
            </View>

            <View style={courseStyles.advStatRow}>
              <View style={courseStyles.advStatBox}>
                <Text style={courseStyles.advStatValue}>{mainPlayer.holesPlayed}</Text>
                <Text style={courseStyles.advStatLabel}>Holes Played</Text>
              </View>
              <View style={courseStyles.advStatBox}>
                <Text style={courseStyles.advStatValue}>{elapsedTime}</Text>
                <Text style={courseStyles.advStatLabel}>Elapsed</Text>
              </View>
            </View>

            {(() => {
              const scoredHoles = mainPlayer.holeScores.filter((h) => h.score > 0);
              const totalPutts = scoredHoles.reduce((acc, h) => acc + h.putts, 0);
              const totalBunker = scoredHoles.reduce((acc, h) => acc + h.bunkerShots, 0);
              const totalPenalty = scoredHoles.reduce((acc, h) => acc + h.penaltyShots, 0);
              const totalChips = scoredHoles.reduce((acc, h) => acc + h.chips, 0);
              const fairwayHits = scoredHoles.filter((h) => h.fairway === 'hit').length;
              const fairwayTotal = scoredHoles.filter((h) => h.fairway !== null).length;
              const girHits = scoredHoles.filter((h) => h.greenMiss === 'hit').length;

              return (
                <>
                  <View style={courseStyles.advStatRow}>
                    <View style={courseStyles.advStatBox}>
                      <Text style={courseStyles.advStatValue}>{totalPutts}</Text>
                      <Text style={courseStyles.advStatLabel}>Total Putts</Text>
                    </View>
                    <View style={courseStyles.advStatBox}>
                      <Text style={courseStyles.advStatValue}>
                        {scoredHoles.length > 0 ? (totalPutts / scoredHoles.length).toFixed(1) : '—'}
                      </Text>
                      <Text style={courseStyles.advStatLabel}>Putts/Hole</Text>
                    </View>
                  </View>

                  <View style={courseStyles.advStatRow}>
                    <View style={courseStyles.advStatBox}>
                      <Text style={courseStyles.advStatValue}>
                        {fairwayTotal > 0 ? `${fairwayHits}/${fairwayTotal}` : '—'}
                      </Text>
                      <Text style={courseStyles.advStatLabel}>Fairways Hit</Text>
                    </View>
                    <View style={courseStyles.advStatBox}>
                      <Text style={courseStyles.advStatValue}>
                        {scoredHoles.length > 0 ? `${girHits}/${scoredHoles.length}` : '—'}
                      </Text>
                      <Text style={courseStyles.advStatLabel}>GIR</Text>
                    </View>
                  </View>

                  <View style={courseStyles.advStatRow}>
                    <View style={courseStyles.advStatBox}>
                      <Text style={courseStyles.advStatValue}>{totalBunker}</Text>
                      <Text style={courseStyles.advStatLabel}>Bunker Shots</Text>
                    </View>
                    <View style={courseStyles.advStatBox}>
                      <Text style={courseStyles.advStatValue}>{totalPenalty}</Text>
                      <Text style={courseStyles.advStatLabel}>Penalties</Text>
                    </View>
                  </View>

                  {totalChips > 0 && (
                    <View style={courseStyles.advStatRow}>
                      <View style={courseStyles.advStatBox}>
                        <Text style={courseStyles.advStatValue}>{totalChips}</Text>
                        <Text style={courseStyles.advStatLabel}>Chips</Text>
                      </View>
                      <View style={courseStyles.advStatBox}>
                        <Text style={courseStyles.advStatValue}>—</Text>
                        <Text style={courseStyles.advStatLabel}>Up & Down %</Text>
                      </View>
                    </View>
                  )}
                </>
              );
            })()}

            <Text style={courseStyles.holeBreakdownTitle}>Hole Breakdown</Text>
            {mainPlayer.holeScores.filter((h) => h.score > 0).map((hole) => {
              const diff = hole.score - hole.par;
              const diffStr = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;
              const diffColor = diff < 0 ? '#4ADE80' : diff === 0 ? 'rgba(255,255,255,0.7)' : '#FF6B6B';
              return (
                <View key={hole.holeNumber} style={courseStyles.holeRow}>
                  <View style={courseStyles.holeNumWrap}>
                    <Text style={courseStyles.holeNumText}>H{hole.holeNumber}</Text>
                    <Text style={courseStyles.holeParText}>P{hole.par}</Text>
                  </View>
                  <Text style={courseStyles.holeScore}>{hole.score}</Text>
                  <Text style={[courseStyles.holeDiff, { color: diffColor }]}>{diffStr}</Text>
                  <Text style={courseStyles.holePutts}>{hole.putts} putts</Text>
                </View>
              );
            })}
          </>
        ) : (
          <View style={courseStyles.noDataWrap}>
            <Text style={courseStyles.noDataText}>No scoring data available yet</Text>
          </View>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ShotOverviewTab({ round }: { round: LiveRoundData }) {
  const [currentHoleIdx, setCurrentHoleIdx] = useState<number>(0);
  const mainPlayer = round.players[0];
  const scoredHoles = mainPlayer?.holeScores.filter((h) => h.score > 0) ?? [];
  const totalHoles = parseInt(round.holeOption, 10) || 18;

  const goNext = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentHoleIdx((prev) => Math.min(prev + 1, totalHoles - 1));
  }, [totalHoles]);

  const goPrev = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentHoleIdx((prev) => Math.max(prev - 1, 0));
  }, []);

  if (!round.sensorsActive) {
    return (
      <View style={shotStyles.noSensorContainer}>
        <View style={shotStyles.blurOverlay}>
          <WifiOff size={48} color="rgba(0,0,0,0.3)" />
          <Text style={shotStyles.noSensorTitle}>No Sensors Active</Text>
          <Text style={shotStyles.noSensorSubtext}>
            This player has not activated sensors for this round
          </Text>
        </View>
      </View>
    );
  }

  const holeNumber = currentHoleIdx + 1;
  const holeData = scoredHoles.find((h) => h.holeNumber === holeNumber);
  const holePar = holeData?.par ?? 4;

  return (
    <View style={shotStyles.container}>
      <View style={shotStyles.holeNav}>
        <TouchableOpacity
          onPress={goPrev}
          style={[shotStyles.holeNavBtn, currentHoleIdx === 0 && shotStyles.holeNavBtnDisabled]}
          activeOpacity={0.7}
          disabled={currentHoleIdx === 0}
        >
          <ChevronLeft size={20} color={currentHoleIdx === 0 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
        </TouchableOpacity>

        <View style={shotStyles.holeInfoPill}>
          <Text style={shotStyles.holeInfoText}>
            H{holeNumber} • P{holePar} • {Math.round(200 + Math.random() * 300)}y
          </Text>
        </View>

        <TouchableOpacity
          onPress={goNext}
          style={[shotStyles.holeNavBtn, currentHoleIdx >= totalHoles - 1 && shotStyles.holeNavBtnDisabled]}
          activeOpacity={0.7}
          disabled={currentHoleIdx >= totalHoles - 1}
        >
          <ChevronRight size={20} color={currentHoleIdx >= totalHoles - 1 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={shotStyles.shotScroll} showsVerticalScrollIndicator={false} contentContainerStyle={shotStyles.shotScrollContent}>
        {holeData ? (
          <View style={shotStyles.shotDataWrap}>
            <View style={shotStyles.shotStatRow}>
              <View style={shotStyles.shotStatBox}>
                <Text style={shotStyles.shotStatValue}>{holeData.score}</Text>
                <Text style={shotStyles.shotStatLabel}>Score</Text>
              </View>
              <View style={shotStyles.shotStatBox}>
                <Text style={shotStyles.shotStatValue}>{holeData.putts}</Text>
                <Text style={shotStyles.shotStatLabel}>Putts</Text>
              </View>
              <View style={shotStyles.shotStatBox}>
                <Text style={shotStyles.shotStatValue}>{holeData.fairway ?? '—'}</Text>
                <Text style={shotStyles.shotStatLabel}>Fairway</Text>
              </View>
            </View>
            <View style={shotStyles.shotStatRow}>
              <View style={shotStyles.shotStatBox}>
                <Text style={shotStyles.shotStatValue}>{holeData.greenMiss ?? '—'}</Text>
                <Text style={shotStyles.shotStatLabel}>Green</Text>
              </View>
              <View style={shotStyles.shotStatBox}>
                <Text style={shotStyles.shotStatValue}>{holeData.bunkerShots}</Text>
                <Text style={shotStyles.shotStatLabel}>Bunker</Text>
              </View>
              <View style={shotStyles.shotStatBox}>
                <Text style={shotStyles.shotStatValue}>{holeData.penaltyShots}</Text>
                <Text style={shotStyles.shotStatLabel}>Penalty</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={shotStyles.noHoleData}>
            <Text style={shotStyles.noHoleDataText}>No data for this hole yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function LiveRoundScreen({ round, onClose }: LiveRoundScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<number>(0);
  const scrollRef = useRef<ScrollView>(null);
  const tabUnderlineAnim = useRef(new Animated.Value(0)).current;

  const tabs = [round.courseName, 'Shot Overview'];

  const handleTabPress = useCallback((index: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(index);
    scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * index, animated: true });
    Animated.spring(tabUnderlineAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  }, [tabUnderlineAnim]);

  const handleScrollEnd = useCallback((e: any) => {
    const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (pageIndex !== activeTab) {
      setActiveTab(pageIndex);
      Animated.spring(tabUnderlineAnim, {
        toValue: pageIndex,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }).start();
    }
  }, [activeTab, tabUnderlineAnim]);

  const tabWidth = (SCREEN_WIDTH - 40) / 2;
  const underlineWidth = 60;
  const underlineTranslateX = tabUnderlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      (tabWidth - underlineWidth) / 2,
      tabWidth + (tabWidth - underlineWidth) / 2,
    ],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#388E3C', '#43A047']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{round.courseName}</Text>
          <Text style={styles.headerSubtitle}>{round.friendName}'s Round</Text>
        </View>

        <View style={{ width: wp(44) }} />
      </View>

      <View style={styles.tabBar}>
        <View style={styles.tabRow}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tabBtn, { width: tabWidth }]}
              onPress={() => handleTabPress(index)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                activeTab === index && styles.tabTextActive,
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View
          style={[
            styles.tabUnderline,
            {
              width: underlineWidth,
              transform: [{ translateX: underlineTranslateX }],
            },
          ]}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.pagerScroll}
      >
        <View style={{ width: SCREEN_WIDTH }}>
          <CourseNameTab round={round} />
        </View>
        <View style={{ width: SCREEN_WIDTH }}>
          <ShotOverviewTab round={round} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B5E20',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(14),
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: fp(17),
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  tabBar: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  tabRow: {
    flexDirection: 'row' as const,
  },
  tabBtn: {
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  tabUnderline: {
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  pagerScroll: {
    flex: 1,
  },
});

const courseStyles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  gameHeader: {
    marginBottom: 16,
  },
  gameDateText: {
    fontSize: fp(18),
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  courseSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  leaderboardCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  leaderboardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  lbHashCol: {
    width: 28,
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  lbNameCol: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  lbStatCol: {
    width: 65,
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center' as const,
  },
  lbRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  lbHashVal: {
    width: 28,
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  lbNameWrap: {
    flex: 1,
  },
  lbPlayerName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  lbPlayerHcp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  lbStatVal: {
    width: 65,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  advancedSection: {
    marginTop: 4,
  },
  advancedTitle: {
    fontSize: fp(18),
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 14,
  },
  advStatRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 10,
  },
  advStatBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  advStatValue: {
    fontSize: fp(20),
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  advStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  noDataWrap: {
    paddingVertical: 40,
    alignItems: 'center' as const,
  },
  noDataText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  holeBreakdownTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
  },
  holeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  holeNumWrap: {
    width: 50,
  },
  holeNumText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  holeParText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  holeScore: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  holeDiff: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  holePutts: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right' as const,
  },
});

const shotStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noSensorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 40,
  },
  blurOverlay: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    width: '100%',
  },
  noSensorTitle: {
    fontSize: fp(20),
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
  },
  noSensorSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 8,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  holeNav: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  holeNavBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  holeNavBtnDisabled: {
    opacity: 0.4,
  },
  holeInfoPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  holeInfoText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  shotScroll: {
    flex: 1,
  },
  shotScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  shotDataWrap: {
    gap: 10,
  },
  shotStatRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  shotStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  shotStatValue: {
    fontSize: fp(18),
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  shotStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  noHoleData: {
    paddingVertical: 60,
    alignItems: 'center' as const,
  },
  noHoleDataText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});
