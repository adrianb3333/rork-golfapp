import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight, ChevronLeft, ChevronUp, ArrowLeft,
  Users, Trophy, X, Plane, Navigation,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSession, CrewSessionData } from '@/contexts/SessionContext';
import { useProfile } from '@/contexts/ProfileContext';
import ProfileScreen from '@/app/(tabs)/profile';
import FlightTab from '@/app/practice-session/tabs/FlightTab';
import PositionTab from '@/app/practice-session/tabs/PositionTab';
import Colors from '@/constants/colors';

interface CrewDrillModeProps {
  session: CrewSessionData;
}

interface PlayerScore {
  oderId: string;
  odName: string;
  odAvatar: string | null;
  scores: number[];
  totalScore: number;
}

interface PinnedCoordinate {
  latitude: number;
  longitude: number;
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

export default function CrewDrillMode({ session }: CrewDrillModeProps) {
  const insets = useSafeAreaInsets();
  const { endCrewSession } = useSession();
  const { allUsers, userId } = useProfile();

  const totalRounds = session.drillRounds ?? 3;
  const shotsPerRound = session.drillShotsPerRound ?? 10;
  const totalShots = session.drillTotalShots ?? totalRounds * shotsPerRound;
  const acceptedDistances = session.drillAcceptedDistances ?? [];

  const [currentRound, setCurrentRound] = useState<number>(0);
  const [roundHighest, setRoundHighest] = useState<number[]>(
    Array.from({ length: totalRounds }, () => 0)
  );
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showMinimized, setShowMinimized] = useState<boolean>(false);
  const [_isFinished, setIsFinished] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [fullScreenTab, setFullScreenTab] = useState<'flight' | 'position' | null>(null);
  const [positionDistance, setPositionDistance] = useState<number>(0);
  const [pinnedPosition, setPinnedPosition] = useState<PinnedCoordinate | null>(null);

  const currentHits = useMemo(() => {
    return roundHighest[currentRound] ?? 0;
  }, [roundHighest, currentRound]);

  const totalHitsAllRounds = useMemo(() => {
    return roundHighest.reduce((sum, h) => sum + h, 0);
  }, [roundHighest]);

  const totalShotsSoFar = useMemo(() => {
    return (currentRound + 1) * shotsPerRound;
  }, [currentRound, shotsPerRound]);

  const liveAvg = useMemo(() => {
    if (totalShotsSoFar === 0) return 0;
    return Math.round((totalHitsAllRounds / totalShotsSoFar) * 100);
  }, [totalHitsAllRounds, totalShotsSoFar]);

  const myTotalScore = useMemo(() => {
    return roundHighest.reduce((a, b) => a + b, 0);
  }, [roundHighest]);

  const crewScores = useMemo<PlayerScore[]>(() => {
    const participants = session.participants ?? [];
    return participants.map((pid) => {
      const user = allUsers.find((u) => u.id === pid);
      const isMe = pid === userId;
      return {
        oderId: pid,
        odName: isMe ? 'You' : (user?.display_name || user?.username || 'Player'),
        odAvatar: user?.avatar_url || null,
        scores: isMe ? roundHighest : Array(totalRounds).fill(Math.floor(Math.random() * shotsPerRound)),
        totalScore: isMe ? myTotalScore : Math.floor(Math.random() * totalShots),
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [session.participants, allUsers, userId, roundHighest, myTotalScore, totalRounds, shotsPerRound, totalShots]);

  const top3 = useMemo(() => crewScores.slice(0, 3), [crewScores]);

  const isLastRound = currentRound === totalRounds - 1;
  const highestInRound = roundHighest[currentRound] ?? 0;

  const toggleTarget = useCallback((targetIndex: number) => {
    const targetNumber = targetIndex + 1;
    setRoundHighest(prev => {
      const updated = [...prev];
      const currentHighest = updated[currentRound];
      if (targetNumber === currentHighest) {
        updated[currentRound] = targetNumber - 1;
      } else {
        updated[currentRound] = targetNumber;
      }
      return updated;
    });
  }, [currentRound]);

  const handleNextRound = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isLastRound) {
      setIsFinished(true);
      setShowSummary(true);
    } else {
      setCurrentRound(prev => prev + 1);
    }
  }, [isLastRound]);

  const _handlePrevRound = useCallback(() => {
    if (currentRound > 0) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentRound(currentRound - 1);
    }
  }, [currentRound]);

