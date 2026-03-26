import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HelpCircle, X, User, Newspaper, Bluetooth, Swords, Clock, Target, Zap, Hash, Menu, ChevronRight, Settings, Camera, Bell, ArrowRight, ChevronLeft, Search, Backpack, CheckCircle, Crosshair } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const PROFILE_HEADER_HEIGHT = 56;
import { wp, hp, fp, getScreenWidth } from '@/utils/responsive';
import * as Haptics from 'expo-haptics';
import { useProfile, UserProfile } from '@/contexts/ProfileContext';
import { useSession } from '@/contexts/SessionContext';
import { useAppNavigation } from '@/contexts/AppNavigationContext';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { useSensor } from '@/contexts/SensorContext';
import { useBattle } from '@/contexts/BattleContext';

import ProfileCard from '@/components/ProfileCard';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { supabase } from '@/lib/supabase';
import { useBag } from '@/contexts/BagContext';
import { useChat } from '@/contexts/ChatContext';
import { useLiveRound } from '@/contexts/LiveRoundContext';
import LiveRoundScreen from '@/components/LiveRoundScreen';



const SCREEN_WIDTH = getScreenWidth();

interface DrillEntry {
  id: string;
  drill_name: string;
  score: number | null;
  created_at: string;
  user_id: string;
}

function usePracticeCardData() {
  const [loading, setLoading] = useState<boolean>(true);
  const [drillCount, setDrillCount] = useState<number>(0);
  const [latestDrill, setLatestDrill] = useState<{ drill_name: string; score: number | null; created_at: string } | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { count, error: countErr } = await supabase
          .from('golf_drills')
          .select('*', { count: 'exact', head: true });
        if (countErr) console.log('[PracticeCard] count error:', countErr.message);
        setDrillCount(count || 0);

        const { data, error } = await supabase
          .from('golf_drills')
          .select('drill_name, score, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) {
          console.log('[PracticeCard] fetch error:', error.message);
        } else {
          setLatestDrill(data);
        }
      } catch (e: any) {
        console.log('[PracticeCard] error:', e.message);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  return { loading, drillCount, latestDrill };
}

