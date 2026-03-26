import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Flame } from 'lucide-react-native';
import type { ScheduledItem } from './CreateScheduleScreen';

interface CalendarScreenProps {
  onBack: () => void;
  scheduledItems: ScheduledItem[];
  completedItems: string[];
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function getDayName(date: Date): string {
  return DAY_NAMES_SHORT[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function CalendarScreen({ onBack, scheduledItems, completedItems }: CalendarScreenProps) {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);

  const monday = useMemo(() => {
    const m = getMonday(today);
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [today, weekOffset]);

  const weekDays = useMemo(() => getWeekDays(monday), [monday]);

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekLabel = `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getDate()}`;

  const selectedDayName = getDayName(selectedDate);

  const todaysSchedule = useMemo(() => {
    return scheduledItems.filter(item => item.days.includes(selectedDayName));
  }, [scheduledItems, selectedDayName]);

  const hasScheduleForDay = (date: Date): boolean => {
    const dayName = getDayName(date);
    return scheduledItems.some(item => item.days.includes(dayName));
  };

  const last3DaysActivity = useMemo(() => {
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    return completedItems;
  }, [today, completedItems]);

  return (
    <LinearGradient
      colors={['#0059B2', '#1075E3', '#1C8CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
        >
          <View style={styles.backCircle}>
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={() => setWeekOffset(prev => prev - 1)} activeOpacity={0.7}>
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.weekLabel}>{weekLabel}</Text>
          <TouchableOpacity onPress={() => setWeekOffset(prev => prev + 1)} activeOpacity={0.7}>
            <ChevronRight size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.daysRow}>
          {weekDays.map((date, idx) => {
            const isSelected = isSameDay(date, selectedDate);
            const hasSchedule = hasScheduleForDay(date);
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                ]}
                onPress={() => setSelectedDate(date)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                  {DAY_NAMES_SHORT[idx]}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                  {date.getDate()}
                </Text>
                {hasSchedule && (
                  <View style={[styles.scheduleDot, isSelected && styles.scheduleDotSelected]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
          </View>
          {todaysSchedule.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No drills scheduled for this day</Text>
            </View>
          ) : (
            todaysSchedule.map((item) => (
              <View key={item.id} style={styles.scheduleCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scheduleCardGradient}
                >
                  <View style={styles.scheduleCardInner}>
                    <View style={styles.scheduleCardContent}>
                      <Text style={styles.scheduleItemName}>{item.itemName}</Text>
                      <Text style={styles.scheduleItemType}>
                        {item.type === 'drill' ? 'Drill' : 'Session'} · {item.days.join(', ')}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Flame size={18} color="#FF8C32" />
            <Text style={styles.sectionTitle}>Last 3 Days Activity</Text>
          </View>
          {last3DaysActivity.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No completed drills in the last 3 days</Text>
            </View>
          ) : (
            last3DaysActivity.map((name, idx) => (
              <View key={idx} style={styles.activityCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scheduleCardGradient}
                >
                  <View style={styles.scheduleCardInner}>
                    <Text style={styles.scheduleItemName}>{name}</Text>
                  </View>
                </LinearGradient>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  weekNav: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  weekLabel: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  daysRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 28,
    gap: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  dayCellSelected: {
    backgroundColor: '#2E7D32',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  scheduleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  scheduleDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  scheduleCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    marginBottom: 8,
  },
  activityCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    marginBottom: 8,
  },
  scheduleCardGradient: {
    borderRadius: 16,
  },
  scheduleCardInner: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  scheduleCardContent: {
    flex: 1,
    gap: 4,
  },
  scheduleItemName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  scheduleItemType: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
  },
});
