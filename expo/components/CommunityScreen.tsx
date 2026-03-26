import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Menu,
  Trophy,
  Share2,
  Tv,
  User,

  Calendar,
  MapPin,
  Users,
  Crosshair,
  Info,
  Gift,
  ChevronRight,
  Target,
  ImageIcon,
  Tag,
  Handshake,
  X,
  Mic,
  MessageSquare,
  FileText,
  Film,
  ExternalLink,
} from 'lucide-react-native';
import { Linking, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { useAppNavigation } from '@/contexts/AppNavigationContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useScrollHeader, ScrollHeaderProvider, useScrollHeaderContext, useScrollHeaderPadding } from '@/hooks/useScrollHeader';

type CommunityTab = 'tour' | 'affiliate' | 'entertainment';

interface TabConfig {
  key: CommunityTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { key: 'tour', label: 'Tour', icon: <Trophy size={14} /> },
  { key: 'affiliate', label: 'Affiliate', icon: <Share2 size={14} /> },
  { key: 'entertainment', label: 'Entertainment', icon: <Tv size={14} /> },
];

interface TourEvent {
  id: string;
  eventName: string;
  courseName: string;
  date: string;
  type: 'upcoming' | 'past';
}

const UPCOMING_EVENTS: TourEvent[] = [
  {
    id: 'ue1',
    eventName: 'Spring Championship',
    courseName: 'Bro Hof Slott GC',
    date: 'Apr 12, 2026',
    type: 'upcoming',
  },
  {
    id: 'ue2',
    eventName: 'Midsummer Classic',
    courseName: 'Halmstad GK',
    date: 'Jun 21, 2026',
    type: 'upcoming',
  },
];

const PAST_EVENTS: TourEvent[] = [
  {
    id: 'pe1',
    eventName: 'Winter Invitational',
    courseName: 'Österåker GK',
    date: 'Jan 18, 2026',
    type: 'past',
  },
  {
    id: 'pe2',
    eventName: 'Autumn Open',
    courseName: 'Ullna GK',
    date: 'Oct 5, 2025',
    type: 'past',
  },
];

type EventDetailTab = 'players' | 'impact' | 'info';

function EventDetailScreen({
  event,
  onClose,
}: {
  event: TourEvent;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<EventDetailTab>('players');

  const statusLabel = event.type === 'upcoming' ? 'Upcoming' : 'Past';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'players':
        return (
          <ScrollView style={edStyles.tabScroll} showsVerticalScrollIndicator={false}>
            <Text style={edStyles.sectionHeader}>Registered Players</Text>
            {['Erik Svensson', 'Anna Lindberg', 'Oscar Nilsson', 'Maja Johansson', 'Karl Eriksson'].map(
              (name, i) => (
                <View key={i} style={edStyles.playerRow}>
                  <View style={edStyles.playerAvatar}>
                    <User size={16} color="#888888" />
                  </View>
                  <View style={edStyles.playerInfo}>
                    <Text style={edStyles.playerName}>{name}</Text>
                    <Text style={edStyles.playerHcp}>HCP {(Math.random() * 20 + 2).toFixed(1)}</Text>
                  </View>
                  <Text style={edStyles.playerRank}>#{i + 1}</Text>
                </View>
              )
            )}
          </ScrollView>
        );
      case 'impact':
        return (
          <ScrollView style={edStyles.tabScroll} showsVerticalScrollIndicator={false}>
            <Text style={edStyles.sectionHeader}>Impact Tracer</Text>
            <View style={edStyles.impactPlaceholder}>
              <Crosshair size={40} color="#1A1A1A" />
              <Text style={edStyles.impactText}>
                Impact data will be available {event.type === 'upcoming' ? 'during' : 'from'} the event
              </Text>
            </View>
          </ScrollView>
        );
      case 'info':
        return (
          <ScrollView style={edStyles.tabScroll} showsVerticalScrollIndicator={false}>
            <Text style={edStyles.sectionHeader}>Event Information</Text>
            <View style={edStyles.infoCard}>
              <View style={edStyles.infoRow}>
                <Calendar size={16} color="#FFB74D" />
                <Text style={edStyles.infoLabel}>Date</Text>
                <Text style={edStyles.infoValue}>{event.date}</Text>
              </View>
              <View style={edStyles.infoRow}>
                <MapPin size={16} color="#FFB74D" />
                <Text style={edStyles.infoLabel}>Course</Text>
                <Text style={edStyles.infoValue}>{event.courseName}</Text>
              </View>
              <View style={edStyles.infoRow}>
                <Users size={16} color="#FFB74D" />
                <Text style={edStyles.infoLabel}>Format</Text>
                <Text style={edStyles.infoValue}>Strokeplay, 18 holes</Text>
              </View>
              <View style={edStyles.infoRow}>
                <Trophy size={16} color="#FFB74D" />
                <Text style={edStyles.infoLabel}>Prize Pool</Text>
                <Text style={edStyles.infoValue}>5,000 SEK</Text>
              </View>
            </View>
            <Text style={[edStyles.sectionHeader, { marginTop: 20 }]}>Rules</Text>
            <View style={edStyles.infoCard}>
              <Text style={edStyles.rulesText}>
                Standard R&A rules apply. Local rules will be posted at registration. Pace of play: max 4h15m for 18 holes.
              </Text>
            </View>
          </ScrollView>
        );
    }
  };

  const eventTabs: { key: EventDetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'players', label: 'Players', icon: <Users size={18} /> },
    { key: 'impact', label: 'Impact Tracer', icon: <Crosshair size={18} /> },
    { key: 'info', label: 'Info', icon: <Info size={18} /> },
  ];

  return (
    <View style={edStyles.container}>
      <SafeAreaView edges={['top']} style={edStyles.safeTop}>
        <View style={edStyles.header}>
          <GlassBackButton onPress={onClose} />
          <View style={edStyles.headerCenter}>
            <Text style={edStyles.headerTitle} numberOfLines={1}>{event.eventName}</Text>
            <Text style={edStyles.headerSub} numberOfLines={1}>{event.courseName} · {event.date}</Text>
          </View>
          <Text style={edStyles.statusBadge}>{statusLabel}</Text>
        </View>
      </SafeAreaView>

      <View style={edStyles.body}>{renderTabContent()}</View>

      <SafeAreaView edges={['bottom']} style={edStyles.tabBarSafe}>
        <View style={edStyles.tabBar}>
          {eventTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={edStyles.tab}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.key);
                }}
                activeOpacity={0.7}
              >
                <View style={isActive ? edStyles.iconActive : edStyles.iconInactive}>
                  {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                    color: isActive ? '#1A1A1A' : '#8A8A8A',
                  })}
                </View>
                <Text style={[edStyles.tabLabel, isActive && edStyles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const edStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeTop: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  headerSub: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#888888',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  body: {
    flex: 1,
  },
  tabScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 14,
  },
  playerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 12,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8E8E8',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  playerHcp: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  playerRank: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFB74D',
  },
  impactPlaceholder: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 12,
  },
  impactText: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center' as const,
  },
  infoCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888888',
    width: 70,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  rulesText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
  },
  tabBarSafe: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  tabBar: {
    flexDirection: 'row' as const,
    paddingTop: 3,
    paddingBottom: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 2,
  },
  iconActive: {},
  iconInactive: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 9,
    marginTop: 0,
    color: '#8A8A8A',
    fontWeight: '600' as const,
  },
  tabLabelActive: {
    color: '#1A1A1A',
  },
});

