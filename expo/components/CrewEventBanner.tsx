import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarDays, Trophy, Target } from 'lucide-react-native';
import { useProfile, ScheduledDrill, ScheduledRound, ScheduledTournament } from '@/contexts/ProfileContext';
import { useSession, CrewSessionData } from '@/contexts/SessionContext';
import * as Haptics from 'expo-haptics';

interface UpcomingEvent {
  id: string;
  type: 'drill' | 'round' | 'tournament';
  name: string;
  date: string;
  time: string;
  startMs: number;
  drillId?: string;
  roundId?: string;
  tournamentId?: string;
  courseName?: string;
  holeOption?: string;
  format?: string;
  totalRounds?: number;
  groups?: { id: string; players: string[] }[];
  info?: string;
}

function parseDateTime(dateStr: string, timeStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours || 0, minutes || 0).getTime();
}

export default function CrewEventBanner() {
  const insets = useSafeAreaInsets();
  const {
    crewScheduled, crewScheduledRounds, crewScheduledTournaments,
    crewDrills, crewPlayers, crewManagers, crewRole,
    userId,
  } = useProfile();
  const { startCrewSession, crewSession } = useSession();
  const slideAnim = useRef(new Animated.Value(-250)).current;
  const [dismissed, setDismissed] = React.useState<string[]>([]);
  const [now, setNow] = React.useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const upcomingEvent = useMemo<UpcomingEvent | null>(() => {
    if (!crewRole) return null;
    const fiveMinMs = 5 * 60 * 1000;
    const events: UpcomingEvent[] = [];

    (crewScheduled ?? []).forEach((s: ScheduledDrill) => {
      const startMs = parseDateTime(s.date, s.time);
      if (startMs - now <= fiveMinMs && startMs - now > -60 * 60 * 1000 && !dismissed.includes(s.id)) {
        const drill = crewDrills.find((d) => d.id === s.drillId);
        events.push({
          id: s.id,
          type: 'drill',
          name: s.drillName,
          date: s.date,
          time: s.time,
          startMs,
          drillId: s.drillId,
          info: drill?.info,
        });
      }
    });

    (crewScheduledRounds ?? []).forEach((s: ScheduledRound) => {
      const startMs = parseDateTime(s.date, s.time);
      if (startMs - now <= fiveMinMs && startMs - now > -60 * 60 * 1000 && !dismissed.includes(s.id)) {
        const isParticipant = !s.groups || s.groups.some((g) =>
          g.players.includes(userId ?? '')
        );
        if (isParticipant || crewRole === 'leader' || crewRole === 'manager') {
          events.push({
            id: s.id,
            type: 'round',
            name: s.roundName,
            date: s.date,
            time: s.time,
            startMs,
            roundId: s.roundId,
            courseName: s.courseName,
            holeOption: s.holeOption,
            groups: s.groups,
            info: s.info,
          });
        }
      }
    });

    (crewScheduledTournaments ?? []).forEach((s: ScheduledTournament) => {
      const startMs = parseDateTime(s.date, s.time);
      if (startMs - now <= fiveMinMs && startMs - now > -60 * 60 * 1000 && !dismissed.includes(s.id)) {
        const isParticipant = !s.groups || s.groups.some((g) =>
          g.players.includes(userId ?? '')
        );
        if (isParticipant || crewRole === 'leader' || crewRole === 'manager') {
          events.push({
            id: s.id,
            type: 'tournament',
            name: s.tournamentName,
            date: s.date,
            time: s.time,
            startMs,
            tournamentId: s.tournamentId,
            courseName: s.courseName,
            holeOption: s.holeOption,
            format: s.format,
            totalRounds: s.totalRounds,
            groups: s.groups,
            info: s.info,
          });
        }
      }
    });

    events.sort((a, b) => a.startMs - b.startMs);
    return events.length > 0 ? events[0] : null;
  }, [crewScheduled, crewScheduledRounds, crewScheduledTournaments, crewDrills, crewRole, userId, now, dismissed]);

  useEffect(() => {
    if (upcomingEvent && !crewSession) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 12,
        tension: 65,
      }).start();
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Animated.timing(slideAnim, {
        toValue: -250,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [upcomingEvent, crewSession, slideAnim]);

  const handleCancel = useCallback(() => {
    if (!upcomingEvent) return;
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDismissed((prev) => [...prev, upcomingEvent.id]);
  }, [upcomingEvent]);

  const handleJoin = useCallback(() => {
    if (!upcomingEvent) return;
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const allParticipants: string[] = [];
    if (upcomingEvent.type === 'drill') {
      [...(crewPlayers ?? []), ...(crewManagers ?? [])].forEach((id) => {
        if (!allParticipants.includes(id)) allParticipants.push(id);
      });
      if (userId && !allParticipants.includes(userId)) allParticipants.push(userId);
    } else {
      (upcomingEvent.groups ?? []).forEach((g) => {
        g.players.forEach((pid) => {
          if (!allParticipants.includes(pid)) allParticipants.push(pid);
        });
      });
    }

    const drill = upcomingEvent.drillId ? crewDrills.find((d) => d.id === upcomingEvent.drillId) : null;

    const sessionData: CrewSessionData = {
      type: upcomingEvent.type,
      eventName: upcomingEvent.name,
      eventId: upcomingEvent.id,
      drillCategory: drill?.category,
      drillRounds: drill?.rounds,
      drillShotsPerRound: drill?.shotsPerRound,
      drillTotalShots: drill?.totalShots,
      drillAcceptedDistances: drill?.acceptedDistances,
      courseName: upcomingEvent.courseName,
      holeOption: upcomingEvent.holeOption,
      format: upcomingEvent.format,
      totalRounds: upcomingEvent.totalRounds,
      groups: upcomingEvent.groups,
      participants: allParticipants,
    };

    console.log('[CrewEventBanner] Starting crew session:', sessionData.type, sessionData.eventName);
    startCrewSession(sessionData);
    setDismissed((prev) => [...prev, upcomingEvent.id]);
  }, [upcomingEvent, crewDrills, crewPlayers, crewManagers, userId, startCrewSession]);

  if (!upcomingEvent || crewSession) return null;

  const eventIcon = upcomingEvent.type === 'drill' ? Target
    : upcomingEvent.type === 'tournament' ? Trophy
    : CalendarDays;
  const EventIcon = eventIcon;

  const typeLabel = upcomingEvent.type === 'drill' ? 'Drill'
    : upcomingEvent.type === 'round' ? 'Round'
    : 'Tournament';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#1C8CFF', '#1075E3', '#0059B2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bannerCard}
      >
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <EventIcon size={20} color="#FFFFFF" />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.headerText}>Crew {typeLabel}</Text>
            <Text style={styles.fromText} numberOfLines={1}>
              {upcomingEvent.name} · {upcomingEvent.time}
            </Text>
          </View>
        </View>

        {upcomingEvent.courseName ? (
          <Text style={styles.detailsText} numberOfLines={1}>
            {upcomingEvent.courseName}
          </Text>
        ) : null}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF1C1C', '#E31010', '#B20000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={handleJoin}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Join</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  bannerCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  topRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  textBlock: {
    flex: 1,
  },
  headerText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  fromText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  acceptBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  btnGradient: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
