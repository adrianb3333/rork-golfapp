import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAY_SETUP_KEYS = [
  'play_setup_selected_players',
  'play_setup_selected_course',
  'play_setup_course_holes',
  'play_setup_course_location',
  'play_setup_hole_option',
  'play_round_private',
  'play_setup_advanced_data',
];

export type SessionType = 'play' | 'practice' | null;
export type SessionState = 'idle' | 'setup' | 'active' | 'minimized';

export type CrewSessionType = 'drill' | 'round' | 'tournament' | null;

export interface CrewSessionData {
  type: CrewSessionType;
  eventName: string;
  eventId: string;
  drillCategory?: string;
  drillRounds?: number;
  drillShotsPerRound?: number;
  drillTotalShots?: number;
  drillAcceptedDistances?: number[];
  courseName?: string;
  holeOption?: string;
  format?: string;
  totalRounds?: number;
  groups?: { id: string; players: string[] }[];
  participants?: string[];
}

export interface LastRoundData {
  totalScore: number;
  totalPar: number;
  holesPlayed: number;
  courseName: string;
  players: string[];
  roundDate: string;
  roundName: string;
  duration: string;
}

interface SessionContextValue {
  sessionType: SessionType;
  sessionState: SessionState;
  setupStep: number;
  sessionStartTime: number | null;
  roundName: string;
  roundDate: string;
  isPrivate: boolean;
  lastRound: LastRoundData | null;
  sensorsEnabled: boolean;
  showPracticeSummary: boolean;
  crewSession: CrewSessionData | null;
  crewSessionActive: boolean;
  setSensorsEnabled: (val: boolean) => void;
  startSetup: (type: 'play' | 'practice') => void;
  startBattlePractice: () => void;
  nextSetupStep: () => void;
  prevSetupStep: () => void;
  startSession: (name?: string, date?: string) => void;
  minimizeSession: () => void;
  expandSession: () => void;
  finishSession: () => void;
  finishRoundWithData: (data: LastRoundData) => void;
  quitSession: () => void;
  dismissPracticeSummary: () => void;
  startCrewSession: (data: CrewSessionData) => void;
  endCrewSession: () => void;
  minimizeCrewSession: () => void;
  expandCrewSession: () => void;
}

const LAST_ROUND_KEY = 'last_round_data';