function EventCard({
  event,
  onPress,
  variant,
}: {
  event: TourEvent;
  onPress: () => void;
  variant: 'upcoming' | 'past';
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={tourStyles.eventCardOuter}>
      <LinearGradient
        colors={['#0059B2', '#1075E3', '#1C8CFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={tourStyles.eventCard}
      >
        <View style={tourStyles.eventCardLeft}>
          {variant === 'upcoming' ? (
            <Text style={tourStyles.eventNameUpcoming}>{event.eventName}</Text>
          ) : (
            <Text style={tourStyles.eventNamePast}>{event.eventName}</Text>
          )}
          <View style={tourStyles.eventMeta}>
            <MapPin size={12} color="#FFFFFF" />
            <Text style={tourStyles.eventCourse}>{event.courseName}</Text>
          </View>
          <View style={tourStyles.eventMeta}>
            <Calendar size={12} color="#FFFFFF" />
            <Text style={tourStyles.eventDate}>{event.date}</Text>
          </View>
        </View>
        <ChevronRight size={18} color="#FFFFFF" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

type LeaderboardPrizesTab = 'leaderboard' | 'prizes';

function LeaderboardPrizesScreen({
  onClose,
  initialTab,
}: {
  onClose: () => void;
  initialTab: LeaderboardPrizesTab;
}) {
  const [activeTab, setActiveTab] = useState<LeaderboardPrizesTab>(initialTab);
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#FF1C1C', '#E31010', '#B20000', '#800000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={lbStyles.container}
    >
      <View style={[lbStyles.header, { paddingTop: insets.top + 8 }]}> 
        <GlassBackButton onPress={onClose} />
        <View style={lbStyles.segmentRow}>
          <TouchableOpacity
            style={lbStyles.segmentTab}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('leaderboard');
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              lbStyles.segmentText,
              activeTab === 'leaderboard' && lbStyles.segmentTextActive,
            ]}>Leaderboard</Text>
            {activeTab === 'leaderboard' && <View style={lbStyles.segmentUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={lbStyles.segmentTab}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('prizes');
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              lbStyles.segmentText,
              activeTab === 'prizes' && lbStyles.segmentTextActive,
            ]}>Prizes & Benefits</Text>
            {activeTab === 'prizes' && <View style={lbStyles.segmentUnderline} />}
          </TouchableOpacity>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={lbStyles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {activeTab === 'leaderboard' ? (
          <>
            <Text style={lbStyles.sectionHeader}>Rankings</Text>
            {['Erik Svensson', 'Anna Lindberg', 'Oscar Nilsson', 'Maja Johansson', 'Karl Eriksson', 'Sofia Holm', 'Lars Pettersson'].map(
              (name, i) => (
                <View key={i} style={lbStyles.playerRow}>
                  <Text style={lbStyles.playerRank}>#{i + 1}</Text>
                  <View style={lbStyles.playerAvatar}>
                    <User size={16} color="#FFFFFF" />
                  </View>
                  <View style={lbStyles.playerInfo}>
                    <Text style={lbStyles.playerName}>{name}</Text>
                    <Text style={lbStyles.playerHcp}>HCP {(Math.random() * 20 + 2).toFixed(1)}</Text>
                  </View>
                  <Text style={lbStyles.playerPoints}>{Math.floor(Math.random() * 500 + 100)} pts</Text>
                </View>
              )
            )}
          </>
        ) : (
          <>
            <Text style={lbStyles.sectionHeader}>Prizes</Text>
            {[
              { title: 'Season Champion', desc: 'Custom trophy + 10,000 SEK' },
              { title: 'Runner Up', desc: '5,000 SEK gift card' },
              { title: 'Most Improved', desc: 'Full club fitting session' },
            ].map((prize, i) => (
              <View key={i} style={lbStyles.prizeCard}>
                <Text style={lbStyles.prizeTitle}>{prize.title}</Text>
                <Text style={lbStyles.prizeDesc}>{prize.desc}</Text>
              </View>
            ))}
            <Text style={[lbStyles.sectionHeader, { marginTop: 24 }]}>Benefits</Text>
            {[
              { title: 'Priority Tee Times', desc: 'Book before non-members' },
              { title: 'Pro Shop Discount', desc: '15% off all equipment' },
              { title: 'Free Range Balls', desc: 'Unlimited practice sessions' },
            ].map((benefit, i) => (
              <View key={i} style={lbStyles.prizeCard}>
                <Text style={lbStyles.prizeTitle}>{benefit.title}</Text>
                <Text style={lbStyles.prizeDesc}>{benefit.desc}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const lbStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  segmentRow: {
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 24,
  },
  segmentTab: {
    alignItems: 'center' as const,
    paddingBottom: 6,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  segmentUnderline: {
    height: 3,
    backgroundColor: '#FF1C1C',
    borderRadius: 1.5,
    width: '100%',
    marginTop: 4,
  },
  body: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 14,
  },
  playerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  playerRank: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFD700',
    width: 30,
    textAlign: 'center' as const,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  playerHcp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  playerPoints: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  prizeCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  prizeTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  prizeDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
});

function GolfersTourScreen({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#FF1C1C', '#E31010', '#B20000', '#800000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={gtStyles.container}
    >
      <View style={[gtStyles.header, { paddingTop: insets.top + 8 }]}>
        <GlassBackButton onPress={onClose} />
        <Text style={gtStyles.headerTitle}>Golfer's Tour</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView style={gtStyles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={gtStyles.infoCard}>
          <Text style={gtStyles.infoTitle}>Welcome to the Tour</Text>
          <Text style={gtStyles.infoText}>
            Compete against golfers in your area. Play events, climb the leaderboard, and win exclusive prizes.
          </Text>
        </View>
        <View style={gtStyles.infoCard}>
          <Text style={gtStyles.infoTitle}>How it Works</Text>
          <Text style={gtStyles.infoText}>
            1. Register for upcoming events{"\n"}
            2. Play your round and submit your score{"\n"}
            3. Earn points based on your performance{"\n"}
            4. Climb the season leaderboard
          </Text>
        </View>
        <View style={gtStyles.infoCard}>
          <Text style={gtStyles.infoTitle}>Season 2026</Text>
          <Text style={gtStyles.infoText}>
            The current season runs from January to December 2026. Top performers qualify for the Season Finals.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const gtStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
});

function TourContent({ onOpenEvent, onOpenTourScreen, onOpenLeaderboard }: { onOpenEvent: (event: TourEvent) => void; onOpenTourScreen: () => void; onOpenLeaderboard: (tab: LeaderboardPrizesTab) => void }) {
  const scrollHandler = useScrollHeaderContext();
  const scrollPadding = useScrollHeaderPadding();
  const { profile } = useProfile();

  const handleEventPress = useCallback((event: TourEvent) => {
    console.log('[Tour] Opening event:', event.eventName);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenEvent(event);
  }, [onOpenEvent]);

  const initials = (profile?.display_name || profile?.username || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView style={styles.tabContentNoPad} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30, paddingTop: scrollPadding, paddingHorizontal: 16 }} onScroll={scrollHandler} scrollEventThrottle={16}>
      <View style={tourStyles.profileSection}>
        <View style={tourStyles.profileLeft}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={tourStyles.profileAvatar} />
          ) : (
            <View style={tourStyles.profileAvatarPlaceholder}>
              <Text style={tourStyles.profileInitials}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={tourStyles.profileRight}>
          <View style={tourStyles.profileDataRow}>
            <LinearGradient colors={['#4BA35B', '#3D954D', '#2D803D']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue}>3</Text>
              <Text style={tourStyles.profileDataLabel}>Events Played</Text>
            </LinearGradient>
            <LinearGradient colors={['#4BA35B', '#3D954D', '#2D803D']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue}>T5</Text>
              <Text style={tourStyles.profileDataLabel}>Placements</Text>
            </LinearGradient>
            <LinearGradient colors={['#4BA35B', '#3D954D', '#2D803D']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue}>1.2k</Text>
              <Text style={tourStyles.profileDataLabel}>Earnings</Text>
            </LinearGradient>
          </View>
          <View style={tourStyles.profileDataRow}>
            <LinearGradient colors={['#4BA35B', '#3D954D', '#2D803D']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue}>#42</Text>
              <Text style={tourStyles.profileDataLabel}>Rank</Text>
            </LinearGradient>
            <LinearGradient colors={['#4BA35B', '#3D954D', '#2D803D']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue} numberOfLines={1}>Bro Hof</Text>
              <Text style={tourStyles.profileDataLabel}>Home Course</Text>
            </LinearGradient>
            <LinearGradient colors={['#4BA35B', '#3D954D', '#2D803D']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={tourStyles.profileDataItem}>
              <Text style={tourStyles.profileDataValue}>27</Text>
              <Text style={tourStyles.profileDataLabel}>Age</Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          console.log('[Tour] JOIN Tour pressed');
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onOpenTourScreen();
        }}
        style={tourStyles.joinButtonOuter}
      >
        <LinearGradient
          colors={['#FF1C1C', '#E31010', '#B20000', '#800000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={tourStyles.joinButton}
        >
          <Text style={tourStyles.joinButtonText}>JOIN Tour</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={tourStyles.divider} />

      <Text style={tourStyles.sectionTitle}>Tour Stats</Text>
      <View style={tourStyles.statsBoxRow}>
        <TouchableOpacity style={tourStyles.statsBox} activeOpacity={0.7} onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onOpenLeaderboard('leaderboard');
        }}>
          <Text style={tourStyles.statsBoxTitle}>Leaderboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tourStyles.statsBox} activeOpacity={0.7} onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onOpenLeaderboard('prizes');
        }}>
          <Text style={tourStyles.statsBoxTitle}>Prizes & Benefits</Text>
        </TouchableOpacity>
      </View>

      <MaskedView
        style={{ height: 24, marginTop: 24, marginBottom: 12 }}
        maskElement={
          <Text style={[tourStyles.sectionTitle, { marginBottom: 0, backgroundColor: 'transparent' }]}>Upcoming Events</Text>
        }
      >
        <LinearGradient
          colors={['#FF1C1C', '#E31010', '#B20000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </MaskedView>
      {UPCOMING_EVENTS.map((event) => (
        <EventCard key={event.id} event={event} onPress={() => handleEventPress(event)} variant="upcoming" />
      ))}

      <Text style={[tourStyles.sectionTitle, { marginTop: 24 }]}>Past Events</Text>
      {PAST_EVENTS.map((event) => (
        <EventCard key={event.id} event={event} onPress={() => handleEventPress(event)} variant="past" />
      ))}
    </ScrollView>
  );
}

const tourStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row' as const,
    gap: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  profileLeft: {
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  profileAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8E8E8',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  profileInitials: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  profileRight: {
    flex: 1,
    gap: 8,
  },
  profileDataRow: {
    flexDirection: 'row' as const,
    gap: 6,
  },
  profileDataItem: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center' as const,
  },
  profileDataValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  profileDataLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center' as const,
  },
  joinButtonOuter: {
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden' as const,
    shadowColor: '#FF1C1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  joinButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  statsBoxRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  statsBox: {
    flex: 1,
    backgroundColor: '#EBF4FF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  statsBoxTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    textAlign: 'center' as const,
  },
  eventCardOuter: {
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  eventCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 12,
    padding: 14,
  },
  eventCardLeft: {
    flex: 1,
    gap: 4,
  },
  eventNameUpcoming: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#E31010',
  },
  eventNamePast: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  eventMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  eventCourse: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  eventDate: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});

