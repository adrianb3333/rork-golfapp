import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getScreenWidth, wp } from '@/utils/responsive';

const SCREEN_WIDTH = getScreenWidth();
const WEEK_ITEM_WIDTH = wp(52);
const COACH_SUMMARIES_KEY = 'coach_analysis_summaries';

interface CoachSummary {
  id: string;
  type: 'round' | 'drill';
  text: string;
  createdAt: string;
  sourceId: string;
}

function getWeeksInYear(year: number): number {
  const dec31 = new Date(year, 11, 31);
  const dayOfWeek = dec31.getDay();
  if (dayOfWeek === 4 || (dayOfWeek === 5 && isLeapYear(year))) {
    return 53;
  }
  return 52;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getCurrentWeek(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - startOfYear.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil((diff + startOfYear.getDay() * 24 * 60 * 60 * 1000) / oneWeek);
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDayAbbrev(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

export default function PastSummariesModal() {
  const insets = useSafeAreaInsets();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedWeek, setSelectedWeek] = useState<number>(getCurrentWeek());
  const [yearPickerVisible, setYearPickerVisible] = useState<boolean>(false);
  const [allSummaries, setAllSummaries] = useState<CoachSummary[]>([]);
  const weekScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(COACH_SUMMARIES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CoachSummary[];
          setAllSummaries(parsed);
          console.log('[PastSummaries] Loaded summaries:', parsed.length);
        }
      } catch (e: any) {
        console.log('[PastSummaries] Error loading summaries:', e.message);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (weekScrollRef.current && selectedWeek > 4) {
      const scrollX = (selectedWeek - 3) * (WEEK_ITEM_WIDTH + 6);
      setTimeout(() => {
        weekScrollRef.current?.scrollTo({ x: scrollX, animated: false });
      }, 100);
    }
  }, [selectedWeek]);

  const appStartYear = 2024;
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = appStartYear; y <= currentYear; y++) {
      years.push(y);
    }
    return years.reverse();
  }, [currentYear]);

  const totalWeeks = useMemo(() => getWeeksInYear(selectedYear), [selectedYear]);

  const weeks = useMemo(() => {
    const arr: number[] = [];
    for (let i = 1; i <= totalWeeks; i++) {
      arr.push(i);
    }
    return arr;
  }, [totalWeeks]);

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setYearPickerVisible(false);
    if (year === currentYear) {
      setSelectedWeek(getCurrentWeek());
    } else {
      setSelectedWeek(1);
    }
    setSelectedDay(null);
    console.log('[PastSummaries] Selected year:', year);
  };

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

  const handleWeekSelect = (week: number) => {
    setSelectedWeek(week);
    setSelectedDay(null);
    console.log('[PastSummaries] Selected week:', week);
  };

  const handleDaySelect = useCallback((day: string) => {
    setSelectedDay((prev) => (prev === day ? null : day));
    console.log('[PastSummaries] Selected day:', day);
  }, []);

  const isCurrentWeek = (week: number) => {
    return selectedYear === currentYear && week === getCurrentWeek();
  };

  const filteredSummaries = useMemo(() => {
    return allSummaries.filter((summary) => {
      const date = new Date(summary.createdAt);
      if (date.getFullYear() !== selectedYear) return false;
      const weekNum = getISOWeekNumber(date);
      if (weekNum !== selectedWeek) return false;
      if (selectedDay) {
        const dayAbbrev = getDayAbbrev(date);
        if (dayAbbrev !== selectedDay) return false;
      }
      return true;
    });
  }, [allSummaries, selectedYear, selectedWeek, selectedDay]);

  const summariesByDay = useMemo(() => {
    const grouped: Record<string, CoachSummary[]> = {};
    for (const s of filteredSummaries) {
      const date = new Date(s.createdAt);
      const dayKey = getDayAbbrev(date);
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(s);
    }
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sorted = dayOrder
      .filter((d) => grouped[d] && grouped[d].length > 0)
      .map((d) => ({ day: d, summaries: grouped[d] }));
    return sorted;
  }, [filteredSummaries]);

  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of allSummaries) {
      const date = new Date(s.createdAt);
      if (date.getFullYear() !== selectedYear) continue;
      const weekNum = getISOWeekNumber(date);
      if (weekNum !== selectedWeek) continue;
      const dayKey = getDayAbbrev(date);
      counts[dayKey] = (counts[dayKey] || 0) + 1;
    }
    return counts;
  }, [allSummaries, selectedYear, selectedWeek]);

  const weekSummaryCount = useMemo(() => {
    return allSummaries.filter((s) => {
      const date = new Date(s.createdAt);
      return date.getFullYear() === selectedYear && getISOWeekNumber(date) === selectedWeek;
    }).length;
  }, [allSummaries, selectedYear, selectedWeek]);

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <GlassBackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Past Summaries</Text>
      </View>

      <TouchableOpacity
        style={styles.yearSelector}
        onPress={() => setYearPickerVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.yearText}>{selectedYear}</Text>
        <ChevronDown size={18} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.weeksContainer}>
        <ScrollView
          ref={weekScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weeksScroll}
        >
          {weeks.map((week) => {
            const active = selectedWeek === week;
            const current = isCurrentWeek(week);
            return (
              <TouchableOpacity
                key={week}
                onPress={() => handleWeekSelect(week)}
                activeOpacity={0.7}
                style={[
                  styles.weekItem,
                  active && styles.weekItemActive,
                ]}
              >
                <Text style={[
                  styles.weekLabel,
                  active && styles.weekLabelActive,
                ]}>
                  W{week}
                </Text>
                {current && !active && <View style={styles.currentDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.daysContainer}>
        {DAYS.map((day) => {
          const active = selectedDay === day;
          const count = dayCounts[day] || 0;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => handleDaySelect(day)}
              activeOpacity={0.7}
              style={[styles.dayItem, active && styles.dayItemActive]}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{day}</Text>
              {count > 0 && (
                <View style={[styles.dayCountBadge, active && styles.dayCountBadgeActive]}>
                  <Text style={[styles.dayCountText, active && styles.dayCountTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {weekSummaryCount > 0 && (
        <View style={styles.weekSummaryRow}>
          <Text style={styles.weekSummaryText}>
            Week {selectedWeek} — {weekSummaryCount} {weekSummaryCount === 1 ? 'analysis' : 'analyses'}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.summariesScroll}
        contentContainerStyle={styles.summariesContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredSummaries.length === 0 ? (
          <View style={styles.emptyContent}>
            <Text style={styles.emptyText}>
              {selectedDay
                ? `No analyses on ${selectedDay} this week`
                : 'No analyses for this week'}
            </Text>
          </View>
        ) : (
          summariesByDay.map(({ day, summaries }) => (
            <View key={day} style={styles.dayGroup}>
              {!selectedDay && (
                <Text style={styles.dayGroupHeader}>{day}</Text>
              )}
              {summaries.map((summary) => {
                const dateStr = new Date(summary.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <View key={summary.id} style={styles.summaryCard}>
                    <View style={styles.summaryCardHeader}>
                      <View style={[
                        styles.summaryTypeBadge,
                        summary.type === 'round' ? styles.summaryTypeBadgeRound : styles.summaryTypeBadgeDrill,
                      ]}>
                        <Text style={styles.summaryTypeBadgeText}>
                          {summary.type === 'round' ? 'Round' : 'Drill'}
                        </Text>
                      </View>
                      <Text style={styles.summaryDate}>{dateStr}</Text>
                    </View>
                    <Text style={styles.summaryText}>{summary.text}</Text>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={yearPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.yearOverlay}
          activeOpacity={1}
          onPress={() => setYearPickerVisible(false)}
        >
          <View style={styles.yearPickerCard}>
            <Text style={styles.yearPickerTitle}>Select Year</Text>
            <FlatList
              data={availableYears}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.yearOption,
                    item === selectedYear && styles.yearOptionActive,
                  ]}
                  onPress={() => handleYearSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.yearOptionText,
                    item === selectedYear && styles.yearOptionTextActive,
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.yearList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  yearSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    marginBottom: 12,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  weeksContainer: {
    height: 52,
    marginBottom: 16,
  },
  weeksScroll: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center' as const,
  },
  weekItem: {
    width: WEEK_ITEM_WIDTH,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  weekItemActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  weekLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
  },
  currentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 3,
  },
  daysContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 16,
  },
  dayItem: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dayItemActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  dayLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
  },
  dayCountBadge: {
    minWidth: 16,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  dayCountBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dayCountText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  dayCountTextActive: {
    color: '#FFFFFF',
  },
  weekSummaryRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  weekSummaryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  summariesScroll: {
    flex: 1,
  },
  summariesContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyContent: {
    paddingTop: 60,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center' as const,
  },
  dayGroup: {
    marginBottom: 16,
  },
  dayGroupHeader: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 10,
    marginLeft: 2,
  },
  summaryCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  summaryTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  summaryTypeBadgeRound: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  summaryTypeBadgeDrill: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  summaryTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  summaryDate: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    lineHeight: 21,
  },
  yearOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  yearPickerCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    width: SCREEN_WIDTH - 80,
    maxHeight: 320,
  },
  yearPickerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  yearList: {
    maxHeight: 240,
  },
  yearOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  yearOptionActive: {
    backgroundColor: '#5BBF7F',
  },
  yearOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center' as const,
  },
  yearOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
  },
});