  const handleMinimize = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMinimized(true);
  }, []);

  const handleQuit = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    endCrewSession();
  }, [endCrewSession]);

  const handleFinish = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    endCrewSession();
  }, [endCrewSession]);

  const handlePositionDistanceChange = useCallback((dist: number) => {
    setPositionDistance(dist);
  }, []);

  const handlePinChange = useCallback((pin: PinnedCoordinate | null) => {
    console.log('[CrewDrillMode] Pin changed:', pin);
    setPinnedPosition(pin);
  }, []);

  const handleNavigateToTab = useCallback((tab: 'flight' | 'position') => {
    console.log('[CrewDrillMode] Navigate to full-screen tab:', tab);
    setFullScreenTab(tab);
  }, []);

  const handleFullScreenBack = useCallback(() => {
    console.log('[CrewDrillMode] Back from full-screen tab');
    setFullScreenTab(null);
  }, []);

  if (showMinimized) {
    return (
      <View style={styles.minimizedContainer}>
        <View style={styles.profileContainer}>
          <ProfileScreen />
        </View>
        <View style={[styles.miniModal, { bottom: 90 }]}>
          <LinearGradient
            colors={['#0059B2', '#1075E3', '#1C8CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.miniModalGradient}
          >
            <TouchableOpacity
              style={styles.miniExpandBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowMinimized(false);
              }}
              activeOpacity={0.7}
            >
              <ChevronUp size={28} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.miniSessionLabel}>Crew Drill in Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.miniFinishBtn}
              onPress={handleQuit}
              activeOpacity={0.8}
            >
              <Text style={styles.miniFinishText}>Quit</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (showSummary) {
    return (
      <View style={[styles.container, { backgroundColor: '#0A0A0A' }]}>
        <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.summaryHeaderTitle}>Drill Summary</Text>
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryScoreCard}>
            <Text style={styles.summaryScoreLabel}>Your Score</Text>
            <Text style={styles.summaryScoreValue}>{myTotalScore}</Text>
            <Text style={styles.summaryScoreSub}>
              {totalRounds} rounds · {shotsPerRound} shots/round
            </Text>
          </View>

          <View style={styles.summaryRoundsCard}>
            <Text style={styles.summaryRoundsTitle}>Round Breakdown</Text>
            {roundHighest.map((score, idx) => (
              <View key={idx} style={styles.summaryRoundRow}>
                <Text style={styles.summaryRoundLabel}>Round {idx + 1}</Text>
                {acceptedDistances[idx] ? (
                  <Text style={styles.summaryRoundDist}>{acceptedDistances[idx]}m</Text>
                ) : null}
                <Text style={styles.summaryRoundScore}>{score}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryTop3Card}>
            <View style={styles.summaryTop3Header}>
              <Trophy size={18} color="#FFD700" />
              <Text style={styles.summaryTop3Title}>Top 3 Crew</Text>
            </View>
            {top3.map((player, idx) => (
              <View key={player.oderId} style={styles.summaryTop3Row}>
                <View style={[styles.summaryRankBadge, idx === 0 && { backgroundColor: '#FFD700' }, idx === 1 && { backgroundColor: '#C0C0C0' }, idx === 2 && { backgroundColor: '#CD7F32' }]}>
                  <Text style={styles.summaryRankText}>{idx + 1}</Text>
                </View>
                {player.odAvatar ? (
                  <Image source={{ uri: player.odAvatar }} style={styles.summaryPlayerAvatar} />
                ) : (
                  <View style={styles.summaryPlayerAvatarPlaceholder}>
                    <Text style={styles.summaryPlayerInitial}>
                      {player.odName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.summaryPlayerName} numberOfLines={1}>{player.odName}</Text>
                <Text style={styles.summaryPlayerScore}>{player.totalScore}</Text>
              </View>
            ))}
            {top3.length > 0 && (
              <View style={styles.summaryWinnerRow}>
                <Trophy size={14} color="#FFD700" />
                <Text style={styles.summaryWinnerText}>Winner: {top3[0].odName}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleFinish}
            activeOpacity={0.8}
            style={styles.finishBtnOuter}
          >
            <LinearGradient
              colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.finishBtn}
            >
              <Text style={styles.finishBtnText}>Finish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (fullScreenTab) {
    return (
      <View style={styles.drillFullScreenOverlay}>
        <TouchableOpacity
          onPress={handleFullScreenBack}
          style={[styles.drillFullScreenBackBtn, { top: insets.top + 8 }]}
          activeOpacity={0.7}
        >
          <View style={styles.drillFullScreenBackCircle}>
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
        <View style={styles.fullScreenContent}>
          {fullScreenTab === 'flight' && (
            <FlightTab externalDistance={positionDistance} />
          )}
          {fullScreenTab === 'position' && (
            <PositionTab
              onDistanceChange={handlePositionDistanceChange}
              externalPinnedPosition={pinnedPosition}
              onPinChange={handlePinChange}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleMinimize} activeOpacity={0.7}>
          <View style={styles.backCircle}>
            <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{session.eventName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressBarContainer}>
        {Array.from({ length: totalRounds }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i <= currentRound ? styles.progressSegmentActive : styles.progressSegmentInactive,
              i < totalRounds - 1 && { marginRight: 4 },
            ]}
          />
        ))}
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statItemLabel}>Round</Text>
          <Text style={styles.statItemValue}>{currentRound + 1}/{totalRounds}</Text>
        </View>
        <View style={[styles.statItem, styles.statItemBorder]}>
          <Text style={styles.statItemLabel}>Hits</Text>
          <Text style={[styles.statItemValue, styles.statItemHits]}>{currentHits}/{shotsPerRound}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statItemLabel}>Live Avg</Text>
          <Text style={[styles.statItemValue, styles.statItemAvg]}>{liveAvg}%</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tapInstruction}>Tap the highest target you hit</Text>

        <View style={styles.targetsGrid}>
          {Array.from({ length: shotsPerRound }).map((_, idx) => {
            const targetNumber = idx + 1;
            const isHit = targetNumber <= highestInRound;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.targetCircle, isHit && styles.targetCircleHit]}
                onPress={() => toggleTarget(idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.targetText, isHit && styles.targetTextHit]}>
                  {targetNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={() => handleNavigateToTab('flight')}
            activeOpacity={0.7}
            style={styles.navCircleWrap}
          >
            <View style={styles.navCircle}>
              <Plane size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.navCircleLabel}>Flight</Text>
          </TouchableOpacity>

          <View style={styles.nextButtonFlex}>
            <TouchableOpacity
              onPress={handleNextRound}
              activeOpacity={0.8}
            >
              <View style={styles.nextButtonOuter}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.32)', 'rgba(0,0,0,0.22)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextButtonText}>
                    {isLastRound ? 'Finish Drill' : 'Next Round'}
                  </Text>
                  <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => handleNavigateToTab('position')}
            activeOpacity={0.7}
            style={styles.navCircleWrap}
          >
            <View style={styles.navCircle}>
              <Navigation size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.navCircleLabel}>Position</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.vsCrewBtn}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowLeaderboard(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.vsCrewInner}>
            <Users size={16} color="#FFFFFF" />
            <Text style={styles.vsCrewText}>VS Crew</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showLeaderboard}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <View style={styles.leaderboardOverlay}>
          <View style={styles.leaderboardCard}>
            <View style={styles.leaderboardHeader}>
              <View style={styles.leaderboardHeaderLeft}>
                <Trophy size={18} color="#FFD700" />
                <Text style={styles.leaderboardTitle}>Crew Leaderboard</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.leaderboardList}>
              {crewScores.map((player, idx) => (
                <View key={player.oderId} style={[styles.leaderboardRow, idx === 0 && { backgroundColor: 'rgba(255,215,0,0.08)' }]}>
                  <Text style={[styles.leaderboardRank, idx === 0 && { color: '#FFD700' }]}>#{idx + 1}</Text>
                  {player.odAvatar ? (
                    <Image source={{ uri: player.odAvatar }} style={styles.leaderboardAvatar} />
                  ) : (
                    <View style={styles.leaderboardAvatarPlaceholder}>
                      <Text style={styles.leaderboardAvatarInitial}>
                        {player.odName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.leaderboardName} numberOfLines={1}>{player.odName}</Text>
                  <Text style={[styles.leaderboardScore, idx === 0 && { color: '#FFD700' }]}>{player.totalScore}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  minimizedContainer: { flex: 1 },
  profileContainer: { flex: 1 },
  fullScreenContent: { flex: 1 },
  drillFullScreenOverlay: {
    flex: 1,
    backgroundColor: '#020d12',
  },
  drillFullScreenBackBtn: {
    position: 'absolute' as const,
    left: 14,
    zIndex: 100,
  },
  drillFullScreenBackCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  miniModal: {
    position: 'absolute' as const,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  miniModalGradient: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  miniExpandBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  miniSessionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  miniFinishBtn: {
    backgroundColor: Colors.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  miniFinishText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
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
    textAlign: 'center' as const,
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  headerSpacer: { width: 38 },
  headerBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressBarContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressSegmentActive: { backgroundColor: '#FFFFFF' },
  progressSegmentInactive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  statsBar: {
    flexDirection: 'row' as const,
    marginHorizontal: 20,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    overflow: 'hidden' as const,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 14,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: GLASS_BORDER,
  },
  statItemLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 4,
  },
  statItemValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  statItemHits: { color: '#7AE582' },
  statItemAvg: { color: '#FFD166' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tapInstruction: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  targetsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: 16,
  },
  targetCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GLASS_BG,
    borderWidth: 2,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  targetCircleHit: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  targetText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.55)',
  },
  targetTextHit: { color: '#FFFFFF' },
  footer: {
    paddingHorizontal: 16,
  },
  footerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  navCircleWrap: {
    alignItems: 'center' as const,
    gap: 4,
  },
  navCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  navCircleLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  nextButtonFlex: { flex: 1 },
  nextButtonOuter: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  nextButton: {
    flexDirection: 'row' as const,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  vsCrewBtn: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginTop: 10,
    alignSelf: 'center' as const,
  },
  vsCrewInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  vsCrewText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  leaderboardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end' as const,
  },
  leaderboardCard: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%' as any,
    paddingBottom: 40,
  },
  leaderboardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  leaderboardHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  leaderboardList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  leaderboardRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.5)',
    width: 32,
  },
  leaderboardAvatar: { width: 36, height: 36, borderRadius: 18 },
  leaderboardAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  leaderboardAvatarInitial: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  leaderboardScore: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  scrollView: { flex: 1 },
  summaryContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  summaryHeaderTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    flex: 1,
  },
  summaryScoreCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  summaryScoreLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  summaryScoreValue: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginTop: 4,
  },
  summaryScoreSub: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  summaryRoundsCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  summaryRoundsTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  summaryRoundRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  summaryRoundLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  summaryRoundDist: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.3)',
  },
  summaryRoundScore: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  summaryTop3Card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  summaryTop3Header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  summaryTop3Title: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  summaryTop3Row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    gap: 10,
  },
  summaryRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  summaryRankText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#0A0A0A',
  },
  summaryPlayerAvatar: { width: 32, height: 32, borderRadius: 16 },
  summaryPlayerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  summaryPlayerInitial: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  summaryPlayerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  summaryPlayerScore: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  summaryWinnerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  summaryWinnerText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  finishBtnOuter: {
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  finishBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center' as const,
  },
  finishBtnText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