type GoalOption = 25 | 50 | 75 | 100;

const PERKS_MAP: Record<GoalOption, string> = {
  25: '3 Free Sensors',
  50: 'Titleist Bag',
  75: 'Free Set of Clubs',
  100: '5 Rounds at Bro Hof',
};

interface AffiliateCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: { id: string; title: string }[];
}

const AFFILIATE_CATEGORIES: AffiliateCategory[] = [
  {
    key: 'giveaways',
    label: 'Giveaways',
    icon: <Gift size={18} color="#FFB74D" />,
    items: [{ id: 'g1', title: 'Monthly Giveaway Draw' }],
  },
  {
    key: 'brand_image',
    label: 'Brand Image',
    icon: <ImageIcon size={18} color="#64B5F6" />,
    items: [{ id: 'bi1', title: 'Ambassador Kit' }],
  },
  {
    key: 'challenges',
    label: 'Challenges',
    icon: <Target size={18} color="#EF5350" />,
    items: [{ id: 'c1', title: 'Referral Sprint' }],
  },
  {
    key: 'special_offers',
    label: 'Special Offers',
    icon: <Tag size={18} color="#AB47BC" />,
    items: [{ id: 'so1', title: 'Pro Membership Deal' }],
  },
  {
    key: 'partnership_deals',
    label: 'Partnership Deals',
    icon: <Handshake size={18} color="#26A69A" />,
    items: [{ id: 'pd1', title: 'TrackMan Collab' }],
  },
];

