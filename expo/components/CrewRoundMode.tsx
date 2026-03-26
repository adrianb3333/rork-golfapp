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
  ChevronDown, ChevronUp, Trophy, X, Check,
  Target, Navigation, Wind as WindIcon, Database,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSession, CrewSessionData } from '@/contexts/SessionContext';
import { useProfile } from '@/contexts/ProfileContext';
import { ScoringProvider, useScoring } from '@/contexts/ScoringContext';
import ScoreTab from '@/app/play-session/tabs/ScoreTab';
import GPSTab from '@/app/play-session/tabs/GPSTab';
import WindTab from '@/app/play-session/tabs/WindTab';
import DataTab from '@/app/play-session/tabs/DataTab';
import ScoreBoard from '@/components/ScoBoa/ScoreBoard';
import ProfileScreen from '@/app/(tabs)/profile';
import Colors from '@/constants/colors';

interface CrewRoundModeProps {
  session: CrewSessionData;
}

interface PlayerStanding {
  playerId: string;
  name: string;
  avatar: string | null;
  totalStrokes: number;
  totalPar: number;
  relativeScore: number;
}

type PlayTab = 'score' | 'gps' | 'wind' | 'data';

const GREEN_ACTIVE = '#3D954D';
const GREEN_INACTIVE = '#9BBFA2';

const tabConfig: { key: PlayTab; label: string; icon: React.ReactNode }[] = [
  { key: 'score', label: 'Score', icon: <Target size={20} /> },
  { key: 'gps', label: 'GPS', icon: <Navigation size={20} /> },
  { key: 'wind', label: 'Wind', icon: <WindIcon size={20} /> },
  { key: 'data', label: 'Data', icon: <Database size={20} /> },
];