export const [SessionProvider, useSession] = createContextHook<SessionContextValue>(() => {
  const [sessionType, setSessionType] = useState<SessionType>(null);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [setupStep, setSetupStep] = useState(1);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [roundName, setRoundName] = useState<string>('');
  const [roundDate, setRoundDate] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [lastRound, setLastRound] = useState<LastRoundData | null>(null);
  const [sensorsEnabled, setSensorsEnabled] = useState<boolean>(false);
  const [showPracticeSummary, setShowPracticeSummary] = useState<boolean>(false);
  const [crewSession, setCrewSession] = useState<CrewSessionData | null>(null);
  const [crewSessionActive, setCrewSessionActive] = useState<boolean>(false);
  const [crewSessionMinimized, setCrewSessionMinimized] = useState<boolean>(false);

  useEffect(() => {
    void AsyncStorage.getItem(LAST_ROUND_KEY).then((stored) => {
      if (stored) {
        try {
          setLastRound(JSON.parse(stored));
        } catch (e) {
          console.log('[Session] Error parsing last round:', e);
        }
      }
    });
  }, []);

  const startSetup = useCallback((type: 'play' | 'practice') => {
    console.log('Starting setup for:', type);
    setSessionType(type);
    setSessionState('setup');
    setSetupStep(1);
    if (type === 'play') {
      console.log('[Session] Clearing previous round setup data');
      AsyncStorage.multiRemove(PLAY_SETUP_KEYS).catch((e) => {
        console.log('[Session] Error clearing setup data:', e);
      });
      router.push('/play-setup/step1' as any);
    } else {
      router.push('/practice-setup/step1' as any);
    }
  }, []);

  const startBattlePractice = useCallback(() => {
    console.log('[Session] Starting battle practice session directly');
    setSessionType('practice');
    setSessionState('active');
    setSetupStep(1);
    setSessionStartTime(Date.now());
    setRoundName('Battle');
    setRoundDate(new Date().toISOString().split('T')[0]);
  }, []);

  const nextSetupStep = useCallback(() => {
    console.log('Next setup step');
    setSetupStep(prev => Math.min(prev + 1, 3));
  }, []);

  const prevSetupStep = useCallback(() => {
    console.log('Prev setup step');
    setSetupStep(prev => Math.max(prev - 1, 1));
  }, []);

  const startSession = useCallback((name?: string, date?: string) => {
    console.log('Starting session', name, date);
    setSessionState('active');
    setSetupStep(1);
    setSessionStartTime(Date.now());
    setRoundName(name || '');
    setRoundDate(date || new Date().toISOString().split('T')[0]);
  }, []);

  const minimizeSession = useCallback(() => {
    console.log('Minimizing session');
    setSessionState('minimized');
  }, []);

  const expandSession = useCallback(() => {
    console.log('Expanding session');
    setSessionState('active');
  }, []);

  const finishSession = useCallback(() => {
    console.log('Finishing session');
    setSessionType(null);
    setSessionState('idle');
    setSetupStep(1);
    setSessionStartTime(null);
    setRoundName('');
    setRoundDate('');
    setIsPrivate(false);
  }, []);

  const finishRoundWithData = useCallback((data: LastRoundData) => {
    console.log('Finishing round with data:', data);
    setLastRound(data);
    AsyncStorage.setItem(LAST_ROUND_KEY, JSON.stringify(data)).catch((e) => {
      console.log('[Session] Error saving last round:', e);
    });
    setSessionType(null);
    setSessionState('idle');
    setSetupStep(1);
    setSessionStartTime(null);
    setRoundName('');
    setRoundDate('');
    setIsPrivate(false);
  }, []);

  const quitSession = useCallback(() => {
    console.log('Quitting session, sensorsEnabled:', sensorsEnabled, 'sessionType:', sessionType);
    const wasPracticeWithSensors = sessionType === 'practice' && sensorsEnabled;
    setSessionType(null);
    setSessionState('idle');
    setSetupStep(1);
    setSessionStartTime(null);
    setRoundName('');
    setRoundDate('');
    setIsPrivate(false);
    if (wasPracticeWithSensors) {
      console.log('Showing practice summary');
      setShowPracticeSummary(true);
    } else {
      setSensorsEnabled(false);
    }
  }, [sensorsEnabled, sessionType]);

  const dismissPracticeSummary = useCallback(() => {
    console.log('Dismissing practice summary');
    setShowPracticeSummary(false);
    setSensorsEnabled(false);
  }, []);

  const startCrewSession = useCallback((data: CrewSessionData) => {
    console.log('[Session] Starting crew session:', data.type, data.eventName);
    setCrewSession(data);
    setCrewSessionActive(true);
    setCrewSessionMinimized(false);
  }, []);

  const endCrewSession = useCallback(() => {
    console.log('[Session] Ending crew session');
    setCrewSession(null);
    setCrewSessionActive(false);
    setCrewSessionMinimized(false);
  }, []);

  const minimizeCrewSession = useCallback(() => {
    console.log('[Session] Minimizing crew session');
    setCrewSessionMinimized(true);
  }, []);

  const expandCrewSession = useCallback(() => {
    console.log('[Session] Expanding crew session');
    setCrewSessionMinimized(false);
  }, []);

  return useMemo(() => ({
    sessionType,
    sessionState,
    setupStep,
    sessionStartTime,
    roundName,
    roundDate,
    isPrivate,
    lastRound,
    sensorsEnabled,
    showPracticeSummary,
    crewSession,
    crewSessionActive: crewSessionActive && !crewSessionMinimized,
    setSensorsEnabled,
    startSetup,
    startBattlePractice,
    nextSetupStep,
    prevSetupStep,
    startSession,
    minimizeSession,
    expandSession,
    finishSession,
    finishRoundWithData,
    quitSession,
    dismissPracticeSummary,
    startCrewSession,
    endCrewSession,
    minimizeCrewSession,
    expandCrewSession,
  }), [
    sessionType, sessionState, setupStep, sessionStartTime,
    roundName, roundDate, isPrivate, lastRound, sensorsEnabled,
    showPracticeSummary, crewSession, crewSessionActive, crewSessionMinimized,
    setSensorsEnabled, startSetup, startBattlePractice, nextSetupStep,
    prevSetupStep, startSession, minimizeSession, expandSession,
    finishSession, finishRoundWithData, quitSession, dismissPracticeSummary,
    startCrewSession, endCrewSession, minimizeCrewSession, expandCrewSession,
  ]);
});