interface AffiliateItemDetail {
  itemTitle: string;
  categoryLabel: string;
}

function AffiliateItemScreen({ item, onClose }: { item: AffiliateItemDetail; onClose: () => void }) {
  return (
    <View style={affStyles.detailContainer}>
      <SafeAreaView edges={['top']} style={affStyles.detailSafeTop}>
        <View style={affStyles.detailHeader}>
          <GlassBackButton onPress={onClose} />
          <View style={affStyles.detailHeaderCenter}>
            <Text style={affStyles.detailHeaderTitle} numberOfLines={1}>{item.itemTitle}</Text>
            <Text style={affStyles.detailHeaderSub}>{item.categoryLabel}</Text>
          </View>
        </View>
      </SafeAreaView>
      <View style={affStyles.detailBody} />
    </View>
  );
}

function GoalPickerModal({
  visible,
  onClose,
  onSelect,
  current,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (v: GoalOption) => void;
  current: GoalOption;
}) {
  const options: GoalOption[] = [25, 50, 75, 100];
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={affStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={affStyles.modalCard}>
          <View style={affStyles.modalHeader}>
            <Text style={affStyles.modalTitle}>Choose Goal</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#999999" />
            </TouchableOpacity>
          </View>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                affStyles.modalOption,
                current === opt && affStyles.modalOptionActive,
              ]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                affStyles.modalOptionNum,
                current === opt && affStyles.modalOptionNumActive,
              ]}>{opt}</Text>
              <Text style={affStyles.modalOptionPerk}>{PERKS_MAP[opt]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function AffiliateContent() {
  const scrollHandler = useScrollHeaderContext();
  const scrollPadding = useScrollHeaderPadding();
  const [goal, setGoal] = useState<GoalOption>(100);
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);

  const [selectedItem, setSelectedItem] = useState<AffiliateItemDetail | null>(null);
  const currentCount = 19;
  const discountCode = 'GOLF2026PRO';

  const handleOpenPicker = useCallback((source: 'count' | 'perks') => {
    console.log('[Affiliate] Opening picker from:', source);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerVisible(true);
  }, []);

  const handleShare = useCallback(async () => {
    console.log('[Affiliate] Sharing discount code:', discountCode);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({ message: `Use my discount code: ${discountCode}` });
    } catch (e) {
      console.log('[Affiliate] Share error:', e);
    }
  }, [discountCode]);

  const handleItemPress = useCallback((itemTitle: string, categoryLabel: string) => {
    console.log('[Affiliate] Item pressed:', itemTitle, 'category:', categoryLabel);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem({ itemTitle, categoryLabel });
  }, []);

  if (selectedItem) {
    return (
      <AffiliateItemScreen
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    );
  }

  return (
    <>
      <ScrollView
        style={styles.tabContentNoPad}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: scrollPadding, paddingHorizontal: 16 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={affStyles.topBoxRow}>
          <TouchableOpacity
            style={affStyles.countBox}
            activeOpacity={0.7}
            onPress={() => handleOpenPicker('count')}
          >
            <Text style={affStyles.goalLabel}>{goal}</Text>
            <View style={affStyles.countCenter}>
              <Text style={affStyles.countBig}>{currentCount}</Text>
              <Text style={affStyles.countOf}>out of {goal}</Text>
            </View>
            <View style={affStyles.progressBarBg}>
              <LinearGradient
                colors={['#4BA35B', '#3D954D', '#2D803D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  affStyles.progressBarFill,
                  { width: `${Math.min((currentCount / goal) * 100, 100)}%` },
                ]}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={affStyles.perksBox}
            activeOpacity={0.7}
            onPress={() => handleOpenPicker('perks')}
          >
            <Text style={affStyles.goalLabel}>{goal}</Text>
            <Text style={affStyles.perksHeader}>Perks and Prizes</Text>
            <Text style={affStyles.perksValue}>{PERKS_MAP[goal]}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={affStyles.discountButton}
          activeOpacity={0.7}
          onPress={handleShare}
        >
          <View>
            <Text style={affStyles.discountLabel}>Discount Code</Text>
            <MaskedView
              style={{ height: 18 }}
              maskElement={<Text style={[affStyles.discountCode, { backgroundColor: 'transparent' }]}>{discountCode}</Text>}
            >
              <LinearGradient colors={['#FF1C1C', '#E31010', '#B20000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
            </MaskedView>
          </View>
        </TouchableOpacity>

        {AFFILIATE_CATEGORIES.map((cat) => (
          <View key={cat.key} style={affStyles.categorySection}>
            <Text style={affStyles.categoryTitle}>{cat.label}</Text>
            {cat.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => handleItemPress(item.title, cat.label)}
                style={affStyles.categoryCardOuter}
              >
                <LinearGradient
                  colors={['#4BA35B', '#3D954D', '#2D803D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={affStyles.categoryCard}
                >
                  <Text style={affStyles.categoryCardTitle}>{item.title}</Text>
                  <ChevronRight size={16} color="#1A1A1A" />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      <GoalPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={setGoal}
        current={goal}
      />
    </>
  );
}

const affStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  topBoxRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 20,
  },
  countBox: {
    flex: 1,
    backgroundColor: 'rgba(30,30,30,0.75)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  countCenter: {
    alignItems: 'center' as const,
  },
  countBig: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  countOf: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600' as const,
  },
  progressBarBg: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 4,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: 5,
    borderRadius: 3,
  },
  perksBox: {
    flex: 1,
    backgroundColor: 'rgba(30,30,30,0.75)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  goalLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end' as const,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden' as const,
  },
  perksHeader: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  perksValue: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
  },
  discountButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#E31010',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  discountLabel: {
    fontSize: 10,
    color: '#E31010',
    fontWeight: '600' as const,
  },
  discountCode: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#E31010',
    letterSpacing: 1,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  categoryCardOuter: {
    borderRadius: 12,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  categoryCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderRadius: 12,
    padding: 16,
  },
  categoryCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 30,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  modalOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 14,
  },
  modalOptionActive: {
    borderColor: '#1A1A1A',
    backgroundColor: '#E8F0FF',
  },
  modalOptionNum: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#AAAAAA',
    width: 40,
    textAlign: 'center' as const,
  },
  modalOptionNumActive: {
    color: '#1A1A1A',
  },
  modalOptionPerk: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  detailSafeTop: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  detailHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  detailBack: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  detailHeaderCenter: {
    flex: 1,
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  detailHeaderSub: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  detailBody: {
    flex: 1,
  },
});