function CrewRoundContent({ session }: CrewRoundModeProps) {
  const insets = useSafeAreaInsets();
  const { endCrewSession } = useSession();
  const { allUsers, userId } = useProfile();
  const { showScoreboard, setShowScoreboard, currentHoleIndex, goToHole } = useScoring();

  const isRound = session.type === 'round';
  const totalHoles = session.holeOption === '9_first' || session.holeOption === '9_back' ? 9 : 18;

  const [activeTab, setActiveTab] = useState<PlayTab>('score');
  const [gpsDistance, setGpsDistance] = useState<number>(0);
  const [gpsAdjustedDistance, setGpsAdjustedDistance] = useState<number>(0);
  const [showMinimized, setShowMinimized] = useState<boolean>(false);
  const [_isFinished, _setIsFinished] = useState<boolean>(false);
  const [showWaitingModal, setShowWaitingModal] = useState<boolean>(false);
  const [allPlayersFinished, _setAllPlayersFinished] = useState<boolean>(false);
  const [showFinalSummary, setShowFinalSummary] = useState<boolean>(false);
  const [showCrewLeaderboard, setShowCrewLeaderboard] = useState<boolean>(false);
  const [leaderboardSegment, setLeaderboardSegment] = useState<'score' | 'leaderboard'>('score');
  const [showDataPlayerPicker, setShowDataPlayerPicker] = useState<boolean>(false);
  const [selectedDataPlayer, setSelectedDataPlayer] = useState<string | null>(null);

  const handleGpsDistanceChange = useCallback((dist: number) => {
    setGpsDistance(dist);
  }, []);

  const handleGpsAdjustedDistanceChange = useCallback((dist: number) => {
    setGpsAdjustedDistance(dist);
  }, []);

  const handleGpsHoleChange = useCallback((index: number) => {
    console.log('[CrewRound] GPS hole changed to index:', index);
    goToHole(index);
  }, [goToHole]);

  const crewStandings = useMemo<PlayerStanding[]>(() => {
    const participants = session.participants ?? [];
    return participants.map((pid) => {
      const user = allUsers.find((u) => u.id === pid);
      const isMe = pid === userId;
      const totalStrokes = isMe ? 0 : Math.floor(Math.random() * totalHoles * 5) + totalHoles * 3;
      const totalPar = totalHoles * 4;
      return {
        playerId: pid,
        name: isMe ? 'You' : (user?.display_name || user?.username || 'Player'),
        avatar: user?.avatar_url || null,
        totalStrokes,
        totalPar,
        relativeScore: totalStrokes - totalPar,
      };
    }).sort((a, b) => a.relativeScore - b.relativeScore);
  }, [session.participants, allUsers, userId, totalHoles]);

  const formatRelative = (rel: number) => {
    if (rel === 0) return 'E';
    return rel > 0 ? `+${rel}` : `${rel}`;
  };

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

  if (showMinimized) {
    return (
      <View style={styles.minimizedContainer}>
        <View style={styles.profileContainer}>
          <ProfileScreen />
        </View>
        <View style={[styles.miniModal, { bottom: 90 }]}>
          <LinearGradient
            colors={['#4BA35B', '#3D954D', '#2D803D']}
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
              <Text style={styles.miniSessionLabel}>
                Crew {isRound ? 'Round' : 'Tournament'} in Progress
              </Text>
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

  if (showFinalSummary) {
    const winner = crewStandings[0];
    return (
      <View style={[styles.container, { backgroundColor: '#0A0A0A' }]}>
        <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
          <View style={{ width: 40 }} />
          <Text style={styles.summaryTitle}>Final Results</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryStandingsCard}>
            <View style={styles.summaryStandingsHeader}>
              <Trophy size={18} color="#FFD700" />
              <Text style={styles.summaryStandingsTitle}>
                {winner?.name === 'You' ? 'You Win!' : `Winner: ${winner?.name}`}
              </Text>
            </View>
            {crewStandings.map((player, idx) => (
              <View key={player.playerId} style={[styles.standingRow, idx === 0 && { backgroundColor: 'rgba(255,215,0,0.06)' }]}>
                <View style={[
                  styles.standingRankBadge,
                  idx === 0 && { backgroundColor: '#FFD700' },
                  idx === 1 && { backgroundColor: '#C0C0C0' },
                  idx === 2 && { backgroundColor: '#CD7F32' },
                ]}>
                  <Text style={[styles.standingRankText, idx < 3 && { color: '#0A0A0A' }]}>{idx + 1}</Text>
                </View>
                {player.avatar ? (
                  <Image source={{ uri: player.avatar }} style={styles.standingAvatar} />
                ) : (
                  <View style={styles.standingAvatarPlaceholder}>
                    <Text style={styles.standingAvatarInitial}>{player.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.standingName} numberOfLines={1}>{player.name}</Text>
                <View style={styles.standingScoreCol}>
                  <Text style={[styles.standingRelative, player.relativeScore <= 0 && { color: '#34C759' }]}>
                    {formatRelative(player.relativeScore)}
                  </Text>
                  <Text style={styles.standingStrokes}>{player.totalStrokes}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={handleFinish} activeOpacity={0.8} style={styles.finishBtnOuter}>
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

  if (showWaitingModal) {
    return (
      <View style={[styles.container, { backgroundColor: '#0A0A0A' }]}>
        <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
          <View style={{ width: 40 }} />
          <Text style={styles.waitingTitle}>Round Complete</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
          <View style={styles.waitingCard}>
            {allPlayersFinished ? (
              <TouchableOpacity
                style={styles.waitingCheckBtn}
                onPress={() => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowWaitingModal(false);
                  setShowFinalSummary(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.waitingCheckCircle}>
                  <Check size={32} color="#34C759" strokeWidth={3} />
                </View>
                <Text style={styles.waitingCheckText}>All players finished!</Text>
                <Text style={styles.waitingCheckSub}>Tap to see final results</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.waitingPending}>
                <Text style={styles.waitingPendingText}>Waiting for other players...</Text>
                <Text style={styles.waitingPendingSub}>Your round data has been saved</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  const isScoreTab = activeTab === 'score';
  const isFullScreenTab = activeTab === 'wind' || activeTab === 'gps' || activeTab === 'data';

  const renderContent = () => {
    switch (activeTab) {
      case 'score': return <ScoreTab />;
      case 'gps': return (
        <GPSTab
          onDistanceChange={handleGpsDistanceChange}
          onAdjustedDistanceChange={handleGpsAdjustedDistanceChange}
          externalHoleIndex={currentHoleIndex}
          onHoleIndexChange={handleGpsHoleChange}
        />
      );
      case 'wind': return <WindTab externalDistance={gpsDistance} externalAdjustedDistance={gpsAdjustedDistance} />;
      case 'data': return (
        <DataTab
          hideQuitButton
          bottomOverride={
            <TouchableOpacity
              style={styles.playerSelectButton}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowDataPlayerPicker(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.playerSelectText}>
                {selectedDataPlayer
                  ? (allUsers.find((u) => u.id === selectedDataPlayer)?.display_name ||
                     allUsers.find((u) => u.id === selectedDataPlayer)?.username || 'Player')
                  : 'You'}
              </Text>
            </TouchableOpacity>
          }
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {isScoreTab ? (
        <View style={[styles.scoreContainer, { paddingTop: insets.top }]}>
          {renderContent()}
        </View>
      ) : isFullScreenTab ? (
        <>
          <TouchableOpacity
            onPress={handleMinimize}
            style={[styles.minimizeButton, { top: insets.top + 4 }]}
          >
            <View style={styles.minimizeGlassCircle}>
              <ChevronDown size={28} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <View style={styles.fullScreenContent}>
            {renderContent()}
          </View>
        </>
      ) : (
        <>
          <TouchableOpacity
            onPress={handleMinimize}
            style={[styles.minimizeButton, { top: insets.top + 4 }]}
          >
            <View style={styles.minimizeGlassCircle}>
              <ChevronDown size={28} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <View style={[styles.content, { paddingTop: insets.top + 52, padding: 20 }]}>
            {renderContent()}
          </View>
        </>
      )}

      <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <View style={isActive ? styles.tabActiveHighlight : undefined}>
                <View style={[{ alignItems: 'center' as const }, isActive ? styles.iconActive : styles.iconInactive]}>
                  {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                    color: isActive ? GREEN_ACTIVE : GREEN_INACTIVE,
                  })}
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScoreBoard visible={showScoreboard} onClose={() => setShowScoreboard(false)} />

      <Modal
        visible={showCrewLeaderboard}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCrewLeaderboard(false)}
      >
        <View style={styles.leaderboardOverlay}>
          <View style={styles.leaderboardCard}>
            <View style={styles.leaderboardHeader}>
              <View style={styles.leaderboardHeaderLeft}>
                <Trophy size={18} color="#FFD700" />
                <Text style={styles.leaderboardTitle}>
                  {leaderboardSegment === 'score' ? 'Scoreboard' : 'Leaderboard'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCrewLeaderboard(false)}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {leaderboardSegment === 'score' ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {crewStandings.map((player, idx) => (
                  <View key={player.playerId} style={[styles.leaderboardRow, idx === 0 && { backgroundColor: 'rgba(255,215,0,0.06)' }]}>
                    <Text style={[styles.leaderboardRank, idx === 0 && { color: '#FFD700' }]}>#{idx + 1}</Text>
                    {player.avatar ? (
                      <Image source={{ uri: player.avatar }} style={styles.leaderboardAvatar} />
                    ) : (
                      <View style={styles.leaderboardAvatarPlaceholder}>
                        <Text style={styles.leaderboardInitial}>{player.name.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={styles.leaderboardName} numberOfLines={1}>{player.name}</Text>
                    <View style={styles.leaderboardScoreCol}>
                      <Text style={[styles.leaderboardRelative, player.relativeScore <= 0 && { color: '#34C759' }]}>
                        {formatRelative(player.relativeScore)}
                      </Text>
                      <Text style={styles.leaderboardStrokes}>{player.totalStrokes}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.lbListScroll}>
                {crewStandings.map((player, idx) => (
                  <View key={player.playerId} style={styles.lbSimpleRow}>
                    <View style={[
                      styles.lbPlaceBadge,
                      idx === 0 && { backgroundColor: '#FFD700' },
                      idx === 1 && { backgroundColor: '#C0C0C0' },
                      idx === 2 && { backgroundColor: '#CD7F32' },
                    ]}>
                      <Text style={[styles.lbPlaceText, idx < 3 && { color: '#0A0A0A' }]}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.lbPlayerName} numberOfLines={1}>{player.name}</Text>
                    <Text style={[
                      styles.lbPlayerScore,
                      player.relativeScore < 0 && { color: '#34C759' },
                      player.relativeScore > 0 && { color: '#FF6B6B' },
                    ]}>
                      {formatRelative(player.relativeScore)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.lbSegmentContainer}>
              <View style={styles.lbSegmentBar}>
                <TouchableOpacity
                  style={[styles.lbSegmentBtn, leaderboardSegment === 'score' && styles.lbSegmentBtnActive]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLeaderboardSegment('score');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.lbSegmentText, leaderboardSegment === 'score' && styles.lbSegmentTextActive]}>Score</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.lbSegmentBtn, leaderboardSegment === 'leaderboard' && styles.lbSegmentBtnActive]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLeaderboardSegment('leaderboard');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.lbSegmentText, leaderboardSegment === 'leaderboard' && styles.lbSegmentTextActive]}>Leaderboard</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDataPlayerPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDataPlayerPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Player</Text>
              <TouchableOpacity onPress={() => setShowDataPlayerPicker(false)}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.pickerRow, !selectedDataPlayer && styles.pickerRowActive]}
                onPress={() => { setSelectedDataPlayer(null); setShowDataPlayerPicker(false); }}
              >
                <Text style={styles.pickerRowText}>You</Text>
                {!selectedDataPlayer && <Check size={18} color="#34C759" />}
              </TouchableOpacity>
              {(session.participants ?? []).filter((pid) => pid !== userId).map((pid) => {
                const user = allUsers.find((u) => u.id === pid);
                const name = user?.display_name || user?.username || 'Player';
                const isActive = selectedDataPlayer === pid;
                return (
                  <TouchableOpacity
                    key={pid}
                    style={[styles.pickerRow, isActive && styles.pickerRowActive]}
                    onPress={() => { setSelectedDataPlayer(pid); setShowDataPlayerPicker(false); }}
                  >
                    {user?.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.pickerAvatar} />
                    ) : (
                      <View style={styles.pickerAvatarPlaceholder}>
                        <Text style={styles.pickerAvatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={styles.pickerRowText}>{name}</Text>
                    {isActive && <Check size={18} color="#34C759" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function CrewRoundMode({ session }: CrewRoundModeProps) {
  return (
    <ScoringProvider>
      <CrewRoundContent session={session} />
    </ScoringProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  minimizedContainer: { flex: 1 },
  profileContainer: { flex: 1 },
  scoreContainer: { flex: 1 },
  minimizeButton: {
    position: 'absolute' as const,
    left: 12,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  minimizeGlassCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fullScreenContent: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  tabActiveHighlight: {
    backgroundColor: 'rgba(61,149,77,0.08)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  iconActive: {},
  iconInactive: { opacity: 0.5 },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    color: GREEN_INACTIVE,
    fontWeight: '500' as const,
  },
  tabLabelActive: {
    color: GREEN_ACTIVE,
    fontWeight: '700' as const,
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
  headerBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scrollView: { flex: 1 },
  summaryContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },
  summaryTitle: { fontSize: 20, fontWeight: '800' as const, color: '#FFFFFF', textAlign: 'center' as const, flex: 1 },
  waitingTitle: { fontSize: 20, fontWeight: '800' as const, color: '#FFFFFF', textAlign: 'center' as const, flex: 1 },
  summaryStandingsCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, marginBottom: 16,
  },
  summaryStandingsHeader: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 14,
  },
  summaryStandingsTitle: { fontSize: 16, fontWeight: '800' as const, color: '#FFD700' },
  standingRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, marginBottom: 4, gap: 10,
  },
  standingRankBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  standingRankText: { fontSize: 12, fontWeight: '800' as const, color: 'rgba(255,255,255,0.5)' },
  standingAvatar: { width: 32, height: 32, borderRadius: 16 },
  standingAvatarPlaceholder: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  standingAvatarInitial: { fontSize: 13, fontWeight: '700' as const, color: 'rgba(255,255,255,0.5)' },
  standingName: { flex: 1, fontSize: 14, fontWeight: '600' as const, color: '#FFFFFF' },
  standingScoreCol: { alignItems: 'flex-end' as const },
  standingRelative: { fontSize: 16, fontWeight: '800' as const, color: '#FF6B6B' },
  standingStrokes: { fontSize: 11, fontWeight: '600' as const, color: 'rgba(255,255,255,0.35)' },
  finishBtnOuter: { borderRadius: 16, overflow: 'hidden' as const },
  finishBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' as const },
  finishBtnText: { fontSize: 18, fontWeight: '800' as const, color: '#FFFFFF' },
  waitingCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20,
    padding: 28, alignItems: 'center' as const,
  },
  waitingCheckBtn: { alignItems: 'center' as const },
  waitingCheckCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(52,199,89,0.15)',
    alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 12,
  },
  waitingCheckText: { fontSize: 17, fontWeight: '800' as const, color: '#FFFFFF' },
  waitingCheckSub: { fontSize: 13, fontWeight: '600' as const, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  waitingPending: { alignItems: 'center' as const },
  waitingPendingText: { fontSize: 17, fontWeight: '700' as const, color: '#FFFFFF' },
  waitingPendingSub: { fontSize: 13, fontWeight: '500' as const, color: 'rgba(255,255,255,0.4)', marginTop: 6 },
  leaderboardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' as const },
  leaderboardCard: {
    backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%' as any, paddingBottom: 40,
  },
  leaderboardHeader: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'space-between' as const, paddingHorizontal: 20,
    paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  leaderboardHeaderLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  leaderboardTitle: { fontSize: 18, fontWeight: '800' as const, color: '#FFFFFF' },
  leaderboardRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4, gap: 10,
    marginHorizontal: 16,
  },
  leaderboardRank: { fontSize: 15, fontWeight: '800' as const, color: 'rgba(255,255,255,0.5)', width: 30 },
  leaderboardAvatar: { width: 34, height: 34, borderRadius: 17 },
  leaderboardAvatarPlaceholder: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  leaderboardInitial: { fontSize: 13, fontWeight: '700' as const, color: 'rgba(255,255,255,0.5)' },
  leaderboardName: { flex: 1, fontSize: 14, fontWeight: '600' as const, color: '#FFFFFF' },
  leaderboardScoreCol: { alignItems: 'flex-end' as const },
  leaderboardRelative: { fontSize: 16, fontWeight: '800' as const, color: '#FF6B6B' },
  leaderboardStrokes: { fontSize: 11, fontWeight: '600' as const, color: 'rgba(255,255,255,0.35)' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' as const },
  pickerCard: {
    backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '60%' as any, paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'space-between' as const, paddingHorizontal: 20,
    paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  pickerTitle: { fontSize: 18, fontWeight: '800' as const, color: '#FFFFFF' },
  pickerRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingVertical: 12, paddingHorizontal: 20, gap: 12,
  },
  pickerRowActive: { backgroundColor: 'rgba(52,199,89,0.08)' },
  pickerAvatar: { width: 32, height: 32, borderRadius: 16 },
  pickerAvatarPlaceholder: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  pickerAvatarInitial: { fontSize: 13, fontWeight: '700' as const, color: 'rgba(255,255,255,0.5)' },
  pickerRowText: { flex: 1, fontSize: 15, fontWeight: '600' as const, color: '#FFFFFF' },
  playerSelectButton: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginTop: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  playerSelectText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  lbListScroll: {
    flex: 1,
  },
  lbSimpleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  lbPlaceBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  lbPlaceText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  lbPlayerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  lbPlayerScore: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  lbSegmentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  lbSegmentBar: {
    flexDirection: 'row' as const,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 3,
  },
  lbSegmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  lbSegmentBtnActive: {
    backgroundColor: '#3D954D',
  },
  lbSegmentText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.45)',
  },
  lbSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
});
