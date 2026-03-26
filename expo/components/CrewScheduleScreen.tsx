import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, Calendar, Trash2, Check, X, ChevronRight, MapPin, Users, Play } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useProfile, CrewDrill, CrewRound, CrewTournament, ScheduledDrill, ScheduledRound, ScheduledTournament } from '@/contexts/ProfileContext';
import { getScreenWidth } from '@/utils/responsive';

interface CrewScheduleScreenProps {
  onClose: () => void;
}

const TABS = ['Schedule', 'Storage'] as const;
type Tab = typeof TABS[number];

const SCREEN_WIDTH = getScreenWidth();

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthDays(year: number, month: number): { day: number; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { day: number; isCurrentMonth: boolean }[] = [];

  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true });
  }
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }
  }
  return days;
}

type ScheduleType = 'drill' | 'round' | 'tournament';

export default function CrewScheduleScreen({ onClose }: CrewScheduleScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    crewColor, crewDrills, crewRounds, crewTournaments, crewScheduled, crewScheduledRounds, crewScheduledTournaments,
    deleteCrewDrill, deleteCrewRound, deleteCrewTournament,
    saveScheduledDrill, saveScheduledRound, saveScheduledTournament,
    deleteScheduledDrill, deleteScheduledRound, deleteScheduledTournament,
    allUsers,
    crewRole,
  } = useProfile();
  const bgColor = crewColor || '#FFFFFF';
  const isDark = bgColor !== '#FFFFFF';
  const [activeTab, setActiveTab] = useState<Tab>(crewRole === 'player' ? 'Storage' : 'Schedule');
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const [drillDetailVisible, setDrillDetailVisible] = useState<CrewDrill | null>(null);
  const [roundDetailVisible, setRoundDetailVisible] = useState<CrewRound | null>(null);
  const [tournamentDetailVisible, setTournamentDetailVisible] = useState<CrewTournament | null>(null);
  const [scheduledDetailVisible, setScheduledDetailVisible] = useState<{ itemType: 'drill' | 'round' | 'tournament'; id: string; date: string; time: string; [key: string]: any } | null>(null);
  const [schedulePickerVisible, setSchedulePickerVisible] = useState<boolean>(false);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('drill');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; type: 'drill' | 'round' | 'tournament' | 'scheduled_drill' | 'scheduled_round' | 'scheduled_tournament' } | null>(null);
  const [startNowConfirm, setStartNowConfirm] = useState<{ id: string; name: string; type: 'drill' | 'round' | 'tournament' } | null>(null);

  const now = new Date();
  const [calendarYear, setCalendarYear] = useState<number>(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const calendarDays = useMemo(() => getMonthDays(calendarYear, calendarMonth), [calendarYear, calendarMonth]);

  const selectedDateString = useMemo(() => {
    if (!selectedDay) return '';
    const m = String(calendarMonth + 1).padStart(2, '0');
    const d = String(selectedDay).padStart(2, '0');
    return `${calendarYear}-${m}-${d}`;
  }, [calendarYear, calendarMonth, selectedDay]);

  const handleTabPress = useCallback((tab: Tab) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = tab === 'Schedule' ? 0 : 1;
    Animated.spring(indicatorAnim, {
      toValue,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
    setActiveTab(tab);
  }, [indicatorAnim]);

  const tabWidth = (SCREEN_WIDTH - 32) / 2;
  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabWidth],
  });

  const handlePrevMonth = useCallback(() => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }, [calendarMonth]);

  const handleNextMonth = useCallback(() => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }, [calendarMonth]);

  const handleDeleteItem = useCallback(async () => {
    if (!deleteConfirm) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      if (deleteConfirm.type === 'drill') {
        await deleteCrewDrill(deleteConfirm.id);
      } else if (deleteConfirm.type === 'round') {
        await deleteCrewRound(deleteConfirm.id);
      } else if (deleteConfirm.type === 'tournament') {
        await deleteCrewTournament(deleteConfirm.id);
      } else if (deleteConfirm.type === 'scheduled_drill') {
        await deleteScheduledDrill(deleteConfirm.id);
      } else if (deleteConfirm.type === 'scheduled_round') {
        await deleteScheduledRound(deleteConfirm.id);
      } else if (deleteConfirm.type === 'scheduled_tournament') {
        await deleteScheduledTournament(deleteConfirm.id);
      }
      console.log('[CrewSchedule] Deleted:', deleteConfirm.name);
    } catch (err: any) {
      console.log('[CrewSchedule] Delete error:', err.message);
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteCrewDrill, deleteCrewRound, deleteCrewTournament, deleteScheduledDrill, deleteScheduledRound, deleteScheduledTournament]);

  const handleStartNow = useCallback(() => {
    if (!startNowConfirm) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    try {
      if (startNowConfirm.type === 'drill') {
        const drill = crewDrills.find((d) => d.id === startNowConfirm.id);
        if (drill) {
          const scheduled: ScheduledDrill = {
            id: Date.now().toString() + '_now_' + drill.id,
            drillId: drill.id,
            drillName: drill.name,
            date: dateStr,
            time: timeStr,
            createdAt: Date.now(),
          };
          void saveScheduledDrill(scheduled);
        }
      } else if (startNowConfirm.type === 'round') {
        const round = crewRounds.find((r) => r.id === startNowConfirm.id);
        if (round) {
          const scheduled: ScheduledRound = {
            id: Date.now().toString() + '_now_' + round.id,
            roundId: round.id,
            roundName: round.name,
            courseName: round.courseName || undefined,
            courseClubName: round.courseClubName || undefined,
            courseCity: round.courseCity || undefined,
            courseCountry: round.courseCountry || undefined,
            holeOption: round.holeOption || undefined,
            groups: round.groups || undefined,
            info: round.info || undefined,
            date: dateStr,
            time: timeStr,
            createdAt: Date.now(),
          };
          void saveScheduledRound(scheduled);
        }
      } else {
        const tournament = crewTournaments.find((t) => t.id === startNowConfirm.id);
        if (tournament) {
          const scheduled: ScheduledTournament = {
            id: Date.now().toString() + '_now_' + tournament.id,
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            courseName: tournament.courseName || undefined,
            courseClubName: tournament.courseClubName || undefined,
            courseCity: tournament.courseCity || undefined,
            courseCountry: tournament.courseCountry || undefined,
            holeOption: tournament.holeOption || undefined,
            format: tournament.format || undefined,
            totalRounds: tournament.totalRounds || undefined,
            groups: tournament.groups || undefined,
            info: tournament.info || undefined,
            date: dateStr,
            time: timeStr,
            createdAt: Date.now(),
          };
          void saveScheduledTournament(scheduled);
        }
      }
      console.log('[CrewSchedule] Started now:', startNowConfirm.name, startNowConfirm.type);
      Alert.alert('Started!', `"${startNowConfirm.name}" has been started. Invitations sent to all players.`);
    } catch (err: any) {
      console.log('[CrewSchedule] Start now error:', err.message);
      Alert.alert('Error', 'Failed to start the event.');
    }
    setStartNowConfirm(null);
  }, [startNowConfirm, crewDrills, crewRounds, crewTournaments, saveScheduledDrill, saveScheduledRound, saveScheduledTournament]);

  const toggleSelection = useCallback((id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSaveSchedule = useCallback(async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Nothing Selected', `Please select at least one ${scheduleType} to schedule.`);
      return;
    }
    if (!selectedDateString || !scheduleTime.trim()) {
      Alert.alert('Missing Info', 'Please select a date and enter a time.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      if (scheduleType === 'drill') {
        for (const drillId of selectedIds) {
          const drill = crewDrills.find((d) => d.id === drillId);
          if (!drill) continue;
          const scheduled: ScheduledDrill = {
            id: Date.now().toString() + '_' + drillId,
            drillId: drill.id,
            drillName: drill.name,
            date: selectedDateString,
            time: scheduleTime.trim(),
            createdAt: Date.now(),
          };
          await saveScheduledDrill(scheduled);
        }
      } else if (scheduleType === 'round') {
        for (const roundId of selectedIds) {
          const round = crewRounds.find((r) => r.id === roundId);
          if (!round) continue;
          const scheduled: ScheduledRound = {
            id: Date.now().toString() + '_' + roundId,
            roundId: round.id,
            roundName: round.name,
            courseName: round.courseName || undefined,
            courseClubName: round.courseClubName || undefined,
            courseCity: round.courseCity || undefined,
            courseCountry: round.courseCountry || undefined,
            holeOption: round.holeOption || undefined,
            groups: round.groups || undefined,
            info: round.info || undefined,
            date: selectedDateString,
            time: scheduleTime.trim(),
            createdAt: Date.now(),
          };
          await saveScheduledRound(scheduled);
        }
      } else {
        for (const tournamentId of selectedIds) {
          const tournament = crewTournaments.find((t) => t.id === tournamentId);
          if (!tournament) continue;
          const scheduled: ScheduledTournament = {
            id: Date.now().toString() + '_' + tournamentId,
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            courseName: tournament.courseName || undefined,
            courseClubName: tournament.courseClubName || undefined,
            courseCity: tournament.courseCity || undefined,
            courseCountry: tournament.courseCountry || undefined,
            holeOption: tournament.holeOption || undefined,
            format: tournament.format || undefined,
            totalRounds: tournament.totalRounds || undefined,
            groups: tournament.groups || undefined,
            info: tournament.info || undefined,
            date: selectedDateString,
            time: scheduleTime.trim(),
            createdAt: Date.now(),
          };
          await saveScheduledTournament(scheduled);
        }
      }
      console.log('[CrewSchedule] Items scheduled successfully');
      Alert.alert('Scheduled', `${selectedIds.length} item(s) have been scheduled.`);
      setSchedulePickerVisible(false);
      setSelectedIds([]);
      setScheduleTime('');
      setSelectedDay(null);
      setActiveTab('Schedule');
      Animated.spring(indicatorAnim, { toValue: 0, useNativeDriver: true, tension: 300, friction: 30 }).start();
    } catch (err: any) {
      console.log('[CrewSchedule] Schedule error:', err.message);
      Alert.alert('Error', 'Failed to schedule items.');
    }
  }, [selectedIds, selectedDateString, scheduleTime, scheduleType, crewDrills, crewRounds, crewTournaments, saveScheduledDrill, saveScheduledRound, saveScheduledTournament, indicatorAnim]);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPlayerName = useCallback((playerId: string) => {
    const user = allUsers.find((u) => u.id === playerId);
    return user?.display_name || user?.username || 'Unknown';
  }, [allUsers]);

  const getHoleLabel = (opt: string) => {
    if (opt === '18') return '18 holes';
    if (opt === '9_first') return 'First 9';
    if (opt === '9_back') return 'Back 9';
    return opt;
  };

  const allScheduledItems = useMemo(() => {
    const drillItems = crewScheduled.map((s) => ({ ...s, itemType: 'drill' as const }));
    const roundItems = crewScheduledRounds.map((s) => ({ ...s, itemType: 'round' as const }));
    const tournamentItems = crewScheduledTournaments.map((s) => ({ ...s, itemType: 'tournament' as const }));
    const now = new Date();
    return [...drillItems, ...roundItems, ...tournamentItems]
      .filter((item) => {
        const [year, month, day] = item.date.split('-').map(Number);
        const [hours, minutes] = (item.time || '00:00').split(':').map(Number);
        const itemDate = new Date(year, month - 1, day, hours || 0, minutes || 0);
        return itemDate.getTime() >= now.getTime();
      })
      .sort((a, b) => {
        const dateA = a.date + ' ' + a.time;
        const dateB = b.date + ' ' + b.time;
        return dateA.localeCompare(dateB);
      });
  }, [crewScheduled, crewScheduledRounds, crewScheduledTournaments]);

  const renderScheduleTab = () => {
    if (allScheduledItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={styles.emptyEmoji}>📅</Text>
          </View>
          <Text style={[styles.emptyTitle, isDark && { color: '#FFFFFF' }]}>Schedule</Text>
          <Text style={[styles.emptyText, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
            No scheduled items yet. Go to Storage to schedule drills or rounds.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.cardList}>
        {allScheduledItems.map((item) => {
          const name = item.itemType === 'drill' ? (item as any).drillName : item.itemType === 'round' ? (item as any).roundName : (item as any).tournamentName;
          const deleteType = item.itemType === 'drill' ? 'scheduled_drill' as const : item.itemType === 'round' ? 'scheduled_round' as const : 'scheduled_tournament' as const;
          const scheduledRound = item.itemType === 'round' ? item as (ScheduledRound & { itemType: 'round' }) : null;
          const scheduledTournament = item.itemType === 'tournament' ? item as (ScheduledTournament & { itemType: 'tournament' }) : null;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.scheduleCard, isDark && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.1)' }]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setScheduledDetailVisible(item);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.scheduleCardTop}>
                <View style={styles.scheduleCardNameRow}>
                  <View style={[styles.scheduleTypeBadge, item.itemType === 'round' ? { backgroundColor: '#3B82F6' } : item.itemType === 'tournament' ? { backgroundColor: '#F59E0B' } : { backgroundColor: '#2E7D32' }]}>
                    <Text style={styles.scheduleTypeBadgeText}>{item.itemType === 'round' ? 'Round' : item.itemType === 'tournament' ? 'Tournament' : 'Drill'}</Text>
                  </View>
                  <Text style={[styles.scheduleCardName, isDark && { color: '#FFFFFF' }]} numberOfLines={1}>{name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setDeleteConfirm({ id: item.id, name, type: deleteType });
                  }}
                  style={[styles.deleteBtn, isDark && { backgroundColor: 'rgba(255,59,48,0.2)' }]}
                >
                  <Trash2 size={14} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              {(scheduledRound?.courseName || scheduledTournament?.courseName) ? (
                <View style={styles.scheduleCardCourse}>
                  <MapPin size={12} color={isDark ? 'rgba(255,255,255,0.5)' : '#888'} />
                  <Text style={[styles.scheduleCardCourseText, isDark && { color: 'rgba(255,255,255,0.6)' }]} numberOfLines={1}>
                    {scheduledRound?.courseName || scheduledTournament?.courseName}
                  </Text>
                </View>
              ) : null}
              <View style={styles.scheduleCardMeta}>
                <View style={styles.metaItem}>
                  <Calendar size={13} color={isDark ? 'rgba(255,255,255,0.5)' : '#888'} />
                  <Text style={[styles.metaText, isDark && { color: 'rgba(255,255,255,0.6)' }]}>{item.date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={13} color={isDark ? 'rgba(255,255,255,0.5)' : '#888'} />
                  <Text style={[styles.metaText, isDark && { color: 'rgba(255,255,255,0.6)' }]}>{item.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderStorageTab = () => {
    const hasItems = crewDrills.length > 0 || crewRounds.length > 0 || crewTournaments.length > 0;
    if (!hasItems) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={styles.emptyEmoji}>📦</Text>
          </View>
          <Text style={[styles.emptyTitle, isDark && { color: '#FFFFFF' }]}>Storage</Text>
          <Text style={[styles.emptyText, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
            No items saved yet. Create drills or rounds from the Create screen.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.cardList}>
        {crewDrills.length > 0 && (
          <Text style={[styles.storageSectionLabel, isDark && { color: 'rgba(255,255,255,0.5)' }]}>DRILLS</Text>
        )}
        {crewDrills.map((drill) => (
          <TouchableOpacity
            key={drill.id}
            style={[styles.drillCard, isDark && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.1)' }]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDrillDetailVisible(drill);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.drillCardTop}>
              <View style={styles.drillCardLeft}>
                <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(drill.category) }]} />
                <Text style={[styles.drillCardName, isDark && { color: '#FFFFFF' }]}>{drill.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setDeleteConfirm({ id: drill.id, name: drill.name, type: 'drill' });
                }}
                style={[styles.deleteBtn, isDark && { backgroundColor: 'rgba(255,59,48,0.2)' }]}
              >
                <Trash2 size={14} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <View style={styles.drillCardMeta}>
              <Text style={[styles.drillCardCategory, isDark && { color: 'rgba(255,255,255,0.5)' }]}>{drill.category}</Text>
              <Text style={[styles.drillCardStats, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
                {drill.rounds}R × {drill.shotsPerRound}S = {drill.totalShots} shots
              </Text>
            </View>
            <Text style={[styles.drillCardDate, isDark && { color: 'rgba(255,255,255,0.3)' }]}>
              Created {formatDate(drill.createdAt)}
            </Text>
            {crewRole !== 'player' && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setStartNowConfirm({ id: drill.id, name: drill.name, type: 'drill' });
                }}
                activeOpacity={0.8}
                style={styles.startNowBtnOuter}
              >
                <LinearGradient
                  colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startNowBtn}
                >
                  <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.startNowBtnText}>Start Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {crewRounds.length > 0 && (
          <Text style={[styles.storageSectionLabel, isDark && { color: 'rgba(255,255,255,0.5)' }, crewDrills.length > 0 && { marginTop: 16 }]}>ROUNDS</Text>
        )}
        {crewRounds.map((round) => (
          <TouchableOpacity
            key={round.id}
            style={[styles.drillCard, isDark && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.1)' }]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRoundDetailVisible(round);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.drillCardTop}>
              <View style={styles.drillCardLeft}>
                <View style={[styles.categoryDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={[styles.drillCardName, isDark && { color: '#FFFFFF' }]}>{round.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setDeleteConfirm({ id: round.id, name: round.name, type: 'round' });
                }}
                style={[styles.deleteBtn, isDark && { backgroundColor: 'rgba(255,59,48,0.2)' }]}
              >
                <Trash2 size={14} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <View style={styles.drillCardMeta}>
              <View style={styles.roundMetaRow}>
                {round.courseName ? (
                  <View style={styles.roundMetaItem}>
                    <MapPin size={12} color={isDark ? 'rgba(255,255,255,0.5)' : '#888'} />
                    <Text style={[styles.drillCardCategory, isDark && { color: 'rgba(255,255,255,0.5)' }]}>{round.courseName}</Text>
                  </View>
                ) : null}
                <View style={styles.roundMetaItem}>
                  <Users size={12} color={isDark ? 'rgba(255,255,255,0.5)' : '#888'} />
                  <Text style={[styles.drillCardStats, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
                    {round.groups.length} group{round.groups.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <Text style={[styles.drillCardStats, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
                {getHoleLabel(round.holeOption)}
              </Text>
            </View>
            <Text style={[styles.drillCardDate, isDark && { color: 'rgba(255,255,255,0.3)' }]}>
              Created {formatDate(round.createdAt)}
            </Text>
            {crewRole !== 'player' && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setStartNowConfirm({ id: round.id, name: round.name, type: 'round' });
                }}
                activeOpacity={0.8}
                style={styles.startNowBtnOuter}
              >
                <LinearGradient
                  colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startNowBtn}
                >
                  <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.startNowBtnText}>Start Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {crewTournaments.length > 0 && (
          <Text style={[styles.storageSectionLabel, isDark && { color: 'rgba(255,255,255,0.5)' }, (crewDrills.length > 0 || crewRounds.length > 0) && { marginTop: 16 }]}>TOURNAMENTS</Text>
        )}
        {crewTournaments.map((tournament) => (
          <TouchableOpacity
            key={tournament.id}
            style={[styles.drillCard, isDark && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.1)' }]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTournamentDetailVisible(tournament);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.drillCardTop}>
              <View style={styles.drillCardLeft}>
                <View style={[styles.categoryDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.drillCardName, isDark && { color: '#FFFFFF' }]}>{tournament.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setDeleteConfirm({ id: tournament.id, name: tournament.name, type: 'tournament' });
                }}
                style={[styles.deleteBtn, isDark && { backgroundColor: 'rgba(255,59,48,0.2)' }]}
              >
                <Trash2 size={14} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <View style={styles.drillCardMeta}>
              <View style={styles.roundMetaRow}>
                {tournament.courseName ? (
                  <View style={styles.roundMetaItem}>
                    <MapPin size={12} color={isDark ? 'rgba(255,255,255,0.5)' : '#888'} />
                    <Text style={[styles.drillCardCategory, isDark && { color: 'rgba(255,255,255,0.5)' }]}>{tournament.courseName}</Text>
                  </View>
                ) : null}
                {tournament.format ? (
                  <View style={styles.roundMetaItem}>
                    <Text style={[styles.drillCardStats, isDark && { color: 'rgba(255,255,255,0.5)' }]}>{tournament.format}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.drillCardStats, isDark && { color: 'rgba(255,255,255,0.5)' }]}>
                {getHoleLabel(tournament.holeOption)}
              </Text>
            </View>
            <Text style={[styles.drillCardDate, isDark && { color: 'rgba(255,255,255,0.3)' }]}>
              Created {formatDate(tournament.createdAt)}
            </Text>
            {crewRole !== 'player' && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setStartNowConfirm({ id: tournament.id, name: tournament.name, type: 'tournament' });
                }}
                activeOpacity={0.8}
                style={styles.startNowBtnOuter}
              >
                <LinearGradient
                  colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startNowBtn}
                >
                  <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.startNowBtnText}>Start Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {crewRole !== 'player' && (
          <View style={styles.scheduleButtonsRow}>
            {crewDrills.length > 0 && (
              <TouchableOpacity
                style={styles.scheduleDrillsBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setScheduleType('drill');
                  setSelectedIds([]);
                  setScheduleTime('');
                  setSelectedDay(null);
                  setSchedulePickerVisible(true);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scheduleDrillsBtnGradient}
                >
                  <Calendar size={16} color="#FFFFFF" />
                  <Text style={styles.scheduleDrillsBtnText}>Schedule Drills</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {crewRounds.length > 0 && (
              <TouchableOpacity
                style={styles.scheduleDrillsBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setScheduleType('round');
                  setSelectedIds([]);
                  setScheduleTime('');
                  setSelectedDay(null);
                  setSchedulePickerVisible(true);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#60A5FA', '#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scheduleDrillsBtnGradient}
                >
                  <Calendar size={16} color="#FFFFFF" />
                  <Text style={styles.scheduleDrillsBtnText}>Schedule Rounds</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {crewTournaments.length > 0 && (
              <TouchableOpacity
                style={styles.scheduleDrillsBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setScheduleType('tournament');
                  setSelectedIds([]);
                  setScheduleTime('');
                  setSelectedDay(null);
                  setSchedulePickerVisible(true);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FBBF24', '#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scheduleDrillsBtnGradient}
                >
                  <Calendar size={16} color="#FFFFFF" />
                  <Text style={styles.scheduleDrillsBtnText}>Schedule Tournaments</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderCalendar = () => {
    const today = new Date();
    const isCurrentMonth = calendarYear === today.getFullYear() && calendarMonth === today.getMonth();

    return (
      <View style={[styles.calendarContainer, isDark && { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn}>
            <ChevronLeft size={20} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </TouchableOpacity>
          <Text style={[styles.calendarMonthText, isDark && { color: '#FFFFFF' }]}>
            {MONTH_NAMES[calendarMonth]} {calendarYear}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn}>
            <ChevronRight size={20} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarDayNames}>
          {DAY_NAMES.map((name) => (
            <View key={name} style={styles.calendarDayNameCell}>
              <Text style={[styles.calendarDayNameText, isDark && { color: 'rgba(255,255,255,0.4)' }]}>{name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((item, idx) => {
            const isSelected = item.isCurrentMonth && item.day === selectedDay;
            const isToday = isCurrentMonth && item.isCurrentMonth && item.day === today.getDate();
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.calendarDayCell,
                  isSelected && styles.calendarDayCellSelected,
                  isSelected && isDark && { backgroundColor: '#FFFFFF' },
                ]}
                onPress={() => {
                  if (item.isCurrentMonth) {
                    setSelectedDay(item.day);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                activeOpacity={item.isCurrentMonth ? 0.7 : 1}
                disabled={!item.isCurrentMonth}
              >
                <Text style={[
                  styles.calendarDayText,
                  !item.isCurrentMonth && styles.calendarDayTextMuted,
                  isDark && item.isCurrentMonth && { color: '#FFFFFF' },
                  isDark && !item.isCurrentMonth && { color: 'rgba(255,255,255,0.2)' },
                  isSelected && { color: isDark ? '#1A1A1A' : '#FFFFFF' },
                  isToday && !isSelected && { color: '#3B82F6' },
                ]}>
                  {item.day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.headerArea, { paddingTop: insets.top + 10, backgroundColor: bgColor }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            style={styles.glassBackBtn}
            activeOpacity={0.7}
            testID="crew-schedule-back"
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && { color: '#FFFFFF' }]}>{activeTab}</Text>
          <View style={{ width: 40 }} />
        </View>

        {crewRole !== 'player' && (
          <View style={styles.segmentContainer}>
            <View style={styles.segmentRow}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => handleTabPress(tab)}
                  style={styles.segmentTab}
                  activeOpacity={0.7}
                  testID={`crew-schedule-tab-${tab.toLowerCase()}`}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      isDark && { color: 'rgba(255,255,255,0.5)' },
                      activeTab === tab && styles.segmentLabelActive,
                      activeTab === tab && isDark && { color: '#FFFFFF' },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.segmentTrack, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Animated.View
                style={[
                  styles.segmentIndicator,
                  isDark && { backgroundColor: '#FFFFFF' },
                  { width: tabWidth, transform: [{ translateX: indicatorTranslateX }] },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Schedule' ? renderScheduleTab() : renderStorageTab()}
      </ScrollView>

      {/* Drill Detail Modal */}
      <Modal
        visible={drillDetailVisible !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDrillDetailVisible(null)}
      >
        <View style={styles.detailOverlay}>
          <View style={[styles.detailCard, isDark && { backgroundColor: bgColor }]}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{drillDetailVisible?.name}</Text>
              <TouchableOpacity onPress={() => setDrillDetailVisible(null)}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{drillDetailVisible?.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rounds</Text>
              <Text style={styles.detailValue}>{drillDetailVisible?.rounds}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shots Per Round</Text>
              <Text style={styles.detailValue}>{drillDetailVisible?.shotsPerRound}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Shots</Text>
              <Text style={styles.detailValue}>{drillDetailVisible?.totalShots}</Text>
            </View>
            {drillDetailVisible?.acceptedDistances && drillDetailVisible.acceptedDistances.some((d) => d > 0) && (
              <>
                <View style={styles.detailDivider} />
                <Text style={styles.detailSubheader}>Accepted Distances</Text>
                {drillDetailVisible.acceptedDistances.map((dist, idx) => (
                  <View key={idx} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Round {idx + 1}</Text>
                    <Text style={styles.detailValue}>{dist}m</Text>
                  </View>
                ))}
              </>
            )}
            {drillDetailVisible?.info ? (
              <>
                <View style={styles.detailDivider} />
                <Text style={styles.detailSubheader}>Info</Text>
                <Text style={styles.detailInfo}>{drillDetailVisible.info}</Text>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Round Detail Modal */}
      <Modal
        visible={roundDetailVisible !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRoundDetailVisible(null)}
      >
        <View style={styles.detailOverlay}>
          <View style={[styles.detailCard, isDark && { backgroundColor: bgColor }]}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{roundDetailVisible?.name}</Text>
              <TouchableOpacity onPress={() => setRoundDetailVisible(null)}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.detailDivider} />
            {roundDetailVisible?.courseName ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Course</Text>
                  <Text style={styles.detailValue}>{roundDetailVisible.courseName}</Text>
                </View>
                {roundDetailVisible.courseClubName ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Club</Text>
                    <Text style={styles.detailValue}>{roundDetailVisible.courseClubName}</Text>
                  </View>
                ) : null}
                {(roundDetailVisible.courseCity || roundDetailVisible.courseCountry) ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>
                      {[roundDetailVisible.courseCity, roundDetailVisible.courseCountry].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : null}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Holes</Text>
              <Text style={styles.detailValue}>{getHoleLabel(roundDetailVisible?.holeOption ?? '18')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Groups</Text>
              <Text style={styles.detailValue}>{roundDetailVisible?.groups.length}</Text>
            </View>
            {roundDetailVisible?.groups.map((group, gIdx) => (
              <View key={group.id}>
                <View style={styles.detailDivider} />
                <Text style={styles.detailSubheader}>Group {gIdx + 1}</Text>
                {group.players.length === 0 ? (
                  <Text style={styles.detailInfo}>No players assigned</Text>
                ) : (
                  group.players.map((pid, pIdx) => (
                    <View key={pIdx} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Player {pIdx + 1}</Text>
                      <Text style={styles.detailValue}>{getPlayerName(pid)}</Text>
                    </View>
                  ))
                )}
              </View>
            ))}
            {roundDetailVisible?.info ? (
              <>
                <View style={styles.detailDivider} />
                <Text style={styles.detailSubheader}>Info</Text>
                <Text style={styles.detailInfo}>{roundDetailVisible.info}</Text>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Tournament Detail Modal */}
      <Modal
        visible={tournamentDetailVisible !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTournamentDetailVisible(null)}
      >
        <View style={styles.detailOverlay}>
          <ScrollView contentContainerStyle={styles.detailScrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.detailCard, isDark && { backgroundColor: bgColor }]}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{tournamentDetailVisible?.name}</Text>
                <TouchableOpacity onPress={() => setTournamentDetailVisible(null)}>
                  <X size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.detailDivider} />
              {tournamentDetailVisible?.format ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Format</Text>
                  <Text style={styles.detailValue}>{tournamentDetailVisible.format}</Text>
                </View>
              ) : null}
              {tournamentDetailVisible?.courseName ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Course</Text>
                    <Text style={styles.detailValue}>{tournamentDetailVisible.courseName}</Text>
                  </View>
                  {tournamentDetailVisible.courseClubName ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Club</Text>
                      <Text style={styles.detailValue}>{tournamentDetailVisible.courseClubName}</Text>
                    </View>
                  ) : null}
                  {(tournamentDetailVisible.courseCity || tournamentDetailVisible.courseCountry) ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>
                        {[tournamentDetailVisible.courseCity, tournamentDetailVisible.courseCountry].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : null}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Holes</Text>
                <Text style={styles.detailValue}>{getHoleLabel(tournamentDetailVisible?.holeOption ?? '18')}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Groups</Text>
                <Text style={styles.detailValue}>{tournamentDetailVisible?.groups.length}</Text>
              </View>
              {tournamentDetailVisible?.groups.map((group, gIdx) => (
                <View key={group.id}>
                  <View style={styles.detailDivider} />
                  <Text style={styles.detailSubheader}>Group {gIdx + 1}</Text>
                  {group.players.length === 0 ? (
                    <Text style={styles.detailInfo}>No players assigned</Text>
                  ) : (
                    group.players.map((pid, pIdx) => (
                      <View key={pIdx} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Player {pIdx + 1}</Text>
                        <Text style={styles.detailValue}>{getPlayerName(pid)}</Text>
                      </View>
                    ))
                  )}
                </View>
              ))}
              {tournamentDetailVisible?.info ? (
                <>
                  <View style={styles.detailDivider} />
                  <Text style={styles.detailSubheader}>Info</Text>
                  <Text style={styles.detailInfo}>{tournamentDetailVisible.info}</Text>
                </>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Schedule Picker Modal with Calendar */}
      <Modal
        visible={schedulePickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSchedulePickerVisible(false)}
      >
        <View style={[styles.schedulePickerContainer, { backgroundColor: isDark ? bgColor : '#FFFFFF' }]}>
          <View style={[styles.schedulePickerHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => setSchedulePickerVisible(false)}>
              <X size={22} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
            </TouchableOpacity>
            <Text style={[styles.schedulePickerTitle, isDark && { color: '#FFFFFF' }]}>
              Schedule {scheduleType === 'drill' ? 'Drills' : scheduleType === 'round' ? 'Rounds' : 'Tournaments'}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.schedulePickerContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.schedulePickerLabel, isDark && { color: 'rgba(255,255,255,0.6)' }]}>
              SELECT {scheduleType === 'drill' ? 'DRILLS' : scheduleType === 'round' ? 'ROUNDS' : 'TOURNAMENTS'}
            </Text>
            {scheduleType === 'drill' ? (
              crewDrills.map((drill) => {
                const isSelected = selectedIds.includes(drill.id);
                return (
                  <TouchableOpacity
                    key={drill.id}
                    style={[styles.schedulePickerDrill, isDark && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.08)' }]}
                    onPress={() => toggleSelection(drill.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.schedulePickerDrillInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(drill.category) }]} />
                      <Text style={[styles.schedulePickerDrillName, isDark && { color: '#FFFFFF' }]}>{drill.name}</Text>
                    </View>
                    <View style={[styles.schedulePickerCheck, isSelected && styles.schedulePickerCheckActive]}>
                      {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : scheduleType === 'round' ? (
              crewRounds.map((round) => {
                const isSelected = selectedIds.includes(round.id);
                return (
                  <TouchableOpacity
                    key={round.id}
                    style={[styles.schedulePickerDrill, isDark && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.08)' }]}
                    onPress={() => toggleSelection(round.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.schedulePickerDrillInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: '#3B82F6' }]} />
                      <Text style={[styles.schedulePickerDrillName, isDark && { color: '#FFFFFF' }]}>{round.name}</Text>
                    </View>
                    <View style={[styles.schedulePickerCheck, isSelected && styles.schedulePickerCheckActive]}>
                      {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              crewTournaments.map((tournament) => {
                const isSelected = selectedIds.includes(tournament.id);
                return (
                  <TouchableOpacity
                    key={tournament.id}
                    style={[styles.schedulePickerDrill, isDark && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.08)' }]}
                    onPress={() => toggleSelection(tournament.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.schedulePickerDrillInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[styles.schedulePickerDrillName, isDark && { color: '#FFFFFF' }]}>{tournament.name}</Text>
                    </View>
                    <View style={[styles.schedulePickerCheck, isSelected && styles.schedulePickerCheckActive]}>
                      {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            <Text style={[styles.schedulePickerLabel, isDark && { color: 'rgba(255,255,255,0.6)' }, { marginTop: 24 }]}>DATE</Text>
            {renderCalendar()}
            {selectedDay && (
              <Text style={[styles.selectedDateText, isDark && { color: 'rgba(255,255,255,0.7)' }]}>
                Selected: {selectedDateString}
              </Text>
            )}

            <Text style={[styles.schedulePickerLabel, isDark && { color: 'rgba(255,255,255,0.6)' }, { marginTop: 16 }]}>TIME</Text>
            <View style={[styles.schedulePickerInput, isDark && { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <Clock size={16} color={isDark ? 'rgba(255,255,255,0.4)' : '#888'} />
              <TextInput
                style={[styles.schedulePickerInputText, isDark && { color: '#FFFFFF' }]}
                placeholder="e.g. 14:00"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'}
                value={scheduleTime}
                onChangeText={setScheduleTime}
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveSchedule}
              activeOpacity={0.8}
              style={[styles.schedulePickerSaveOuter, { opacity: selectedIds.length > 0 && selectedDateString && scheduleTime.trim() ? 1 : 0.5 }]}
            >
              <LinearGradient
                colors={scheduleType === 'drill' ? ['#86D9A5', '#5BBF7F', '#3A8E56'] : scheduleType === 'round' ? ['#60A5FA', '#3B82F6', '#2563EB'] : ['#FBBF24', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.schedulePickerSaveBtn}
              >
                <Text style={styles.schedulePickerSaveText}>Save Schedule</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Scheduled Item Detail Modal */}
      <Modal
        visible={scheduledDetailVisible !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setScheduledDetailVisible(null)}
      >
        <View style={styles.detailOverlay}>
          <ScrollView contentContainerStyle={styles.detailScrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.detailCard, isDark && { backgroundColor: bgColor }]}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>
                  {scheduledDetailVisible?.itemType === 'drill'
                    ? scheduledDetailVisible?.drillName
                    : scheduledDetailVisible?.itemType === 'round'
                    ? scheduledDetailVisible?.roundName
                    : scheduledDetailVisible?.tournamentName}
                </Text>
                <TouchableOpacity onPress={() => setScheduledDetailVisible(null)}>
                  <X size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>
                  {scheduledDetailVisible?.itemType === 'drill' ? 'Drill' : scheduledDetailVisible?.itemType === 'round' ? 'Round' : 'Tournament'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{scheduledDetailVisible?.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{scheduledDetailVisible?.time}</Text>
              </View>
              {(scheduledDetailVisible?.itemType === 'round' || scheduledDetailVisible?.itemType === 'tournament') && scheduledDetailVisible?.courseName ? (
                <>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Course</Text>
                    <Text style={styles.detailValue}>{scheduledDetailVisible.courseName}</Text>
                  </View>
                  {scheduledDetailVisible.courseClubName ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Club</Text>
                      <Text style={styles.detailValue}>{scheduledDetailVisible.courseClubName}</Text>
                    </View>
                  ) : null}
                  {(scheduledDetailVisible.courseCity || scheduledDetailVisible.courseCountry) ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>
                        {[scheduledDetailVisible.courseCity, scheduledDetailVisible.courseCountry].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : null}
              {scheduledDetailVisible?.itemType === 'tournament' && scheduledDetailVisible?.format ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Format</Text>
                  <Text style={styles.detailValue}>{scheduledDetailVisible.format}</Text>
                </View>
              ) : null}
              {(scheduledDetailVisible?.itemType === 'round' || scheduledDetailVisible?.itemType === 'tournament') && scheduledDetailVisible?.holeOption ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Holes</Text>
                  <Text style={styles.detailValue}>{getHoleLabel(scheduledDetailVisible.holeOption)}</Text>
                </View>
              ) : null}
              {(scheduledDetailVisible?.itemType === 'round' || scheduledDetailVisible?.itemType === 'tournament') && scheduledDetailVisible?.groups?.length > 0 ? (
                scheduledDetailVisible.groups.map((group: any, gIdx: number) => (
                  <View key={group.id || gIdx}>
                    <View style={styles.detailDivider} />
                    <Text style={styles.detailSubheader}>Group {gIdx + 1}</Text>
                    {group.players.length === 0 ? (
                      <Text style={styles.detailInfo}>No players assigned</Text>
                    ) : (
                      group.players.map((pid: string, pIdx: number) => (
                        <View key={pIdx} style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Player {pIdx + 1}</Text>
                          <Text style={styles.detailValue}>{getPlayerName(pid)}</Text>
                        </View>
                      ))
                    )}
                  </View>
                ))
              ) : null}
              {(scheduledDetailVisible?.itemType === 'round' || scheduledDetailVisible?.itemType === 'tournament') && scheduledDetailVisible?.info ? (
                <>
                  <View style={styles.detailDivider} />
                  <Text style={styles.detailSubheader}>Info</Text>
                  <Text style={styles.detailInfo}>{scheduledDetailVisible.info}</Text>
                </>
              ) : null}
              {scheduledDetailVisible?.itemType === 'drill' ? (
                (() => {
                  const drill = crewDrills.find((d) => d.id === scheduledDetailVisible?.drillId);
                  if (!drill) return null;
                  return (
                    <>
                      <View style={styles.detailDivider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue}>{drill.category}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Rounds</Text>
                        <Text style={styles.detailValue}>{drill.rounds}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Shots Per Round</Text>
                        <Text style={styles.detailValue}>{drill.shotsPerRound}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Shots</Text>
                        <Text style={styles.detailValue}>{drill.totalShots}</Text>
                      </View>
                      {drill.info ? (
                        <>
                          <View style={styles.detailDivider} />
                          <Text style={styles.detailSubheader}>Info</Text>
                          <Text style={styles.detailInfo}>{drill.info}</Text>
                        </>
                      ) : null}
                    </>
                  );
                })()
              ) : null}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Start Now Confirmation Modal */}
      <Modal
        visible={startNowConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setStartNowConfirm(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: isDark ? bgColor : '#1A1A1A' }]}>
            <Text style={styles.confirmTitle}>Are you sure?</Text>
            <Text style={styles.confirmMessage}>Start "{startNowConfirm?.name}" right now?{"\n"}Invitations will be sent to all players immediately.</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmNoBtn}
                onPress={() => setStartNowConfirm(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmNoBtnText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStartNow}
                activeOpacity={0.7}
                style={styles.confirmYesBtnOuter}
              >
                <LinearGradient
                  colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmYesBtn}
                >
                  <Text style={styles.confirmYesBtnText}>Yes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirm(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: isDark ? bgColor : '#1A1A1A' }]}>
            <Text style={styles.confirmTitle}>Are you sure?</Text>
            <Text style={styles.confirmMessage}>Delete "{deleteConfirm?.name}"?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmNoBtn}
                onPress={() => setDeleteConfirm(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmNoBtnText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteItem}
                activeOpacity={0.7}
                style={styles.confirmYesBtnOuter}
              >
                <LinearGradient
                  colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmYesBtn}
                >
                  <Text style={styles.confirmYesBtnText}>Yes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    Putting: '#2D6A4F',
    Wedges: '#E76F51',
    Irons: '#7B2CBF',
    Woods: '#40916C',
  };
  return map[category] || '#888';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  glassBackBtn: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
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
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  segmentRow: {
    flexDirection: 'row' as const,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#AAAAAA',
  },
  segmentLabelActive: {
    color: '#1A1A1A',
  },
  segmentTrack: {
    height: 2,
    backgroundColor: '#F0F0F0',
    borderRadius: 1,
    marginTop: 2,
  },
  segmentIndicator: {
    height: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 1,
  },
  cardList: {
    gap: 12,
  },
  storageSectionLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#888',
    letterSpacing: 1,
    marginBottom: 4,
  },
  drillCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  drillCardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  drillCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  drillCardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,59,48,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  drillCardMeta: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  drillCardCategory: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
  },
  drillCardStats: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
  },
  drillCardDate: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 4,
  },
  roundMetaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  roundMetaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  scheduleButtonsRow: {
    gap: 10,
    marginTop: 8,
  },
  scheduleDrillsBtn: {
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  scheduleDrillsBtnGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  scheduleDrillsBtnText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  scheduleCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  scheduleCardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  scheduleCardNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 8,
  },
  scheduleTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scheduleTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
  },
  scheduleCardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  scheduleCardMeta: {
    flexDirection: 'row' as const,
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  },
  detailCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%' as any,
  },
  detailHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600' as const,
  },
  detailValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  detailSubheader: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 40,
  },
  confirmCard: {
    width: '100%' as const,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center' as const,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%' as const,
  },
  confirmNoBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  confirmNoBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  confirmYesBtnOuter: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  confirmYesBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  confirmYesBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  schedulePickerContainer: {
    flex: 1,
  },
  schedulePickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  schedulePickerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  schedulePickerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  schedulePickerLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#888',
    letterSpacing: 1,
    marginBottom: 10,
  },
  schedulePickerDrill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  schedulePickerDrillInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  schedulePickerDrillName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  schedulePickerCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  schedulePickerCheckActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  schedulePickerInput: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  schedulePickerInputText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
  },
  schedulePickerSaveOuter: {
    marginTop: 28,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  schedulePickerSaveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  schedulePickerSaveText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 10,
    textAlign: 'center' as const,
  },
  calendarContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden' as const,
  },
  calendarHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  calendarDayNames: {
    flexDirection: 'row' as const,
    marginBottom: 8,
  },
  calendarDayNameCell: {
    flex: 1,
    alignItems: 'center' as const,
  },
  calendarDayNameText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
  },
  calendarGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  calendarDayCell: {
    width: '14.28%' as any,
    aspectRatio: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 20,
  },
  calendarDayCellSelected: {
    backgroundColor: '#2E7D32',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  calendarDayTextMuted: {
    color: '#D0D0D0',
  },
  scheduleCardCourse: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginBottom: 8,
  },
  scheduleCardCourseText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
  },
  startNowBtnOuter: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  startNowBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startNowBtnText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  detailScrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  },
});