type EntertainmentSection = 'Podcasts' | 'Interviews' | 'Articles' | 'Series';

const ENTERTAINMENT_SECTIONS: { key: EntertainmentSection; icon: React.ReactNode }[] = [
  { key: 'Podcasts', icon: <Mic size={20} color="#FFB74D" /> },
  { key: 'Interviews', icon: <MessageSquare size={20} color="#64B5F6" /> },
  { key: 'Articles', icon: <FileText size={20} color="#90A4AE" /> },
  { key: 'Series', icon: <Film size={20} color="#E040FB" /> },
];

const SOCIAL_LINKS = [
  {
    key: 'instagram',
    label: 'Instagram',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png',
    url: 'https://instagram.com',
    nativeUrl: 'instagram://',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/800px-TikTok_logo.svg.png',
    url: 'https://tiktok.com',
    nativeUrl: 'snssdk1233://',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
    url: 'https://youtube.com',
    nativeUrl: 'youtube://',
  },
];

function EntertainmentDetailScreen({ section, onClose }: { section: EntertainmentSection; onClose: () => void }) {
  return (
    <View style={entStyles.detailContainer}>
      <SafeAreaView edges={['top']} style={entStyles.detailSafeTop}>
        <View style={entStyles.detailHeader}>
          <GlassBackButton onPress={onClose} />
          <Text style={entStyles.detailHeaderTitle}>{section}</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>
      <View style={entStyles.detailBody} />
    </View>
  );
}