function PracticeCardContent() {
  const { loading, drillCount, latestDrill } = usePracticeCardData();

  if (loading) {
    return (
      <View style={practiceCardStyles.centered}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  const dateString = latestDrill?.created_at
    ? new Date(latestDrill.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return (
    <View style={practiceCardStyles.content}>
      {latestDrill ? (
        <View style={practiceCardStyles.innerRow}>
          <View style={practiceCardStyles.left}>
            <Text style={practiceCardStyles.drillName}>{latestDrill.drill_name}</Text>
            <Text style={practiceCardStyles.date}>{dateString}</Text>
            <Text style={practiceCardStyles.count}>{drillCount} drills total</Text>
          </View>
          <Text style={practiceCardStyles.score}>{latestDrill.score ?? '-'}</Text>
        </View>
      ) : (
        <Text style={practiceCardStyles.empty}>No practice yet</Text>
      )}
    </View>
  );
}

const practiceCardStyles = StyleSheet.create({
  centered: {
    paddingVertical: 30,
    alignItems: 'center' as const,
  },
  content: {
    flex: 1,
  },
  innerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  left: {
    flex: 1,
  },
  drillName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  date: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  count: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  score: {
    fontSize: 38,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  empty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
});

function PracticePopupContent() {
  const [loading, setLoading] = useState<boolean>(true);
  const [drills, setDrills] = useState<DrillEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { count, error: countErr } = await supabase
          .from('golf_drills')
          .select('*', { count: 'exact', head: true });
        if (countErr) console.log('[PracticePopup] count error:', countErr.message);
        setTotalCount(count || 0);

        const { data, error } = await supabase
          .from('golf_drills')
          .select('id, drill_name, score, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) {
          console.log('[PracticePopup] fetch error:', error.message);
        } else {
          setDrills((data as DrillEntry[]) || []);
        }
      } catch (e: any) {
        console.log('[PracticePopup] error:', e.message);
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, []);

  if (loading) {
    return (
      <View style={lpStyles.centered}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  if (drills.length === 0) {
    return (
      <View style={lpStyles.centered}>
        <Text style={lpStyles.emptyText}>No practice sessions recorded yet</Text>
      </View>
    );
  }

  const latestDrill = drills[0];
  const latestDate = new Date(latestDrill.created_at);
  const sessionDrills = drills.filter(
    (d) => new Date(d.created_at).toDateString() === latestDate.toDateString()
  );
  const uniqueDrillNames = [...new Set(sessionDrills.map((d) => d.drill_name))];
  const scores = sessionDrills.filter((d) => d.score !== null).map((d) => d.score as number);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
  const bestScore = scores.length > 0 ? Math.max(...scores) : null;
  const worstScore = scores.length > 0 ? Math.min(...scores) : null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const firstDrillTime = sessionDrills.length > 0 ? new Date(sessionDrills[sessionDrills.length - 1].created_at) : null;
  const lastDrillTime = sessionDrills.length > 0 ? new Date(sessionDrills[0].created_at) : null;
  let durationStr = '-';
  if (firstDrillTime && lastDrillTime) {
    const diffMs = lastDrillTime.getTime() - firstDrillTime.getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) {
      durationStr = `${Math.max(mins, 1)} min`;
    } else {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      durationStr = `${h}h ${m}m`;
    }
  }

  return (
    <View style={lpStyles.wrapper}>
      <View style={lpStyles.overviewCard}>
        <Text style={lpStyles.overviewDate}>{formatDate(latestDrill.created_at)}</Text>
        <Text style={lpStyles.overviewTime}>Started {formatTime(sessionDrills[sessionDrills.length - 1]?.created_at || latestDrill.created_at)}</Text>
      </View>

      <View style={lpStyles.statsGrid}>
        <View style={lpStyles.statBox}>
          <Clock size={16} color="#FFFFFF" />
          <Text style={lpStyles.statValue}>{durationStr}</Text>
          <Text style={lpStyles.statLabel}>Duration</Text>
        </View>
        <View style={lpStyles.statBox}>
          <Hash size={16} color="#FFFFFF" />
          <Text style={lpStyles.statValue}>{sessionDrills.length}</Text>
          <Text style={lpStyles.statLabel}>Drills</Text>
        </View>
        <View style={lpStyles.statBox}>
          <Target size={16} color="#FFB74D" />
          <Text style={lpStyles.statValue}>{avgScore}</Text>
          <Text style={lpStyles.statLabel}>Avg Score</Text>
        </View>
        <View style={lpStyles.statBox}>
          <Zap size={16} color="#FFFFFF" />
          <Text style={lpStyles.statValue}>{uniqueDrillNames.length}</Text>
          <Text style={lpStyles.statLabel}>Drill Types</Text>
        </View>
      </View>

      {bestScore !== null && (
        <View style={lpStyles.highlightsRow}>
          <View style={lpStyles.highlightBox}>
            <Text style={lpStyles.highlightLabel}>Best</Text>
            <Text style={[lpStyles.highlightValue, { color: '#A4FF6B' }]}>{bestScore}</Text>
          </View>
          <View style={lpStyles.highlightBox}>
            <Text style={lpStyles.highlightLabel}>Worst</Text>
            <Text style={[lpStyles.highlightValue, { color: '#FF6B6B' }]}>{worstScore}</Text>
          </View>
        </View>
      )}

      <View style={lpStyles.drillTypesSection}>
        <Text style={lpStyles.sectionTitle}>Drill Types Performed</Text>
        {uniqueDrillNames.map((name, idx) => {
          const drillsOfType = sessionDrills.filter((d) => d.drill_name === name);
          const typeScores = drillsOfType.filter((d) => d.score !== null).map((d) => d.score as number);
          const typeAvg = typeScores.length > 0 ? (typeScores.reduce((a, b) => a + b, 0) / typeScores.length).toFixed(1) : '-';
          return (
            <View key={idx} style={lpStyles.drillTypeRow}>
              <View style={lpStyles.drillTypeDot} />
              <View style={lpStyles.drillTypeInfo}>
                <Text style={lpStyles.drillTypeName}>{name}</Text>
                <Text style={lpStyles.drillTypeMeta}>{drillsOfType.length} reps · avg {typeAvg}</Text>
              </View>
              {typeScores.length > 0 && (
                <Text style={lpStyles.drillTypeBest}>{Math.max(...typeScores)}</Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={lpStyles.allDrillsSection}>
        <Text style={lpStyles.sectionTitle}>All Drills ({sessionDrills.length})</Text>
        {sessionDrills.map((drill, idx) => (
          <View key={drill.id || idx} style={lpStyles.drillRow}>
            <View style={lpStyles.drillRowLeft}>
              <Text style={lpStyles.drillRowName}>{drill.drill_name}</Text>
              <Text style={lpStyles.drillRowTime}>{formatTime(drill.created_at)}</Text>
            </View>
            <Text style={[
              lpStyles.drillRowScore,
              drill.score !== null && drill.score === bestScore && { color: '#A4FF6B' },
            ]}>
              {drill.score ?? '-'}
            </Text>
          </View>
        ))}
      </View>

      <View style={lpStyles.totalSection}>
        <Text style={lpStyles.totalLabel}>Total Drills Recorded</Text>
        <Text style={lpStyles.totalValue}>{totalCount}</Text>
      </View>
    </View>
  );
}

const lpStyles = StyleSheet.create({
  wrapper: {
    paddingBottom: 30,
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  overviewCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  overviewDate: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  overviewTime: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    width: '47%' as any,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center' as const,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  highlightsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 16,
  },
  highlightBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  highlightLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 24,
    fontWeight: '900' as const,
  },
  drillTypesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  drillTypeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  drillTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  drillTypeInfo: {
    flex: 1,
  },
  drillTypeName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  drillTypeMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  drillTypeBest: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFD700',
  },
  allDrillsSection: {
    marginBottom: 20,
  },
  drillRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  drillRowLeft: {
    flex: 1,
  },
  drillRowName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  drillRowTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  drillRowScore: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  totalSection: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  totalLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  const {
    profile,
    isLoading,
    followers,
    following,
    followersCount,
    followingCount,
    toggleFollow,
    isTogglingFollow,
    isFollowing,
    allUsers,
    isLoadingAllUsers,
    backgroundImageUri,
    crewName,
    crewColor,
    crewLogo,
    pendingCrewInvites,
    hasCrewAccess,
  } = useProfile();

  const { lastRound } = useSession();
  const { openSidebar, navigateTo } = useAppNavigation();
  const insets = useSafeAreaInsets();
  const { headerTranslateY, onScroll: onHeaderScroll } = useScrollHeader(PROFILE_HEADER_HEIGHT);

  const [followsModalVisible, setFollowsModalVisible] = useState<boolean>(false);
  const [followsTab, setFollowsTab] = useState<'hitta' | 'followers' | 'following' | 'friends'>('hitta');
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState<boolean>(false);
  const [lastRoundPopupVisible, setLastRoundPopupVisible] = useState<boolean>(false);
  const [lastPracticePopupVisible, setLastPracticePopupVisible] = useState<boolean>(false);
  const [profileCardUser, setProfileCardUser] = useState<UserProfile | null>(null);
  const [profileCardVisible, setProfileCardVisible] = useState<boolean>(false);
  const [helpMenuVisible, setHelpMenuVisible] = useState<boolean>(false);
  const [followsSearchQuery, setFollowsSearchQuery] = useState<string>('');
  const followsUnderlineAnim = useRef(new Animated.Value(0)).current;

  const FOLLOWS_SEGMENTS = ['Hitta', 'Följare', 'Följer', 'Friends'] as const;
  const followsSegmentWidth = (SCREEN_WIDTH - 48) / FOLLOWS_SEGMENTS.length;
  const followsUnderlineWidth = 40;

  const followsTranslateX = followsUnderlineAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      (followsSegmentWidth - followsUnderlineWidth) / 2,
      followsSegmentWidth + (followsSegmentWidth - followsUnderlineWidth) / 2,
      followsSegmentWidth * 2 + (followsSegmentWidth - followsUnderlineWidth) / 2,
      followsSegmentWidth * 3 + (followsSegmentWidth - followsUnderlineWidth) / 2,
    ],
  });
  const helpMenuAnim = useRef(new Animated.Value(0)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const randomHcp = useRef((Math.random() * 20 + 5).toFixed(1)).current;

  const [newsRead, setNewsRead] = useState<boolean>(false);
  const [notificationsRead, setNotificationsRead] = useState<boolean>(false);

  const { hasBag } = useBag();
  const { hasUnreadChats } = useChat();
  const { isPaired: hasSensors, pairedClubs } = useSensor();
  const { battleResults } = useBattle();
  const { liveRounds, selectRound, selectedRound, pollLiveRounds } = useLiveRound();
  const [liveRoundModalVisible, setLiveRoundModalVisible] = useState<boolean>(false);
  const { drillCount } = usePracticeCardData();
  const hasPendingCrewInvites = pendingCrewInvites.length > 0;
  const hasUnreadNotifications = (followers.length > 0 && !notificationsRead) || hasUnreadChats || hasPendingCrewInvites;
  const hasNewNews = !newsRead;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    console.log('[Profile] Triggering live round poll on mount');
    void pollLiveRounds();
  }, [pollLiveRounds]);

  const handleAvatarPress = useCallback(() => {
    console.log('[Profile] Opening avatar preview');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAvatarPreviewVisible(true);
  }, []);

  const openFollowsModal = useCallback((tab: 'hitta' | 'followers' | 'following' | 'friends') => {
    console.log('[Profile] Opening follows modal, tab:', tab);
    setFollowsTab(tab);
    setFollowsSearchQuery('');
    const tabIndex = tab === 'hitta' ? 0 : tab === 'followers' ? 1 : tab === 'following' ? 2 : 3;
    followsUnderlineAnim.setValue(tabIndex);
    setFollowsModalVisible(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [followsUnderlineAnim]);

  const handleToggleFollow = useCallback(async (targetUserId: string) => {
    console.log('[Profile] Toggle follow:', targetUserId);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await toggleFollow(targetUserId);
    } catch (err: any) {
      console.error('[Profile] Toggle follow error:', err.message);
    }
  }, [toggleFollow]);

  const openProfileCard = useCallback((user: UserProfile) => {
    console.log('[Profile] Opening profile card for:', user.username);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfileCardUser(user);
    setProfileCardVisible(true);
  }, []);

  const handleFollowsTabChange = useCallback((tab: 'hitta' | 'followers' | 'following' | 'friends') => {
    setFollowsTab(tab);
    const tabIndex = tab === 'hitta' ? 0 : tab === 'followers' ? 1 : tab === 'following' ? 2 : 3;
    Animated.spring(followsUnderlineAnim, {
      toValue: tabIndex,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [followsUnderlineAnim]);

  const getFilteredListData = useCallback(() => {
    const data = (() => {
      if (followsTab === 'hitta') return allUsers;
      if (followsTab === 'followers') return followers;
      if (followsTab === 'friends') return following;
      return following;
    })();
    if (!followsSearchQuery.trim()) return data;
    const q = followsSearchQuery.toLowerCase();
    return data.filter((u) =>
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
    );
  }, [followsTab, allUsers, followers, following, followsSearchQuery]);

  const renderFollowUser = useCallback(({ item }: { item: UserProfile }) => {
    const amFollowing = isFollowing(item.id);
    return (
      <View style={styles.followUserRow}>
        <TouchableOpacity
          style={styles.followUserLeft}
          onPress={() => openProfileCard(item)}
          activeOpacity={0.7}
        >
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.followUserAvatar} />
          ) : (
            <View style={styles.followUserAvatarPlaceholder}>
              <User size={20} color="rgba(0,0,0,0.35)" />
            </View>
          )}
          <View style={styles.followUserInfo}>
            <Text style={styles.followUserName} numberOfLines={1}>{item.display_name || item.username || 'Användare'}</Text>
            <Text style={styles.followUserUsername} numberOfLines={1}>@{item.username}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followBtn, amFollowing && styles.followBtnFollowing]}
          onPress={() => handleToggleFollow(item.id)}
          disabled={isTogglingFollow}
          activeOpacity={0.7}
        >
          <Text style={[styles.followBtnText, amFollowing && styles.followBtnTextFollowing]}>
            {amFollowing ? 'Följer' : 'Följ'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [isFollowing, handleToggleFollow, isTogglingFollow, openProfileCard]);

  const getEmptyText = useCallback(() => {
    if (followsTab === 'hitta') return 'Inga användare hittades';
    if (followsTab === 'followers') return 'Inga följare ännu';
    if (followsTab === 'friends') return 'No friends yet';
    return 'Följer ingen ännu';
  }, [followsTab]);

  const initials = (profile?.display_name || profile?.username || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getToParDisplay = () => {
    if (!lastRound) return '';
    const diff = lastRound.totalScore - lastRound.totalPar;
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  const getToParColor = () => {
    if (!lastRound) return '#888';
    const diff = lastRound.totalScore - lastRound.totalPar;
    if (diff < 0) return '#3D954D';
    if (diff === 0) return '#3D954D';
    return '#FF5252';
  };

  const toggleHelpMenu = useCallback(() => {
    const toValue = helpMenuVisible ? 0 : 1;
    Animated.spring(helpMenuAnim, {
      toValue,
      friction: 12,
      tension: 60,
      useNativeDriver: true,
    }).start();
    setHelpMenuVisible(!helpMenuVisible);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [helpMenuVisible, helpMenuAnim]);



  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerAbsolute, { transform: [{ translateY: headerTranslateY }] }]} pointerEvents="box-none">
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.headerRow} pointerEvents="box-none">
          <TouchableOpacity
            onPress={openSidebar}
            style={styles.glassIconCircle}
            activeOpacity={0.7}
            testID="hamburger-menu"
          >
            <Menu size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={require('@/assets/images/golferscrib-header-logo.png')}
            style={[styles.headerLogo, backgroundImageUri ? { tintColor: '#FFFFFF' } : undefined]}
            resizeMode="contain"
          />
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/modals/recap-modal' as any);
              }}
              style={styles.glassIconCircle}
              activeOpacity={0.7}
              testID="weekly-summary-button"
            >
              <Crosshair size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleHelpMenu}
              style={styles.glassIconCircle}
              activeOpacity={0.7}
              testID="help-menu-button"
            >
              <HelpCircle size={22} color="#FFFFFF" />
              {(hasUnreadNotifications || hasNewNews) && <View style={styles.helpIconRedDot} />}
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
      </Animated.View>

      {helpMenuVisible && (
        <Animated.View style={[
          styles.helpMenuOverlay,
          { paddingTop: insets.top + PROFILE_HEADER_HEIGHT + 4, opacity: helpMenuAnim, transform: [{ scale: helpMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
        ]}>
          <TouchableOpacity style={styles.helpMenuBackdrop} activeOpacity={1} onPress={toggleHelpMenu} />
          <View style={styles.helpMenu}>
            <TouchableOpacity
              style={styles.helpMenuItem}
              onPress={() => { toggleHelpMenu(); router.push('/settings/settings1' as any); }}
              activeOpacity={0.7}
            >
              <Settings size={18} color="#B0B0B0" />
              <Text style={styles.helpMenuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpMenuItem}
              onPress={() => { toggleHelpMenu(); setNewsRead(true); router.push('/modals/news-modal' as any); }}
              activeOpacity={0.7}
            >
              <Newspaper size={18} color="#B0B0B0" />
              <Text style={styles.helpMenuText}>Information</Text>
              {hasNewNews && <View style={styles.helpMenuRedDot} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpMenuItem}
              onPress={() => {
                toggleHelpMenu();
                if (hasBag) {
                  router.push('/modals/my-bag-modal' as any);
                } else {
                  router.push('/modals/my-bag-build-modal' as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Backpack size={18} color="#B0B0B0" />
              <Text style={styles.helpMenuText}>My Bag</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpMenuItem}
              onPress={() => { toggleHelpMenu(); if (pairedClubs.length > 0) { router.push('/modals/sensor-bag-modal' as any); } else { router.push('/modals/pair-impact-modal' as any); } }}
              activeOpacity={0.7}
            >
              <Bluetooth size={18} color="#B0B0B0" />
              <Text style={styles.helpMenuText}>Pair Sensors</Text>
            </TouchableOpacity>
            <View style={styles.helpMenuDivider} />
            <TouchableOpacity
              style={styles.helpMenuItem}
              onPress={() => { toggleHelpMenu(); setNotificationsRead(true); router.push('/modals/notifications-modal' as any); }}
              activeOpacity={0.7}
            >
              <Bell size={18} color="#B0B0B0" />
              <Text style={styles.helpMenuText}>Notifications</Text>
              {hasUnreadNotifications && <View style={styles.helpMenuRedDot} />}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + PROFILE_HEADER_HEIGHT }} onScroll={onHeaderScroll} scrollEventThrottle={16}>
        <Animated.View style={[styles.contentOuter, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

          <View style={[styles.imageScrollArea, backgroundImageUri ? { marginTop: -(insets.top + PROFILE_HEADER_HEIGHT), paddingTop: insets.top + PROFILE_HEADER_HEIGHT, paddingBottom: 50 } : undefined]}>
            {backgroundImageUri ? (
              <Image source={{ uri: backgroundImageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : null}
            <View style={styles.imageScrollContent}>
              <View style={styles.profileTopSection}>
            <View style={styles.avatarAndFriendsColumn}>
              <TouchableOpacity
                onPress={handleAvatarPress}
                style={styles.avatarTouchable}
                activeOpacity={0.8}
                testID="avatar-button"
              >
                <View style={styles.avatarShadowWrap}>
                  <View style={styles.avatarClip}>
                    {profile?.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.friendsPillUnder}
                onPress={() => openFollowsModal('friends')}
                activeOpacity={0.7}
                testID="friends-button"
              >
                <Text style={styles.friendsCount}>12</Text>
                <Text style={styles.friendsLabel}>Friends</Text>
                <View style={styles.friendsAvatarStack}>
                  <View style={[styles.friendsStackAvatar, { backgroundColor: '#4BA35B', zIndex: 3 }]}>
                    <Text style={styles.friendsStackInitial}>A</Text>
                  </View>
                  <View style={[styles.friendsStackAvatar, { backgroundColor: '#1075E3', left: -10, zIndex: 2 }]}>
                    <Text style={styles.friendsStackInitial}>M</Text>
                  </View>
                  <View style={[styles.friendsStackAvatar, { backgroundColor: '#FF5252', left: -20, zIndex: 1 }]}>
                    <Text style={styles.friendsStackInitial}>K</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.rightColumn}>
              <TouchableOpacity
                style={styles.followPillVertical}
                onPress={() => openFollowsModal('followers')}
                activeOpacity={0.7}
                testID="followers-button"
              >
                <Text style={styles.followStatNumber}>{followersCount}</Text>
                <View style={styles.followHorizontalDivider} />
                <Text style={styles.followStatNumber}>{followingCount}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionGrid}>
              <View style={styles.actionGridRow}>
                <TouchableOpacity
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/modals/handicap-modal' as any);
                  }}
                  activeOpacity={0.8}
                  testID="handicap-button"
                  style={styles.handicapGradientBtn}
                >
                  <LinearGradient
                    colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.handicapGradientInner}
                  >
                    <Text style={styles.handicapBoldText}>{randomHcp}</Text>
                    <Image
                      source={require('@/assets/images/sgf-icon.png')}
                      style={styles.handicapSgfIcon}
                      resizeMode="contain"
                    />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.qrImageBtn}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/modals/qr-modal' as any);
                  }}
                  activeOpacity={0.8}
                  testID="qr-button"
                >
                  <Image
                    source={require('@/assets/images/qr-icon.png')}
                    style={styles.qrIconImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.actionGridRow}>
                <TouchableOpacity
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigateTo('data-overview', { initialTab: 'video' });
                  }}
                  activeOpacity={0.8}
                  testID="camera-button"
                  style={styles.cameraGradientBtn}
                >
                  <LinearGradient
                    colors={['#BFF3FF', '#3FB8E8', '#0F6FAF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.cameraGradientInner}
                  >
                    <Camera size={18} color="#000000" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/modals/compare-modal' as any);
                  }}
                  activeOpacity={0.8}
                  testID="compare-button"
                  style={styles.compareGradientBtn}
                >
                  <LinearGradient
                    colors={['#FF1C1C', '#E31010', '#B20000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.compareGradientInner}
                  >
                    <Swords size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>

            </View>

          </View>

          <View style={[styles.liveDividerArea, backgroundImageUri ? { marginTop: -50 } : undefined]}>
            <View style={styles.liveDividerCurvedWhite}>
              <View style={styles.liveDividerCurvedWhiteInner} />
            </View>
          </View>

          <View style={styles.whiteContentBelow}>
            {hasCrewAccess && (
              <View style={styles.crewSection}>
                <Text style={styles.crewSectionTitleBlack}>CREW</Text>
                <TouchableOpacity
                  style={[styles.crewCard, crewColor && crewColor !== '#1A1A1A' && { backgroundColor: crewColor }]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigateTo('crew' as any);
                  }}
                  activeOpacity={0.8}
                  testID="crew-card"
                >
                  <View style={styles.crewCardInner}>
                    {crewLogo ? (
                      <Image source={{ uri: crewLogo }} style={styles.crewLogoMini} />
                    ) : (
                      <View style={styles.crewDot} />
                    )}
                    <Text style={[styles.crewCardText, crewColor && crewColor !== '#1A1A1A' && { color: '#FFFFFF' }]}>
                      {crewName ? crewName : 'No Crew for the moment'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.liveSection}>
            <Text style={styles.liveSectionTitle}>LIVE</Text>
            {liveRounds.length > 0 ? (
              <View style={styles.liveCardsList}>
                {liveRounds.map((lr) => {
                  const mainPlayer = lr.players[0];
                  const toPar = mainPlayer ? (() => {
                    const diff = mainPlayer.totalScore - mainPlayer.totalPar;
                    if (mainPlayer.holesPlayed === 0) return 'E';
                    if (diff === 0) return 'E';
                    return diff > 0 ? `+${diff}` : `${diff}`;
                  })() : 'E';
                  return (
                    <TouchableOpacity
                      key={lr.id}
                      style={styles.liveRoundCard}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        selectRound(lr);
                        setLiveRoundModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.liveRoundCardLeft}>
                        <View style={styles.livePulse} />
                        <View style={styles.liveRoundInfo}>
                          <Text style={styles.liveRoundFriend} numberOfLines={1}>{lr.friendName}</Text>
                          <Text style={styles.liveRoundCourse} numberOfLines={1}>{lr.courseName}</Text>
                        </View>
                      </View>
                      <View style={styles.liveRoundCardRight}>
                        <Text style={styles.liveRoundHoles}>{mainPlayer?.holesPlayed ?? 0} holes</Text>
                        <Text style={styles.liveRoundToPar}>{toPar}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.liveCard}>
                <View style={styles.liveEmptyState}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveEmptyText}>No friends playing right now</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.cardsColumn}>
            <View>
              <Text style={styles.cardSectionHeader}>Last Round</Text>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLastRoundPopupVisible(true);
                }}
                activeOpacity={0.8}
                style={styles.roundCardOuter}
              >
                <LinearGradient
                  colors={['#4BA35B', '#3D954D', '#2D803D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.roundCardGradient}
                >
                  {lastRound ? (
                    <View style={styles.gradientCardContent}>
                      <View style={styles.gradientCardTop}>
                        <Text style={styles.gradientCardToParBadge}>{getToParDisplay()}</Text>
                      </View>
                      <View style={styles.gradientCardInnerRow}>
                        <View style={styles.gradientCardLeft}>
                          <Text style={styles.gradientCardCourse} numberOfLines={1}>{lastRound.courseName}</Text>
                          <Text style={styles.gradientCardDate}>{lastRound.roundDate}</Text>
                          <Text style={styles.gradientCardHoles}>{lastRound.holesPlayed} holes</Text>
                        </View>
                        <Text style={styles.gradientCardScore}>{lastRound.totalScore}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.gradientCardContent}>
                      <Text style={styles.gradientCardEmpty}>No rounds yet</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.cardSectionHeader}>Last Practice</Text>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLastPracticePopupVisible(true);
                }}
                activeOpacity={0.8}
                style={styles.practiceCardOuter}
              >
                <LinearGradient
                  colors={['#1C8CFF', '#1075E3', '#0059B2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.practiceCardGradient}
                >
                  <PracticeCardContent />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View>
            <Text style={styles.cardSectionHeader}>Tour</Text>
            <TouchableOpacity
              style={styles.tourCard}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigateTo('community');
              }}
              activeOpacity={0.8}
              testID="tour-card"
            >
              <View style={styles.tourCardHeader}>
                <Text style={styles.tourCardHeaderText}>Golfer's Tour</Text>
                <View style={styles.tourCardHeaderRight}>
                  <Image source={require('@/assets/images/golferscrib-logo-clean.png')} style={styles.cardLogoImage} resizeMode="contain" />
                  <ChevronRight size={16} color="#666" />
                </View>
              </View>
              <View style={styles.tourCardBody}>
                <View style={styles.tourDataGridCompact}>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall}>4</Text>
                    <Text style={styles.tourDataLabelSmall}>Events</Text>
                  </View>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall}>2</Text>
                    <Text style={styles.tourDataLabelSmall}>Places</Text>
                  </View>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall}>8,500</Text>
                    <Text style={styles.tourDataLabelSmall}>Earnings</Text>
                  </View>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall}>#12</Text>
                    <Text style={styles.tourDataLabelSmall}>Rank</Text>
                  </View>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall} numberOfLines={1}>Bro Hof</Text>
                    <Text style={styles.tourDataLabelSmall}>Course</Text>
                  </View>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall}>24</Text>
                    <Text style={styles.tourDataLabelSmall}>Age</Text>
                  </View>
                </View>
                <Image source={require('@/assets/images/tour-card-photo.png')} style={styles.tourCardPhoto} resizeMode="cover" />
              </View>
            </TouchableOpacity>
            </View>

            <View>
            <Text style={styles.cardSectionHeader}>Affiliate</Text>
            <TouchableOpacity
              style={styles.affiliateCard}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigateTo('community', { communityTab: 'affiliate' });
              }}
              activeOpacity={0.8}
              testID="affiliate-card"
            >
              <View style={styles.affiliateCardHeader}>
                <Text style={styles.affiliateCardHeaderText}>Get your Rewards!</Text>
                <View style={styles.tourCardHeaderRight}>
                  <Image source={require('@/assets/images/golferscrib-logo-clean.png')} style={styles.cardLogoImage} resizeMode="contain" />
                  <ChevronRight size={16} color="#666" />
                </View>
              </View>
              <View style={styles.tourCardBody}>
                <View style={styles.tourDataGridCompact}>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall}>19</Text>
                    <Text style={styles.tourDataLabelSmall}>Referrals</Text>
                  </View>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall}>100</Text>
                    <Text style={styles.tourDataLabelSmall}>Goal</Text>
                  </View>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall} numberOfLines={1}>5 Rounds</Text>
                    <Text style={styles.tourDataLabelSmall}>Next Perk</Text>
                  </View>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall}>2,400</Text>
                    <Text style={styles.tourDataLabelSmall}>Earnings</Text>
                  </View>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall}>3</Text>
                    <Text style={styles.tourDataLabelSmall}>Perks Won</Text>
                  </View>
                  <View style={styles.tourDataItemSmall}>
                    <Text style={styles.tourDataValueSmall}>19%</Text>
                    <Text style={styles.tourDataLabelSmall}>Progress</Text>
                  </View>
                </View>
                <Image source={require('@/assets/images/affiliate-card-photo.png')} style={styles.tourCardPhoto} resizeMode="cover" />
              </View>
            </TouchableOpacity>
            </View>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Avatar Preview Modal */}
      <Modal
        visible={avatarPreviewVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAvatarPreviewVisible(false)}
      >
        <View style={styles.avatarPreviewOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setAvatarPreviewVisible(false)}
            activeOpacity={1}
          />
          <View style={[styles.avatarPreviewHeader, { paddingTop: insets.top + 8 }]}>
            <GlassBackButton onPress={() => setAvatarPreviewVisible(false)} />
          </View>

          <View style={styles.avatarPreviewContent}>
            <View style={styles.avatarPreviewImageWrap}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarPreviewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPreviewPlaceholder}>
                  <Text style={styles.avatarPreviewInitials}>{initials}</Text>
                </View>
              )}
            </View>

            <View style={styles.avatarStatsCard}>
              {hasSensors && (
                <View style={styles.sensorCheckBadge}>
                  <CheckCircle size={20} color="#5AC8FA" fill="#5AC8FA" />
                </View>
              )}
              <View style={styles.avatarStatsRow}>
                <View style={styles.avatarStatItem}>
                  <Text style={styles.avatarStatNumber}>{drillCount}</Text>
                  <Text style={styles.avatarStatLabel}>Shots</Text>
                </View>
                <View style={styles.avatarStatDivider} />
                <View style={styles.avatarStatItem}>
                  <Text style={styles.avatarStatNumber}>{lastRound ? 1 : 0}</Text>
                  <Text style={styles.avatarStatLabel}>Rounds</Text>
                </View>
                <View style={styles.avatarStatDivider} />
                <View style={styles.avatarStatItem}>
                  <Text style={styles.avatarStatNumber}>{battleResults?.length ?? 0}</Text>
                  <Text style={styles.avatarStatLabel}>Battles</Text>
                </View>
                <View style={styles.avatarStatDivider} />
                <View style={styles.avatarStatItem}>
                  <Text style={styles.avatarStatNumber}>{drillCount}</Text>
                  <Text style={styles.avatarStatLabel}>Drills</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Follows Modal - full screen with gradient */}
      <Modal
        visible={followsModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setFollowsModalVisible(false)}
      >
        <LinearGradient
          colors={['#EBF4FF', '#D6EAFF', '#C2DFFF', '#EBF4FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.followsGradient}
        >
          <View style={[styles.followsHeader, { paddingTop: insets.top + 8 }]}>
            <GlassBackButton onPress={() => setFollowsModalVisible(false)} />
            <Text style={styles.followsHeaderTitle}>Social</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.followsSegmentContainer}>
            <View style={styles.followsSegmentRow}>
              {(['hitta', 'followers', 'following', 'friends'] as const).map((tab, index) => {
                const labels = [
                  'Hitta',
                  `Följare (${followersCount})`,
                  `Följer (${followingCount})`,
                  'Friends',
                ];
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.followsSegmentBtn, { width: followsSegmentWidth }]}
                    onPress={() => handleFollowsTabChange(tab)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.followsSegmentText,
                        followsTab === tab && styles.followsSegmentTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {labels[index]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Animated.View
              style={[
                styles.followsSegmentUnderline,
                {
                  width: followsUnderlineWidth,
                  transform: [{ translateX: followsTranslateX }],
                },
              ]}
            />
          </View>

          <View style={styles.followsSearchBar}>
            <Search size={16} color="rgba(0,0,0,0.35)" />
            <TextInput
              style={styles.followsSearchInput}
              placeholder="Sök användare..."
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={followsSearchQuery}
              onChangeText={setFollowsSearchQuery}
            />
            {followsSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setFollowsSearchQuery('')}>
                <X size={16} color="rgba(0,0,0,0.35)" />
              </TouchableOpacity>
            )}
          </View>

          {followsTab === 'hitta' && isLoadingAllUsers ? (
            <View style={styles.followsEmptyState}>
              <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
            </View>
          ) : (
            <FlatList
              data={getFilteredListData()}
              keyExtractor={(item) => item.id}
              renderItem={renderFollowUser}
              contentContainerStyle={styles.followsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.followsEmptyState}>
                  <Text style={styles.followsEmptyText}>{getEmptyText()}</Text>
                </View>
              }
            />
          )}

          <ProfileCard
            visible={profileCardVisible}
            onClose={() => {
              setProfileCardVisible(false);
              setProfileCardUser(null);
            }}
            _onNavigateAway={() => {
              setFollowsModalVisible(false);
            }}
            user={profileCardUser}
            isFollowingUser={profileCardUser ? isFollowing(profileCardUser.id) : false}
            onToggleFollow={profileCardUser ? () => handleToggleFollow(profileCardUser.id) : undefined}
          />
        </LinearGradient>
      </Modal>

      {/* Last Round Popup */}
      <Modal
        visible={lastRoundPopupVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setLastRoundPopupVisible(false)}
      >
        <LinearGradient
          colors={['#4BA35B', '#3D954D', '#2D803D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.lrGradientContainer}
        >
          <View style={[styles.lrHeader, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity
              onPress={() => setLastRoundPopupVisible(false)}
              style={styles.lrBackBtn}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.lrHeaderTitle}>Last Round</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView style={styles.lrScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.lrScrollContent}>
            {lastRound ? (
              <>
                <View style={styles.lrRoundInfo}>
                  <Text style={styles.lrCourseName}>{lastRound.courseName}</Text>
                  <Text style={styles.lrDate}>{lastRound.roundDate}</Text>
                  {lastRound.duration ? (
                    <Text style={styles.lrDuration}>Duration: {lastRound.duration}</Text>
                  ) : null}
                </View>

                <View style={styles.lrGlassCard}>
                  <View style={styles.lrScoreRow}>
                    <View style={styles.lrScoreBig}>
                      <Text style={styles.lrScoreLabel}>Total Score</Text>
                      <Text style={styles.lrScoreValue}>{lastRound.totalScore}</Text>
                      <Text style={[styles.lrToPar, { color: getToParColor() }]}>{getToParDisplay()}</Text>
                    </View>
                    <View style={styles.lrScoreDetails}>
                      <View style={styles.lrDetailItem}>
                        <Text style={styles.lrDetailValue}>{lastRound.holesPlayed}</Text>
                        <Text style={styles.lrDetailLabel}>Holes</Text>
                      </View>
                      <View style={styles.lrDetailItem}>
                        <Text style={styles.lrDetailValue}>{lastRound.totalPar}</Text>
                        <Text style={styles.lrDetailLabel}>Par</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.lrGlassCard}>
                  <Text style={styles.lrSectionTitle}>Players</Text>
                  {lastRound.players.map((p, i) => (
                    <View key={i} style={styles.lrPlayerRow}>
                      <View style={styles.lrPlayerAvatar}>
                        <User size={16} color="rgba(255,255,255,0.7)" />
                      </View>
                      <Text style={styles.lrPlayerName}>{p}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.lrGlassCard}>
                  <Text style={styles.lrSectionTitle}>Summary</Text>
                  <View style={styles.lrSummaryGrid}>
                    {[
                      { label: 'Score', value: `${lastRound.totalScore}` },
                      { label: 'To Par', value: getToParDisplay() },
                      { label: 'Holes', value: `${lastRound.holesPlayed}` },
                      { label: 'Course Par', value: `${lastRound.totalPar}` },
                    ].map((item, idx) => (
                      <View key={idx} style={styles.lrSummaryItem}>
                        <Text style={styles.lrSummaryValue}>{item.value}</Text>
                        <Text style={styles.lrSummaryLabel}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.lrEmpty}>
                <Text style={styles.lrEmptyText}>No round data available yet</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={[styles.lrFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
            <TouchableOpacity
              style={styles.lrStatsButton}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLastRoundPopupVisible(false);
                navigateTo('data-overview', { initialTab: 'stats', initialStatsSegment: 'round' });
              }}
              activeOpacity={0.8}
              testID="round-stats-button"
            >
              <Text style={styles.lrStatsButtonText}>Round Stats</Text>
              <ArrowRight size={20} color="#3D954D" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>

      {/* Last Practice Popup - Full Screen Blue Gradient */}
      <Modal
        visible={lastPracticePopupVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setLastPracticePopupVisible(false)}
      >
        <LinearGradient
          colors={['#0059B2', '#1075E3', '#1C8CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.lrGradientContainer}
        >
          <View style={[styles.lrHeader, { paddingTop: insets.top + 12 }]}>
            <GlassBackButton onPress={() => setLastPracticePopupVisible(false)} />
            <Text style={styles.lrHeaderTitle}>Last Practice</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView style={styles.lrScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.lrScrollContent}>
            <PracticePopupContent />
          </ScrollView>

          <View style={[styles.lpFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
            <TouchableOpacity
              style={styles.lpStatsButton}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLastPracticePopupVisible(false);
                navigateTo('data-overview', { initialTab: 'stats', initialStatsSegment: 'practice' });
              }}
              activeOpacity={0.8}
              testID="practice-stats-button"
            >
              <Text style={styles.lpStatsButtonText}>Practice Stats</Text>
              <ArrowRight size={20} color="#1075E3" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>

      {/* Live Round Full Screen */}
      <Modal
        visible={liveRoundModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setLiveRoundModalVisible(false);
          selectRound(null);
        }}
      >
        {selectedRound ? (
          <LiveRoundScreen
            round={selectedRound}
            onClose={() => {
              setLiveRoundModalVisible(false);
              selectRound(null);
            }}
          />
        ) : null}
      </Modal>

      {/* Profile Card for viewing other users */}
      <ProfileCard
        visible={profileCardVisible}
        onClose={() => {
          setProfileCardVisible(false);
          setProfileCardUser(null);
        }}
        user={profileCardUser}
        isFollowingUser={profileCardUser ? isFollowing(profileCardUser.id) : false}
        onToggleFollow={profileCardUser ? () => handleToggleFollow(profileCardUser.id) : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerAbsolute: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  bgImageAbsolute: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  bgImageFull: {
    width: '100%' as const,
    height: '100%' as const,
  },
  safeArea: {
    zIndex: 10,
  },
  topEdgeShadow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    zIndex: 20,
  },
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  hamburgerBtn: {
    width: wp(40),
    height: wp(40),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  glassIconCircle: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(21),
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerLogo: {
    height: wp(44),
    width: wp(180),
  },
  headerIcons: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  headerIconBtn: {
    padding: 6,
  },
  headerIconBtnLarge: {
    padding: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  coachEmojiIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentOuter: {
    paddingBottom: 30,
  },
  imageScrollArea: {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    zIndex: 1,
  },
  imageScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  cardSectionHeader: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  profileTopSection: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
    gap: 12,
  },
  avatarAndFriendsColumn: {
    alignItems: 'center' as const,
    gap: 8,
  },
  rightColumn: {
    flex: 1,
    gap: 8,
  },
  avatarTouchable: {
    position: 'relative' as const,
  },
  avatarShadowWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    borderRadius: wp(48),
  },
  avatarClip: {
    width: wp(90),
    height: wp(90),
    borderRadius: wp(45),
    overflow: 'hidden' as const,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    backgroundColor: '#F0F0F0',
  },
  avatar: {
    width: '100%' as const,
    height: '100%' as const,
  },
  avatarPlaceholder: {
    width: '100%' as const,
    height: '100%' as const,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatarInitials: {
    fontSize: fp(28),
    fontWeight: '700' as const,
    color: '#3D954D',
  },
  followPillVertical: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  followStatBtn: {
    alignItems: 'center' as const,
    paddingHorizontal: 10,
  },
  followStatNumber: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  followStatLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 1,
  },
  followHorizontalDivider: {
    width: '80%' as any,
    height: 1,
    backgroundColor: '#D0D0D0',
    marginVertical: 6,
  },
  friendsPillUnder: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignSelf: 'stretch' as const,
  },
  friendsCount: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  friendsLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#888',
  },
  friendsAvatarStack: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginLeft: 4,
  },
  friendsStackAvatar: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  friendsStackInitial: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  actionGrid: {
    gap: 8,
    justifyContent: 'flex-start' as const,
    alignItems: 'flex-end' as const,
  },
  actionGridRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  gridBtn: {
    width: wp(52),
    height: wp(52),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 2,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  gridBtnCompare: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFD0D0',
  },
  compareGradientBtn: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(12),
    overflow: 'hidden' as const,
  },
  compareGradientInner: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 12,
  },
  cameraGradientBtn: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(12),
    overflow: 'hidden' as const,
  },
  cameraGradientInner: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 12,
  },
  gridBtnText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#D4AF37',
  },
  gridBtnLabel: {
    fontSize: 8,
    fontWeight: '600' as const,
    color: '#888',
  },
  handicapGradientBtn: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(12),
    overflow: 'hidden' as const,
  },
  handicapGradientInner: {
    flex: 1,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 2,
    borderRadius: 12,
  },
  handicapBoldText: {
    fontSize: 13,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  handicapSgfIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  helpMenuOverlay: {
    position: 'absolute' as const,
    top: 0,
    right: 20,
    zIndex: 200,
  },
  helpMenuBackdrop: {
    position: 'absolute' as const,
    top: -200,
    left: -400,
    right: -400,
    bottom: -2000,
  },
  helpMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(14),
    padding: wp(6),
    width: wp(200),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  helpMenuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    position: 'relative' as const,
  },
  helpMenuText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  helpMenuDivider: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginHorizontal: 10,
    marginVertical: 4,
  },

  liveDividerArea: {
    height: 50,
    position: 'relative' as const,
    backgroundColor: 'transparent',
    overflow: 'visible' as const,
    zIndex: 2,
    marginTop: -1,
  },
  whiteContentBelow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    marginTop: -1,
  },
  liveDividerCurvedWhite: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  liveDividerCurvedWhiteInner: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  liveSection: {
    marginBottom: 32,
    marginTop: -2,
    paddingTop: 6,
    backgroundColor: '#FFFFFF',
  },
  liveSectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FF3B30',
    letterSpacing: 1,
    marginBottom: 14,
  },
  liveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  liveEmptyState: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCC',
  },
  liveEmptyText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500' as const,
  },
  liveCardsList: {
    gap: 8,
  },
  liveRoundCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  liveRoundCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 10,
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  liveRoundInfo: {
    flex: 1,
  },
  liveRoundFriend: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  liveRoundCourse: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  liveRoundCardRight: {
    alignItems: 'flex-end' as const,
    marginLeft: 10,
  },
  liveRoundHoles: {
    fontSize: 11,
    color: '#888',
  },
  liveRoundToPar: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginTop: 2,
  },

  cardsColumn: {
    gap: 32,
    backgroundColor: '#FFFFFF',
  },
  roundCardOuter: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  roundCardGradient: {
    borderRadius: 16,
    padding: 18,
    minHeight: 120,
  },
  practiceCardOuter: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  practiceCardGradient: {
    borderRadius: 16,
    padding: 18,
    minHeight: 120,
  },
  gradientCardContent: {
    flex: 1,
  },
  gradientCardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    marginBottom: 8,
  },
  gradientCardToParBadge: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  gradientCardInnerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  gradientCardLeft: {
    flex: 1,
  },
  gradientCardCourse: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  gradientCardDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  gradientCardHoles: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  gradientCardScore: {
    fontSize: fp(34),
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  gradientCardEmpty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#666',
  },
  cardHeaderRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  cardToParBadge: {
    fontSize: 15,
    fontWeight: '800' as const,
  },
  cardInnerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  cardLeft: {
    flex: 1,
  },
  cardCourse: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  cardDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  cardScore: {
    fontSize: fp(32),
    fontWeight: '900' as const,
    color: '#3D954D',
  },
  cardHoles: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  cardEmpty: {
    fontSize: 13,
    color: '#AAA',
    marginTop: 12,
  },

  tourCard: {
    backgroundColor: '#EBF4FF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  tourCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  tourCardTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
  },
  tourCardHeaderText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  tourCardHeaderRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  cardLogoImage: {
    width: 80,
    height: 24,
  },
  tourCardTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  tourCardBody: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  tourDataGridCompact: {
    flex: 1,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  tourDataItemSmall: {
    width: '46%' as any,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 5,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tourDataValueSmall: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  tourDataLabelSmall: {
    fontSize: 8,
    color: '#666',
    marginTop: 1,
    textAlign: 'center' as const,
  },
  tourCardPhoto: {
    width: wp(100),
    height: wp(130),
    borderRadius: wp(12),
  },
  tourDataGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  tourDataItem: {
    width: '30%' as any,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tourDataValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  tourDataLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
    textAlign: 'center' as const,
  },

  affiliateCard: {
    backgroundColor: '#EBF4FF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  affiliateCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  affiliateCardTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
  },
  affiliateCardHeaderText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  affiliateCardTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },

  avatarPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center' as const,
    paddingTop: 120,
  },
  avatarPreviewHeader: {
    position: 'absolute' as const,
    top: 0,
    left: 16,
    zIndex: 10,
  },
  avatarPreviewContent: {
    alignItems: 'center' as const,
    zIndex: 5,
  },
  avatarPreviewImageWrap: {
    width: wp(170),
    height: wp(170),
    borderRadius: wp(85),
    overflow: 'hidden' as const,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarPreviewImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  avatarPreviewPlaceholder: {
    width: '100%' as const,
    height: '100%' as const,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatarPreviewInitials: {
    fontSize: fp(46),
    fontWeight: '700' as const,
    color: '#1DB954',
  },
  avatarStatsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(20),
    paddingVertical: wp(20),
    paddingHorizontal: wp(24),
    width: wp(300),
    position: 'relative' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sensorCheckBadge: {
    position: 'absolute' as const,
    top: wp(-8),
    right: wp(-8),
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#5AC8FA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E8F7FF',
  },
  avatarStatsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
  },
  avatarStatItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  avatarStatNumber: {
    fontSize: fp(24),
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  avatarStatLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  avatarStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E8E8E8',
  },

  followsGradient: {
    flex: 1,
  },
  followsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  followsHeaderTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  followsSegmentContainer: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 12,
  },
  followsSegmentRow: {
    flexDirection: 'row' as const,
  },
  followsSegmentBtn: {
    paddingVertical: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 1,
  },
  followsSegmentText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.35)',
  },
  followsSegmentTextActive: {
    color: '#1A1A1A',
    fontWeight: '700' as const,
  },
  followsSegmentUnderline: {
    height: 3,
    backgroundColor: '#1A1A1A',
    borderRadius: 1.5,
  },
  followsSearchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  followsSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    padding: 0,
  },
  followsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  followUserRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
  },
  followUserLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    marginRight: 12,
  },
  followUserAvatar: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
  },
  followUserAvatarPlaceholder: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  followUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  followUserName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  followUserUsername: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.45)',
    marginTop: 1,
  },
  followBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center' as const,
  },
  followBtnFollowing: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  followBtnTextFollowing: {
    color: '#1A1A1A',
  },
  followsEmptyState: {
    paddingVertical: 40,
    alignItems: 'center' as const,
  },
  followsEmptyText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.45)',
  },

  lrGradientContainer: {
    flex: 1,
  },
  lrHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  lrBackBtn: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  lrHeaderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  lrScroll: {
    flex: 1,
  },
  lrScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  lrRoundInfo: {
    marginBottom: 20,
  },
  lrCourseName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  lrDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  lrDuration: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  lrGlassCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lrScoreRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  lrScoreBig: {
    flex: 1,
    alignItems: 'center' as const,
  },
  lrScoreLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  lrScoreValue: {
    fontSize: fp(46),
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginTop: 2,
  },
  lrToPar: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginTop: 2,
  },
  lrScoreDetails: {
    flex: 1,
    gap: 14,
  },
  lrDetailItem: {
    alignItems: 'center' as const,
  },
  lrDetailValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  lrDetailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  lrSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  lrPlayerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  lrPlayerAvatar: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  lrPlayerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  lrSummaryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  lrSummaryItem: {
    width: '47%' as any,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  lrSummaryValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  lrSummaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  lrEmpty: {
    paddingVertical: 60,
    alignItems: 'center' as const,
  },
  lrEmptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  lrFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  lrStatsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
  },
  lrStatsButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#3D954D',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  popupSheet: {
    backgroundColor: 'transparent',
    borderRadius: wp(24),
    width: '100%' as const,
    maxHeight: hp(670),
    overflow: 'hidden' as const,
  },
  popupHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  popupCloseBtn: {
    padding: 4,
    width: 32,
  },
  popupTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#EFEFEF',
  },
  popupStatsBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: '#4FC3F715',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4FC3F730',
  },
  popupStatsBtnText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#4FC3F7',
  },
  popupScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  popupPracticeWrap: {
    paddingBottom: 20,
  },
  coachHeaderIcon: {
    width: 22,
    height: 22,
    tintColor: '#555',
  },
  helpMenuRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    position: 'absolute' as const,
    top: 10,
    right: 10,
  },
  crewSection: {
    marginBottom: 28,
    paddingHorizontal: 0,
    paddingTop: 6,
  },
  crewSectionTitleBlack: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  crewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  crewCardInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    gap: 10,
  },
  crewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCC',
  },
  crewCardText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500' as const,
  },
  crewLogoMini: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  helpIconRedDot: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  lpFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  lpStatsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
  },
  lpStatsButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1075E3',
  },
  qrImageBtn: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(12),
    overflow: 'hidden' as const,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  qrIconImage: {
    width: wp(36),
    height: wp(36),
  },
});
