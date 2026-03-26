import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, Settings, Plus, ChevronLeft, Crown, Shield, Users, Clock, MapPin, Trophy, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppNavigation } from '@/contexts/AppNavigationContext';
import { useProfile } from '@/contexts/ProfileContext';
import CrewManagementScreen from '@/components/CrewManagementScreen';
import CrewCreateScreen from '@/components/CrewCreateScreen';
import CrewScheduleScreen from '@/components/CrewScheduleScreen';
import { getScreenWidth } from '@/utils/responsive';

const SCREEN_WIDTH = getScreenWidth();

const TAB_KEYS = ['crew', 'latest', 'stats'] as const;
type CrewTab = typeof TAB_KEYS[number];

interface ScheduleItem {
  id: string;
  type: 'drill' | 'round' | 'tournament';
  name: string;
  date: string;
  time: string;
  courseName?: string;
  info?: string;
}

function parseScheduleDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours || 0, minutes || 0);
}

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${day}`;
}

function getTypeLabel(type: string): string {
  if (type === 'drill') return 'Drill';
  if (type === 'round') return 'Round';
  return 'Tournament';
}

function getTypeColor(type: string): string {
  if (type === 'drill') return '#FF9500';
  if (type === 'round') return '#007AFF';
  return '#AF52DE';
}

export default function CrewScreen() {
  const { navigateTo } = useAppNavigation();
  const {
    crewName, crewColor, crewLogo, crewPlayers, crewManagers,
    allUsers, profile,
    crewScheduled, crewScheduledRounds, crewScheduledTournaments,
    crewRole,
  } = useProfile();
  const displayName = crewName || 'Crew';
  const bgColor = crewColor || '#FFFFFF';
  const isDark = bgColor !== '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const subtextColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';

  const [activeTab, setActiveTab] = useState<CrewTab>('crew');
  const [createVisible, setCreateVisible] = useState<boolean>(false);
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [scheduleVisible, setScheduleVisible] = useState<boolean>(false);
  const [pastDetailItem, setPastDetailItem] = useState<ScheduleItem | null>(null);
  const underlineAnim = useRef(new Animated.Value(0)).current;

  const tabWidth = (SCREEN_WIDTH - 40) / 3;
  const underlineWidth = 50;

  const underlineTranslateX = underlineAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      (tabWidth - underlineWidth) / 2,
      tabWidth + (tabWidth - underlineWidth) / 2,
      2 * tabWidth + (tabWidth - underlineWidth) / 2,
    ],
  });

  const handleTabChange = useCallback((tab: CrewTab) => {
    setActiveTab(tab);
    const idx = TAB_KEYS.indexOf(tab);
    Animated.spring(underlineAnim, {
      toValue: idx,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [underlineAnim]);

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigateTo('mygame');
  }, [navigateTo]);

  const leaderUser = profile;
  const playerUsers = useMemo(() => {
    return allUsers.filter((u) => crewPlayers.includes(u.id));
  }, [allUsers, crewPlayers]);
  const managerUsers = useMemo(() => {
    return allUsers.filter((u) => crewManagers.includes(u.id));
  }, [allUsers, crewManagers]);

  const totalMembers = 1 + playerUsers.length + managerUsers.length;

  const allScheduleItems = useMemo<ScheduleItem[]>(() => {
    const items: ScheduleItem[] = [];
    (crewScheduled ?? []).forEach((s) => {
      items.push({ id: s.id, type: 'drill', name: s.drillName, date: s.date, time: s.time });
    });
    (crewScheduledRounds ?? []).forEach((s) => {
      items.push({ id: s.id, type: 'round', name: s.roundName, date: s.date, time: s.time, courseName: s.courseName, info: s.info });
    });
    (crewScheduledTournaments ?? []).forEach((s) => {
      items.push({ id: s.id, type: 'tournament', name: s.tournamentName, date: s.date, time: s.time, courseName: s.courseName, info: s.info });
    });
    items.sort((a, b) => {
      const dA = parseScheduleDate(a.date, a.time);
      const dB = parseScheduleDate(b.date, b.time);
      return dA.getTime() - dB.getTime();
    });
    return items;
  }, [crewScheduled, crewScheduledRounds, crewScheduledTournaments]);

  const now = useMemo(() => new Date(), []);

  const upcomingItems = useMemo(() => {
    return allScheduleItems.filter((item) => parseScheduleDate(item.date, item.time).getTime() >= now.getTime()).slice(0, 5);
  }, [allScheduleItems, now]);

  const pastItems = useMemo(() => {
    return allScheduleItems.filter((item) => parseScheduleDate(item.date, item.time).getTime() < now.getTime()).reverse();
  }, [allScheduleItems, now]);

  const getInitials = useCallback((name: string) => {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  const renderMemberRow = useCallback((user: { id: string; display_name: string; username: string; avatar_url: string | null }, _role: string) => {
    const name = user.display_name || user.username || '?';
    return (
      <View key={user.id} style={styles.memberRow}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.memberAvatar} />
        ) : (
          <View style={[styles.memberAvatarPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#E8E8E8' }]}>
            <Text style={[styles.memberInitials, { color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }]}>{getInitials(name)}</Text>
          </View>
        )}
        <Text style={[styles.memberName, { color: textColor }]}>{name}</Text>
      </View>
    );
  }, [isDark, textColor, getInitials]);

  const renderActivityCard = useCallback((item: ScheduleItem, showDate: boolean, isPast?: boolean) => {
    const typeColor = getTypeColor(item.type);
    const Wrapper = isPast ? TouchableOpacity : View;
    const wrapperProps = isPast ? {
      onPress: () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPastDetailItem(item);
      },
      activeOpacity: 0.7,
    } : {};
    return (
      <Wrapper key={item.id} style={[styles.activityCard, { backgroundColor: cardBg }]} {...wrapperProps}>
        <View style={styles.activityCardTop}>
          <View style={[styles.activityTypeBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.activityTypeBadgeText}>{getTypeLabel(item.type)}</Text>
          </View>
          <View style={styles.activityTimeRow}>
            <Clock size={12} color={subtextColor} />
            <Text style={[styles.activityTimeText, { color: subtextColor }]}>{item.time || '--:--'}</Text>
          </View>
        </View>
        <Text style={[styles.activityName, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
        {showDate && (
          <Text style={[styles.activityDate, { color: subtextColor }]}>{formatDateLabel(item.date)}</Text>
        )}
        {item.courseName ? (
          <View style={styles.activityCourseRow}>
            <MapPin size={11} color={subtextColor} />
            <Text style={[styles.activityCourseText, { color: subtextColor }]} numberOfLines={1}>{item.courseName}</Text>
          </View>
        ) : null}
      </Wrapper>
    );
  }, [cardBg, textColor, subtextColor]);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView edges={['top']} style={[styles.safeTop, { backgroundColor: bgColor }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.glassIconBtn}
              activeOpacity={0.7}
              testID="crew-back-button"
            >
              <ChevronLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerTitle, isDark && { color: '#FFFFFF' }]}>{displayName}</Text>
          <View style={styles.headerRight}>
            {(crewRole === 'leader' || crewRole === 'manager') && (
              <TouchableOpacity
                style={styles.glassIconBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCreateVisible(true);
                }}
                activeOpacity={0.7}
                testID="crew-create-button"
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {crewRole === 'leader' && (
              <TouchableOpacity
                style={styles.glassIconBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSettingsVisible(true);
                }}
                activeOpacity={0.7}
                testID="crew-settings-button"
              >
                <Settings size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.glassIconBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setScheduleVisible(true);
              }}
              activeOpacity={0.7}
              testID="crew-schedule-button"
            >
              <CalendarDays size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabBar}>
          <View style={styles.tabRow}>
            {TAB_KEYS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, { width: tabWidth }]}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tabText,
                  isDark && { color: 'rgba(255,255,255,0.5)' },
                  activeTab === tab && styles.tabTextActive,
                  activeTab === tab && isDark && { color: '#FFFFFF' },
                ]}>
                  {tab === 'crew' ? 'Crew' : tab === 'latest' ? 'Latest' : 'Stats'}
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
                backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A',
              },
            ]}
          />
        </View>
      </SafeAreaView>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: bgColor }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'crew' ? (
          <View style={styles.crewSegment}>
            <View style={styles.crewTopSection}>
              <View style={styles.crewLogoCol}>
                <View style={styles.crewLogoShadow}>
                  {crewLogo ? (
                    <Image source={{ uri: crewLogo }} style={styles.crewLogoImage} />
                  ) : (
                    <View style={[styles.crewLogoPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#E8E8E8' }]}>
                      <Users size={28} color={isDark ? 'rgba(255,255,255,0.4)' : '#999'} />
                    </View>
                  )}
                </View>
                <Text style={[styles.crewNameUnderLogo, { color: textColor }]} numberOfLines={1}>{displayName}</Text>
              </View>
              <View style={styles.crewMembersCountCol}>
                <Text style={[styles.membersNumber, { color: textColor }]}>{totalMembers}</Text>
                <Text style={[styles.membersLabel, { color: subtextColor }]}>Members</Text>
              </View>
            </View>

            <View style={[styles.crewDivider, { backgroundColor: dividerColor }]} />

            <View style={styles.crewListSection}>
              <Text style={[styles.crewListTitle, { color: textColor }]}>The Crew</Text>

              <View style={styles.roleSection}>
                <View style={styles.roleLabelRow}>
                  <Crown size={14} color="#FFCC00" />
                  <Text style={[styles.roleLabel, { color: subtextColor }]}>Leader</Text>
                </View>
                {leaderUser ? (
                  renderMemberRow(leaderUser, 'leader')
                ) : (
                  <Text style={[styles.noMembersText, { color: subtextColor }]}>—</Text>
                )}
              </View>

              <View style={styles.roleSection}>
                <View style={styles.roleLabelRow}>
                  <Shield size={14} color="#007AFF" />
                  <Text style={[styles.roleLabel, { color: subtextColor }]}>Managers</Text>
                </View>
                {managerUsers.length > 0 ? (
                  managerUsers.map((u) => renderMemberRow(u, 'manager'))
                ) : (
                  <Text style={[styles.noMembersText, { color: subtextColor }]}>No managers added</Text>
                )}
              </View>

              <View style={styles.roleSection}>
                <View style={styles.roleLabelRow}>
                  <Users size={14} color="#34C759" />
                  <Text style={[styles.roleLabel, { color: subtextColor }]}>Players</Text>
                </View>
                {playerUsers.length > 0 ? (
                  playerUsers.map((u) => renderMemberRow(u, 'player'))
                ) : (
                  <Text style={[styles.noMembersText, { color: subtextColor }]}>No players added</Text>
                )}
              </View>
            </View>
          </View>
        ) : activeTab === 'latest' ? (
          <View style={styles.latestSegment}>
            <Text style={[styles.latestSectionHeader, { color: textColor }]}>Upcoming</Text>
            {upcomingItems.length > 0 ? (
              upcomingItems.map((item) => renderActivityCard(item, true))
            ) : (
              <Text style={[styles.latestEmptyText, { color: subtextColor }]}>No upcoming activities scheduled.</Text>
            )}

            <View style={[styles.crewDivider, { backgroundColor: dividerColor, marginTop: 20, marginBottom: 20 }]} />

            <Text style={[styles.latestSectionHeader, { color: textColor }]}>Past</Text>
            {pastItems.length > 0 ? (
              pastItems.map((item) => renderActivityCard(item, true, true))
            ) : (
              <Text style={[styles.latestEmptyText, { color: subtextColor }]}>No past activities yet.</Text>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>📊</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>Crew Stats</Text>
            <Text style={[styles.emptyText, { color: subtextColor }]}>
              Performance statistics and progress tracking for your crew will appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={createVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCreateVisible(false)}
      >
        <CrewCreateScreen onClose={() => setCreateVisible(false)} />
      </Modal>

      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <CrewManagementScreen onClose={() => setSettingsVisible(false)} />
      </Modal>

      <Modal
        visible={scheduleVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setScheduleVisible(false)}
      >
        <CrewScheduleScreen onClose={() => setScheduleVisible(false)} />
      </Modal>

      <Modal
        visible={pastDetailItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPastDetailItem(null)}
      >
        <View style={styles.pastDetailOverlay}>
          <View style={[styles.pastDetailCard, { backgroundColor: isDark ? bgColor : '#1A1A1A' }]}>
            <View style={styles.pastDetailHeader}>
              <Text style={styles.pastDetailTitle}>{pastDetailItem?.name}</Text>
              <TouchableOpacity onPress={() => setPastDetailItem(null)}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.pastDetailDivider} />
            <View style={styles.pastDetailRow}>
              <Text style={styles.pastDetailLabel}>Type</Text>
              <Text style={styles.pastDetailValue}>{pastDetailItem ? getTypeLabel(pastDetailItem.type) : ''}</Text>
            </View>
            <View style={styles.pastDetailRow}>
              <Text style={styles.pastDetailLabel}>Date</Text>
              <Text style={styles.pastDetailValue}>{pastDetailItem?.date}</Text>
            </View>
            <View style={styles.pastDetailRow}>
              <Text style={styles.pastDetailLabel}>Time</Text>
              <Text style={styles.pastDetailValue}>{pastDetailItem?.time}</Text>
            </View>
            {pastDetailItem?.courseName ? (
              <View style={styles.pastDetailRow}>
                <Text style={styles.pastDetailLabel}>Course</Text>
                <Text style={styles.pastDetailValue}>{pastDetailItem.courseName}</Text>
              </View>
            ) : null}
            {pastDetailItem?.info ? (
              <>
                <View style={styles.pastDetailDivider} />
                <Text style={styles.pastDetailSubheader}>Info</Text>
                <Text style={styles.pastDetailInfo}>{pastDetailItem.info}</Text>
              </>
            ) : null}
            <View style={styles.pastDetailDivider} />
            <View style={styles.pastDetailResultSection}>
              <View style={styles.pastDetailResultHeader}>
                <Trophy size={16} color="#FFD700" />
                <Text style={styles.pastDetailResultTitle}>Results</Text>
              </View>
              <View style={styles.pastDetailPlacement}>
                <View style={[styles.pastDetailRankBadge, { backgroundColor: '#FFD700' }]}>
                  <Text style={styles.pastDetailRankText}>1</Text>
                </View>
                <Text style={styles.pastDetailWinnerName}>Winner</Text>
                <Text style={styles.pastDetailWinnerScore}>
                  {pastDetailItem?.type === 'drill' ? 'Best Score' : 'Lowest'}
                </Text>
              </View>
              <Text style={styles.pastDetailResultNote}>
                Detailed results are saved after completing the crew event.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeTop: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  glassIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  tabBar: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 0,
  },
  tabRow: {
    flexDirection: 'row' as const,
  },
  tabBtn: {
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(0,0,0,0.35)',
  },
  tabTextActive: {
    color: '#1A1A1A',
    fontWeight: '700' as const,
  },
  tabUnderline: {
    height: 3,
    backgroundColor: '#1A1A1A',
    borderRadius: 1.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  crewSegment: {},
  crewTopSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingBottom: 20,
  },
  crewLogoCol: {
    alignItems: 'center' as const,
    gap: 10,
  },
  crewLogoShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  crewLogoImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  crewLogoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  crewNameUnderLogo: {
    fontSize: 15,
    fontWeight: '700' as const,
    maxWidth: 120,
    textAlign: 'center' as const,
  },
  crewMembersCountCol: {
    alignItems: 'center' as const,
    flex: 1,
  },
  membersNumber: {
    fontSize: 38,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  membersLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  crewDivider: {
    height: 1,
    marginBottom: 20,
  },
  crewListSection: {},
  crewListTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    marginBottom: 18,
  },
  roleSection: {
    marginBottom: 18,
  },
  roleLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  memberRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 6,
    paddingLeft: 4,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  memberAvatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  memberInitials: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  noMembersText: {
    fontSize: 13,
    fontWeight: '500' as const,
    paddingLeft: 4,
    paddingVertical: 4,
  },
  latestSegment: {},
  latestSectionHeader: {
    fontSize: 18,
    fontWeight: '800' as const,
    marginBottom: 14,
  },
  latestEmptyText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  activityCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  activityCardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 6,
  },
  activityTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activityTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  activityTimeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  activityTimeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  activityCourseRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 2,
  },
  activityCourseText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  pastDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  },
  pastDetailCard: {
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%' as any,
  },
  pastDetailHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  pastDetailTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  pastDetailDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  pastDetailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
  },
  pastDetailLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600' as const,
  },
  pastDetailValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  pastDetailSubheader: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pastDetailInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  pastDetailResultSection: {
    gap: 12,
  },
  pastDetailResultHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  pastDetailResultTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  pastDetailPlacement: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 8,
  },
  pastDetailRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pastDetailRankText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#0A0A0A',
  },
  pastDetailWinnerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  pastDetailWinnerScore: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.4)',
  },
  pastDetailResultNote: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic' as const,
  },
});