function EntertainmentContent() {
  const scrollHandler = useScrollHeaderContext();
  const scrollPadding = useScrollHeaderPadding();
  const [openSection, setOpenSection] = useState<EntertainmentSection | null>(null);

  const handleSocialPress = useCallback(async (nativeUrl: string, webUrl: string) => {
    console.log('[Entertainment] Opening social:', webUrl);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Platform.OS !== 'web') {
        const supported = await Linking.canOpenURL(nativeUrl);
        if (supported) {
          await Linking.openURL(nativeUrl);
          return;
        }
      }
      await Linking.openURL(webUrl);
    } catch (e) {
      console.log('[Entertainment] Failed to open link:', e);
      await Linking.openURL(webUrl);
    }
  }, []);

  const handleSectionPress = useCallback((section: EntertainmentSection) => {
    console.log('[Entertainment] Opening section:', section);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpenSection(section);
  }, []);

  if (openSection) {
    return <EntertainmentDetailScreen section={openSection} onClose={() => setOpenSection(null)} />;
  }

  return (
    <ScrollView style={styles.tabContentNoPad} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30, paddingTop: scrollPadding, paddingHorizontal: 16 }} onScroll={scrollHandler} scrollEventThrottle={16}>
      <Text style={entStyles.pageTitle}>Entertainment</Text>

      <Text style={entStyles.sectionLabel}>Social Media</Text>
      <View style={entStyles.socialRow}>
        {SOCIAL_LINKS.map((social) => (
          <TouchableOpacity
            key={social.key}
            style={entStyles.socialBox}
            activeOpacity={0.7}
            onPress={() => handleSocialPress(social.nativeUrl, social.url)}
          >
            <Image source={{ uri: social.logo }} style={entStyles.socialLogo} resizeMode="contain" />
            <Text style={entStyles.socialLabel}>{social.label}</Text>
            <ExternalLink size={12} color="#999999" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={entStyles.divider} />

      <Text style={entStyles.sectionLabel}>Latest</Text>
      <View style={entStyles.latestPlaceholder}>
        <Text style={entStyles.latestPlaceholderText}>Content coming soon</Text>
      </View>

      <View style={entStyles.divider} />

      {ENTERTAINMENT_SECTIONS.map((section) => (
        <TouchableOpacity
          key={section.key}
          style={entStyles.sectionCard}
          activeOpacity={0.7}
          onPress={() => handleSectionPress(section.key)}
        >
          <View style={entStyles.sectionCardLeft}>
            {section.icon}
            <Text style={entStyles.sectionCardTitle}>{section.key}</Text>
          </View>
          <ChevronRight size={18} color="#999999" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const entStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 4,
  },
  socialBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 8,
  },
  socialLogo: {
    width: 36,
    height: 36,
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 20,
  },
  latestPlaceholder: {
    minHeight: 80,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  latestPlaceholderText: {
    fontSize: 13,
    color: '#AAAAAA',
    fontStyle: 'italic' as const,
  },
  sectionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  sectionCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  detailSafeTop: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  detailHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  detailBack: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  detailHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    textAlign: 'center' as const,
  },
  detailBody: {
    flex: 1,
  },
});

const HEADER_BAR_HEIGHT = 52;

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<CommunityTab>('tour');
  const [selectedEvent, setSelectedEvent] = useState<TourEvent | null>(null);
  const [showTourScreen, setShowTourScreen] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<LeaderboardPrizesTab | null>(null);
  const { openSidebar, navigateTo, communityInitialTab, clearCommunityInitialTab } = useAppNavigation();
  const insets = useSafeAreaInsets();

  const { headerTranslateY, onScroll: onHeaderScroll } = useScrollHeader(52);
  const contentPaddingTop = insets.top + HEADER_BAR_HEIGHT;
  const scrollHeaderValue = useMemo(() => ({ onScroll: onHeaderScroll, contentPaddingTop }), [onHeaderScroll, contentPaddingTop]);

  useEffect(() => {
    if (communityInitialTab && (communityInitialTab === 'tour' || communityInitialTab === 'affiliate' || communityInitialTab === 'entertainment')) {
      console.log('[Community] Setting initial tab from nav context:', communityInitialTab);
      setActiveTab(communityInitialTab as CommunityTab);
      clearCommunityInitialTab();
    }
  }, [communityInitialTab, clearCommunityInitialTab]);

  if (showTourScreen) {
    return <GolfersTourScreen onClose={() => setShowTourScreen(false)} />;
  }

  if (showLeaderboard) {
    return <LeaderboardPrizesScreen onClose={() => setShowLeaderboard(null)} initialTab={showLeaderboard} />;
  }

  if (selectedEvent) {
    return (
      <EventDetailScreen
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'tour':
        return <TourContent onOpenEvent={setSelectedEvent} onOpenTourScreen={() => setShowTourScreen(true)} onOpenLeaderboard={(tab) => setShowLeaderboard(tab)} />;
      case 'affiliate':
        return <AffiliateContent />;
      case 'entertainment':
        return <EntertainmentContent />;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerAbsolute, { transform: [{ translateY: headerTranslateY }] }]}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.header}>
            <TouchableOpacity onPress={openSidebar} style={styles.menuBtn} activeOpacity={0.7}>
              <Menu size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{activeTab === 'tour' ? "Golfer's Tour" : (tabs.find(t => t.key === activeTab)?.label ?? 'Community')}</Text>
            <TouchableOpacity onPress={() => navigateTo('mygame')} style={styles.menuBtn} activeOpacity={0.7}>
              <Image source={require('@/assets/images/golferscrib-logo.png')} style={styles.logoIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <View style={styles.body}>
        <ScrollHeaderProvider value={scrollHeaderValue}>
          {renderContent()}
        </ScrollHeaderProvider>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <View style={isActive ? styles.iconActive : styles.iconInactive}>
                  {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                    color: isActive ? '#1A1A1A' : '#8A8A8A',
                  })}
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerAbsolute: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  safeTop: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  logoIcon: {
    width: 32,
    height: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  body: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabContentNoPad: {
    flex: 1,
  },
  placeholderCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 20,
    gap: 10,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  placeholderSub: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 12,
  },
  listDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB74D',
  },
  listLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  listArrow: {
    fontSize: 20,
    color: '#999999',
    fontWeight: '600' as const,
  },
  tabBarSafe: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  tabBar: {
    flexDirection: 'row' as const,
    paddingTop: 3,
    paddingBottom: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 2,
  },
  iconActive: {},
  iconInactive: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 9,
    marginTop: 0,
    color: '#8A8A8A',
    fontWeight: '600' as const,
  },
  tabLabelActive: {
    color: '#1A1A1A',
  },
});
