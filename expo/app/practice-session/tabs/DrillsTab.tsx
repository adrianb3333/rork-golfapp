import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, Layers, CalendarDays, Swords, Dumbbell, ChevronRight, Clock as ClockIcon, ChevronDown, Trash2, BarChart3 } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Clock from "@/components/ovningar/Clock";
import Gate from "@/components/ovningar/Gate";
import Ladder from "@/components/ovningar/Ladder";
import Challenge27 from "@/components/ovningar/Challange27";
import Bunker from "@/components/ovningar/Bunker";
import Cirkel from "@/components/ovningar/Cirkel";
import W5_30m from "@/components/ovningar/W5-30m";
import AreaTowel from "@/components/ovningar/AreaTowel";
import Box9 from "@/components/ovningar/Box9";
import MrRoutine from "@/components/ovningar/MrRoutine";
import DistanceControl from "@/components/ovningar/DistanceControl";
import Pause from "@/components/ovningar/Pause";
import PowerLine from "@/components/ovningar/PowerLine";
import Fade from "@/components/ovningar/Fade";
import Accuracy from "@/components/ovningar/Accuracy";
import Draw from "@/components/ovningar/Draw";
import CreateDrillScreen, { CustomDrill } from "@/components/drills/CreateDrillScreen";
import CreateSessionScreen, { CustomSession } from "@/components/drills/CreateSessionScreen";
import CreateScheduleScreen, { ScheduledItem } from "@/components/drills/CreateScheduleScreen";
import CalendarScreen from "@/components/drills/CalendarScreen";
import CreateSensorDrillScreen, { SensorDrill } from "@/components/drills/CreateSensorDrillScreen";
import BattleScreen from "@/components/drills/BattleScreen";
import BattleDrillScreen from "@/components/drills/BattleDrillScreen";
import BattleSummaryScreen from "@/components/drills/BattleSummaryScreen";
import { useBattle } from "@/contexts/BattleContext";
import DrillHistoryScreen, { DrillHistoryEntry } from "@/components/drills/DrillHistoryScreen";
import DrillOverviewScreen from "@/components/drills/DrillOverviewScreen";
import ActiveDrillScreen, { DrillResult } from "@/components/drills/ActiveDrillScreen";
import DrillSummaryScreen from "@/components/drills/DrillSummaryScreen";
import { Star } from "lucide-react-native";
import { useSensor } from '@/contexts/SensorContext';
import SensorLockOverlay from '@/components/SensorLockOverlay';
import { saveDrillResult, fetchDrillHistory } from '@/services/drillResultsService';
import DrillProgressScreen from '@/components/drills/DrillProgressScreen';

interface DrillsTabProps {
  onDrillActiveChange?: (active: boolean) => void;
  onMinimize?: () => void;
  onRequestSetPin?: (onPinDone: () => void) => void;
  onNavigateToTab?: (tab: 'flight' | 'position') => void;
  onClearPin?: () => void;
}

const dedicatedComponents = [
  "The Clock", "The Gate", "The Ladder", "27 Challenge",
  "Bunker", "Cirkel", "5-30m", "Area Towel",
  "9 box", "Mr Routine", "Distance control", "Pause",
  "Power Line", "Fade", "Accuracy", "Draw",
];

const CATEGORY_COLORS: Record<string, string> = {
  Putting: '#2D6A4F',
  Wedges: '#E76F51',
  Irons: '#7B2CBF',
  Woods: '#40916C',
  Driver: '#1B5E20',
};

const CATEGORY_ORDER = ['Putting', 'Wedges', 'Irons', 'Driver', 'Woods'];

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STORAGE_KEYS = {
  DRILLS: '@drills_saved',
  SENSOR_DRILLS: '@sensor_drills_saved',
  SESSIONS: '@sessions_saved',
  SCHEDULED: '@scheduled_items',
  HISTORY: '@drill_history',
} as const;

function getTodayDayName(): string {
  const now = new Date();
  const dayIndex = now.getDay();
  return DAY_NAMES_SHORT[dayIndex];
}

type DrillItem = CustomDrill | SensorDrill;

type ScreenState =
  | 'main'
  | 'createDrill'
  | 'createSession'
  | 'createSchedule'
  | 'calendar'
  | 'createSensorDrill'
  | 'battle'
  | 'battleDrill'
  | 'battleSummary'
  | 'history'
  | 'drillOverview'
  | 'activeDrill'
  | 'drillSummary'
  | 'progressChart';

export default function DrillsTab({ onDrillActiveChange, onMinimize, onRequestSetPin, onNavigateToTab, onClearPin }: DrillsTabProps) {
  const { isPaired: sensorsPaired } = useSensor();
  const { activeBattle, completeBattle, clearActiveBattle } = useBattle();
  const [battleUserScores, setBattleUserScores] = useState<number[]>([]);
  const [battleOppScores, setBattleOppScores] = useState<number[]>([]);
  const [savedBattleInfo, setSavedBattleInfo] = useState<typeof activeBattle>(null);
  const [selectedDrill, setSelectedDrill] = useState<{ category: string; card: string } | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('main');
  const [savedDrills, setSavedDrills] = useState<CustomDrill[]>([]);
  const [savedSensorDrills, setSavedSensorDrills] = useState<SensorDrill[]>([]);
  const [savedSessions, setSavedSessions] = useState<CustomSession[]>([]);
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const [drillHistory, setDrillHistory] = useState<DrillHistoryEntry[]>([]);
  const [activeDrillItem, setActiveDrillItem] = useState<DrillItem | null>(null);
  const [lastDrillResult, setLastDrillResult] = useState<DrillResult | null>(null);
  const [_dataLoaded, setDataLoaded] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [drillsRaw, sensorRaw, sessionsRaw, scheduledRaw, historyRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DRILLS),
          AsyncStorage.getItem(STORAGE_KEYS.SENSOR_DRILLS),
          AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
          AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED),
          AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
        ]);
        if (drillsRaw) setSavedDrills(JSON.parse(drillsRaw));
        if (sensorRaw) setSavedSensorDrills(JSON.parse(sensorRaw));
        if (sessionsRaw) setSavedSessions(JSON.parse(sessionsRaw));
        if (scheduledRaw) setScheduledItems(JSON.parse(scheduledRaw));

        const localHistory: DrillHistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];

        try {
          const supabaseRows = await fetchDrillHistory();
          if (supabaseRows.length > 0) {
            const supabaseEntries: DrillHistoryEntry[] = supabaseRows.map(row => ({
              id: row.id,
              drillName: row.drill_name,
              date: new Date(row.completed_at).getTime(),
              rounds: row.rounds,
              targetsPerRound: row.targets_per_round,
              roundScores: row.round_scores,
              totalHits: row.total_hits,
              totalShots: row.total_shots,
              percentage: row.percentage,
            }));
            const existingIds = new Set(supabaseEntries.map(e => e.id));
            const localOnly = localHistory.filter(e => !existingIds.has(e.id));
            const merged = [...supabaseEntries, ...localOnly];
            setDrillHistory(merged);
            console.log('Drill history loaded from Supabase:', supabaseEntries.length, '+ local-only:', localOnly.length);
          } else {
            setDrillHistory(localHistory);
            console.log('No Supabase history, using local:', localHistory.length);
          }
        } catch (sbErr) {
          console.log('Supabase history fetch failed, using local:', sbErr);
          setDrillHistory(localHistory);
        }

        console.log('Drill data loaded from storage');
      } catch (e) {
        console.log('Error loading drill data:', e);
      }
      setDataLoaded(true);
    };
    void loadData();
  }, []);

  const persistDrills = useCallback(async (drills: CustomDrill[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEYS.DRILLS, JSON.stringify(drills)); } catch (e) { console.log('Error saving drills:', e); }
  }, []);

  const persistSensorDrills = useCallback(async (drills: SensorDrill[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEYS.SENSOR_DRILLS, JSON.stringify(drills)); } catch (e) { console.log('Error saving sensor drills:', e); }
  }, []);

  const persistSessions = useCallback(async (sessions: CustomSession[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions)); } catch (e) { console.log('Error saving sessions:', e); }
  }, []);

  const persistScheduled = useCallback(async (items: ScheduledItem[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED, JSON.stringify(items)); } catch (e) { console.log('Error saving scheduled:', e); }
  }, []);

  const persistHistory = useCallback(async (history: DrillHistoryEntry[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)); } catch (e) { console.log('Error saving history:', e); }
  }, []);

  const todayName = getTodayDayName();

  const todaysSchedule = useMemo(() => {
    return scheduledItems.filter(item => item.days.includes(todayName));
  }, [scheduledItems, todayName]);

  const handleBack = () => {
    setSelectedDrill(null);
    onDrillActiveChange?.(false);
  };

  const handleSaveDrill = useCallback((drill: CustomDrill) => {
    console.log('Saving drill:', drill);
    const updated = [...savedDrills, drill];
    setSavedDrills(updated);
    void persistDrills(updated);
    setCurrentScreen('main');
  }, [savedDrills, persistDrills]);

  const handleSaveSensorDrill = useCallback((drill: SensorDrill) => {
    console.log('Saving sensor drill:', drill);
    const updated = [...savedSensorDrills, drill];
    setSavedSensorDrills(updated);
    void persistSensorDrills(updated);
    setCurrentScreen('main');
  }, [savedSensorDrills, persistSensorDrills]);

  const handleSaveSession = useCallback((session: CustomSession) => {
    console.log('Saving session:', session);
    const updated = [...savedSessions, session];
    setSavedSessions(updated);
    void persistSessions(updated);
    setCurrentScreen('main');
  }, [savedSessions, persistSessions]);

  const handleSaveSchedule = useCallback((item: ScheduledItem) => {
    console.log('Saving schedule:', item);
    const updated = [...scheduledItems, item];
    setScheduledItems(updated);
    void persistScheduled(updated);
    setCurrentScreen('main');
  }, [scheduledItems, persistScheduled]);

  const handleDrillCardPress = useCallback((drill: DrillItem) => {
    console.log('Opening drill overview:', drill.name);
    setActiveDrillItem(drill);
    setCurrentScreen('drillOverview');
    onDrillActiveChange?.(true);
  }, [onDrillActiveChange]);

  const handleStartDrill = useCallback(() => {
    console.log('Starting drill:', activeDrillItem?.name);
    setCurrentScreen('activeDrill');
    onDrillActiveChange?.(true);
  }, [activeDrillItem, onDrillActiveChange]);

  const handleFinishDrill = useCallback((result: DrillResult) => {
    console.log('Drill finished:', result);
    setLastDrillResult(result);
    setCurrentScreen('drillSummary');
    onDrillActiveChange?.(true);

    if (activeDrillItem) {
      const isSensor = 'isSensorDrill' in activeDrillItem && activeDrillItem.isSensorDrill === true;

      const entry: DrillHistoryEntry = {
        id: Date.now().toString(),
        drillName: activeDrillItem.name,
        date: Date.now(),
        rounds: activeDrillItem.rounds,
        targetsPerRound: activeDrillItem.targetsPerRound,
        roundScores: result.roundScores,
        totalHits: result.totalHits,
        totalShots: result.totalShots,
        percentage: result.percentage,
      };
      const updatedHistory = [...drillHistory, entry];
      setDrillHistory(updatedHistory);
      void persistHistory(updatedHistory);
      console.log('History entry saved locally, total shots:', result.totalShots);

      void saveDrillResult({
        drillName: activeDrillItem.name,
        category: activeDrillItem.category,
        isSensorDrill: isSensor,
        rounds: activeDrillItem.rounds,
        targetsPerRound: activeDrillItem.targetsPerRound,
        totalShots: result.totalShots,
        roundScores: result.roundScores,
        totalHits: result.totalHits,
        percentage: result.percentage,
      });
    }
  }, [activeDrillItem, drillHistory, persistHistory, onDrillActiveChange]);

  const handleRetryDrill = useCallback(() => {
    console.log('Retrying drill:', activeDrillItem?.name);
    setLastDrillResult(null);
    setCurrentScreen('activeDrill');
    onDrillActiveChange?.(true);
  }, [activeDrillItem?.name, onDrillActiveChange]);

  const handleDrillHome = useCallback(() => {
    console.log('Going back to drills home');
    setActiveDrillItem(null);
    setLastDrillResult(null);
    setCurrentScreen('main');
    onDrillActiveChange?.(false);
  }, [onDrillActiveChange]);

  const toggleDeleteMode = useCallback(() => {
    if (isDeleteMode) {
      setIsDeleteMode(false);
      setSelectedForDelete(new Set());
    } else {
      setIsDeleteMode(true);
      setSelectedForDelete(new Set());
    }
  }, [isDeleteMode]);

  const toggleDrillForDelete = useCallback((drillId: string) => {
    setSelectedForDelete(prev => {
      const next = new Set(prev);
      if (next.has(drillId)) {
        next.delete(drillId);
      } else {
        next.add(drillId);
      }
      return next;
    });
  }, []);

  const handleDeleteConfirmed = useCallback(() => {
    console.log('Deleting drills:', Array.from(selectedForDelete));
    const updatedDrills = savedDrills.filter(d => !selectedForDelete.has(d.id));
    setSavedDrills(updatedDrills);
    void persistDrills(updatedDrills);

    const updatedSensorDrills = savedSensorDrills.filter(d => !selectedForDelete.has(d.id));
    setSavedSensorDrills(updatedSensorDrills);
    void persistSensorDrills(updatedSensorDrills);

    setShowDeleteConfirm(false);
    setIsDeleteMode(false);
    setSelectedForDelete(new Set());
  }, [selectedForDelete, savedDrills, savedSensorDrills, persistDrills, persistSensorDrills]);

  const handleBattleSetPin = useCallback((onPinDone: () => void) => {
    console.log('[DrillsTab] Battle requests Set Pin - navigating to Position');
    onClearPin?.();
    if (onRequestSetPin) {
      onRequestSetPin(() => {
        console.log('[DrillsTab] Pin set from Position tab for battle');
        onPinDone();
        setCurrentScreen('battle');
      });
    } else {
      onPinDone();
    }
  }, [onRequestSetPin, onClearPin]);

  const handleSetPin = useCallback(() => {
    console.log('Set Pin pressed - clearing old pin and navigating to Position tab');
    onClearPin?.();
    if (onRequestSetPin) {
      onRequestSetPin(() => {
        console.log('Pin set from Position tab - returning to drill and auto-starting');
        if (activeDrillItem) {
          setCurrentScreen('activeDrill');
          onDrillActiveChange?.(true);
        }
      });
    }
  }, [onRequestSetPin, onClearPin, activeDrillItem, onDrillActiveChange]);

  const drillsByCategory = useMemo(() => {
    const grouped = savedDrills.reduce<Record<string, CustomDrill[]>>((acc, drill) => {
      if (!acc[drill.category]) {
        acc[drill.category] = [];
      }
      acc[drill.category].push(drill);
      return acc;
    }, {});
    return grouped;
  }, [savedDrills]);

  const orderedCategories = useMemo(() => {
    const keys = Object.keys(drillsByCategory);
    return CATEGORY_ORDER.filter(cat => keys.includes(cat)).concat(
      keys.filter(cat => !CATEGORY_ORDER.includes(cat))
    );
  }, [drillsByCategory]);

  const HEADER_HEIGHT = 60;
  const scrollYRef = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const isHeaderVisible = useRef(true);

  const onMainScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - scrollYRef.current;

    if (currentY <= 0) {
      if (!isHeaderVisible.current) {
        isHeaderVisible.current = true;
        Animated.spring(headerTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 20,
          tension: 80,
        }).start();
      }
    } else if (diff > 10 && isHeaderVisible.current) {
      isHeaderVisible.current = false;
      Animated.timing(headerTranslateY, {
        toValue: -(HEADER_HEIGHT + insets.top + 20),
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (diff < -3 && !isHeaderVisible.current) {
      isHeaderVisible.current = true;
      Animated.spring(headerTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 20,
        tension: 80,
      }).start();
    }

    scrollYRef.current = currentY;
  }, [headerTranslateY, insets.top]);

  const renderDrillComponent = () => {
    if (!selectedDrill) return null;
    switch (selectedDrill.card) {
      case "The Clock": return <Clock onBack={handleBack} drillName="The Clock" />;
      case "The Gate": return <Gate onBack={handleBack} drillName="The Gate" />;
      case "The Ladder": return <Ladder onBack={handleBack} drillName="The Ladder" />;
      case "27 Challenge": return <Challenge27 onBack={handleBack} />;
      case "Bunker": return <Bunker onBack={handleBack} drillName="Bunker Pro" />;
      case "Cirkel": return <Cirkel onBack={handleBack} drillName="The Cirkel" />;
      case "5-30m": return <W5_30m onBack={handleBack} drillName="Wedge 5-30m" />;
      case "Area Towel": return <AreaTowel onBack={handleBack} drillName="Area Towel Drill" />;
      case "9 box": return <Box9 onBack={handleBack} drillName="9 Box" />;
      case "Mr Routine": return <MrRoutine onBack={handleBack} drillName="My Routine" />;
      case "Distance control": return <DistanceControl onBack={handleBack} drillName="Distance Control" />;
      case "Pause": return <Pause onBack={handleBack} drillName="Pause Drill" />;
      case "Power Line": return <PowerLine onBack={handleBack} drillName="Power Line" />;
      case "Fade": return <Fade onBack={handleBack} drillName="The Fade" />;
      case "Accuracy": return <Accuracy onBack={handleBack} drillName="Accuracy" />;
      case "Draw": return <Draw onBack={handleBack} drillName="The Draw" />;
      default: return null;
    }
  };

  const hasDedicatedComponent = dedicatedComponents.includes(selectedDrill?.card || "");

  if (selectedDrill && hasDedicatedComponent) {
    return (
      <View style={styles.drillWrapper}>
        {renderDrillComponent()}
      </View>
    );
  }

  if (currentScreen === 'drillOverview' && activeDrillItem) {
    return (
      <DrillOverviewScreen
        drill={activeDrillItem}
        onCancel={handleDrillHome}
        onStart={handleStartDrill}
        onSetPin={handleSetPin}
      />
    );
  }

  if (currentScreen === 'activeDrill' && activeDrillItem) {
    return (
      <ActiveDrillScreen
        drill={activeDrillItem}
        onBack={() => {
          setCurrentScreen('drillOverview');
          onDrillActiveChange?.(false);
        }}
        onFinish={handleFinishDrill}
        onNavigateToTab={onNavigateToTab}
      />
    );
  }

  if (currentScreen === 'drillSummary' && activeDrillItem && lastDrillResult) {
    return (
      <DrillSummaryScreen
        drill={activeDrillItem}
        result={lastDrillResult}
        onRetry={handleRetryDrill}
        onHome={handleDrillHome}
      />
    );
  }

  if (currentScreen === 'createDrill') {
    return (
      <CreateDrillScreen
        onBack={() => setCurrentScreen('main')}
        onSave={handleSaveDrill}
      />
    );
  }

  if (currentScreen === 'createSession') {
    return (
      <CreateSessionScreen
        onBack={() => setCurrentScreen('main')}
        onSave={handleSaveSession}
        drills={savedDrills}
      />
    );
  }

  if (currentScreen === 'createSchedule') {
    return (
      <CreateScheduleScreen
        onBack={() => setCurrentScreen('main')}
        onSave={handleSaveSchedule}
        drills={savedDrills}
        sessions={savedSessions}
      />
    );
  }

  if (currentScreen === 'calendar') {
    return (
      <CalendarScreen
        onBack={() => setCurrentScreen('main')}
        scheduledItems={scheduledItems}
        completedItems={[]}
      />
    );
  }

  if (currentScreen === 'createSensorDrill') {
    return (
      <CreateSensorDrillScreen
        onBack={() => setCurrentScreen('main')}
        onSave={handleSaveSensorDrill}
      />
    );
  }

  if (currentScreen === 'battle') {
    return (
      <BattleScreen
        onBack={() => setCurrentScreen('main')}
        onBattleStart={() => {
          console.log('[DrillsTab] Battle started, switching to battleDrill');
          setCurrentScreen('battleDrill');
          onDrillActiveChange?.(true);
        }}
        onRequestSetPin={handleBattleSetPin}
      />
    );
  }

  if (currentScreen === 'battleDrill' && activeBattle) {
    return (
      <BattleDrillScreen
        battle={activeBattle}
        onBack={() => {
          setCurrentScreen('main');
          onDrillActiveChange?.(false);
          void clearActiveBattle();
        }}
        onFinish={(userScores, oppScores) => {
          console.log('[DrillsTab] Battle drill finished');
          setBattleUserScores(userScores);
          setBattleOppScores(oppScores);
          setSavedBattleInfo(activeBattle ? { ...activeBattle } : null);
          void completeBattle({ userRoundScores: userScores, opponentRoundScores: oppScores });
          setCurrentScreen('battleSummary');
        }}
        onNavigateToTab={onNavigateToTab}
      />
    );
  }

  if (currentScreen === 'battleSummary') {
    const info = savedBattleInfo ?? activeBattle;
    const battleForSummary = info ?? {
      id: 'summary',
      battle_name: 'Battle',
      opponent_id: '',
      opponent_username: '',
      opponent_display_name: 'Opponent',
      opponent_avatar_url: null,
      rounds: battleUserScores.length,
      shots_per_round: battleUserScores.length > 0 ? Math.max(...battleUserScores, 1) : 10,
    };
    return (
      <BattleSummaryScreen
        battle={battleForSummary}
        userRoundScores={battleUserScores}
        opponentRoundScores={battleOppScores}
        onRetry={() => {
          setBattleUserScores([]);
          setBattleOppScores([]);
          setSavedBattleInfo(null);
          setCurrentScreen('battleDrill');
          onDrillActiveChange?.(true);
        }}
        onHome={() => {
          setBattleUserScores([]);
          setBattleOppScores([]);
          setSavedBattleInfo(null);
          setCurrentScreen('main');
          onDrillActiveChange?.(false);
        }}
      />
    );
  }

  if (currentScreen === 'history') {
    return (
      <DrillHistoryScreen
        onBack={() => setCurrentScreen('main')}
        history={drillHistory}
      />
    );
  }

  if (currentScreen === 'progressChart') {
    return (
      <DrillProgressScreen
        onBack={() => setCurrentScreen('main')}
        drills={savedDrills}
        sensorDrills={savedSensorDrills}
        history={drillHistory}
      />
    );
  }

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#0059B2', '#1075E3', '#1C8CFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + HEADER_HEIGHT + 8 }]}
          showsVerticalScrollIndicator={false}
          onScroll={onMainScroll}
          scrollEventThrottle={16}
        >
          {todaysSchedule.length > 0 && (
            <View style={styles.todaySection}>
              <View style={styles.todaySectionHeader}>
                <ClockIcon size={16} color="#FFFFFF" />
                <Text style={styles.todaySectionTitle}>Today's Schedule</Text>
              </View>
              {todaysSchedule.map((item) => (
                <View key={item.id} style={styles.todayCard}>
                  <LinearGradient
                    colors={['rgba(46,125,50,0.35)', 'rgba(46,125,50,0.18)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.todayCardGradient}
                  >
                    <View style={styles.todayCardInner}>
                      <View style={styles.todayCardContent}>
                        <Text style={styles.todayCardName}>{item.itemName}</Text>
                        <Text style={styles.todayCardType}>
                          {item.type === 'drill' ? 'Drill' : 'Session'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </View>
          )}

          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.topCard}
              activeOpacity={0.7}
              onPress={() => setCurrentScreen('createDrill')}
            >
              <View style={styles.topIconCircle}>
                <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.topCardLabel}>New Drill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topCard}
              activeOpacity={0.7}
              onPress={() => setCurrentScreen('createSession')}
            >
              <View style={[styles.topIconCircle, { backgroundColor: 'rgba(255,140,50,0.25)' }]}>
                <Layers size={22} color="#FF8C32" />
              </View>
              <Text style={styles.topCardLabel}>New Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topCard}
              activeOpacity={0.7}
              onPress={() => setCurrentScreen('createSchedule')}
            >
              <View style={[styles.topIconCircle, { backgroundColor: 'rgba(80,160,255,0.25)' }]}>
                <CalendarDays size={22} color="#50A0FF" />
              </View>
              <Text style={styles.topCardLabel}>Schedule</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sensorRow}>
            <TouchableOpacity
              style={styles.sensorCard}
              activeOpacity={0.7}
              onPress={() => sensorsPaired ? setCurrentScreen('createSensorDrill') : undefined}
            >
              {!sensorsPaired && <SensorLockOverlay compact />}
              <Text style={styles.sensorLabel}>SENSORS NEEDED</Text>
              <View style={styles.sensorIconCircle}>
                <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.sensorCardTitle}>New Sensor Drill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sensorCard}
              activeOpacity={0.7}
              onPress={() => sensorsPaired ? setCurrentScreen('battle') : undefined}
            >
              {!sensorsPaired && <SensorLockOverlay compact />}
              <Text style={styles.sensorLabel}>SENSORS NEEDED</Text>
              <View style={[styles.sensorIconCircle, { backgroundColor: 'rgba(230,57,70,0.2)' }]}>
                <Swords size={20} color="#E63946" />
              </View>
              <Text style={styles.sensorCardTitle}>Battle</Text>
            </TouchableOpacity>
          </View>

          {savedSensorDrills.length > 0 && (
            <View style={styles.categorySection}>
              <View style={styles.categoryHeaderRow}>
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text style={styles.categoryTitle}>Sensor Drills</Text>
              </View>
              {savedSensorDrills.map((drill) => {
                const isSelectedForDel = selectedForDelete.has(drill.id);
                return (
                  <TouchableOpacity
                    key={drill.id}
                    style={[styles.drillCard, isDeleteMode && isSelectedForDel && styles.drillCardDeleteSelected]}
                    activeOpacity={0.7}
                    onPress={() => isDeleteMode ? toggleDrillForDelete(drill.id) : handleDrillCardPress(drill)}
                  >
                    <LinearGradient
                      colors={['rgba(255,215,0,0.18)', 'rgba(255,215,0,0.06)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.drillCardGradient}
                    >
                      <View style={styles.drillCardInner}>
                        {isDeleteMode && (
                          <View style={[styles.deleteCheckbox, isSelectedForDel && styles.deleteCheckboxActive]}>
                            {isSelectedForDel && <View style={styles.deleteCheckboxDot} />}
                          </View>
                        )}
                        <View style={styles.drillCardContent}>
                          <View style={styles.sensorDrillNameRow}>
                            <Star size={14} color="#FFD700" fill="#FFD700" />
                            <Text style={styles.drillCardName}>{drill.name}</Text>
                          </View>
                          <Text style={styles.drillCardMeta}>
                            {drill.category} · {drill.rounds} rounds · {drill.targetsPerRound} targets · {drill.totalShots} shots
                          </Text>
                        </View>
                        {!isDeleteMode && <ChevronRight size={20} color="rgba(255,255,255,0.5)" />}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {orderedCategories.length > 0 ? (
            orderedCategories.map((category) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[category] || '#2D6A4F' }]} />
                  <Text style={styles.categoryTitle}>{category}</Text>
                </View>
                {drillsByCategory[category].map((drill) => {
                  const isSelectedForDel = selectedForDelete.has(drill.id);
                  return (
                    <TouchableOpacity
                      key={drill.id}
                      style={[styles.drillCard, isDeleteMode && isSelectedForDel && styles.drillCardDeleteSelected]}
                      activeOpacity={0.7}
                      onPress={() => isDeleteMode ? toggleDrillForDelete(drill.id) : handleDrillCardPress(drill)}
                    >
                      <LinearGradient
                        colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.drillCardGradient}
                      >
                        <View style={styles.drillCardInner}>
                          {isDeleteMode && (
                            <View style={[styles.deleteCheckbox, isSelectedForDel && styles.deleteCheckboxActive]}>
                              {isSelectedForDel && <View style={styles.deleteCheckboxDot} />}
                            </View>
                          )}
                          <View style={styles.drillCardContent}>
                            <Text style={styles.drillCardName}>{drill.name}</Text>
                            <Text style={styles.drillCardMeta}>
                              {drill.rounds} rounds · {drill.targetsPerRound} targets · {drill.totalShots} shots
                            </Text>
                          </View>
                          {!isDeleteMode && <ChevronRight size={20} color="rgba(255,255,255,0.5)" />}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          ) : (
            savedSensorDrills.length === 0 && (
              <View style={styles.emptyState}>
                <Dumbbell size={36} color="rgba(255,255,255,0.35)" />
                <Text style={styles.emptyTitle}>No drills yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "New Drill" to create your first practice drill
                </Text>
              </View>
            )
          )}
          {isDeleteMode && selectedForDelete.size > 0 && (
            <TouchableOpacity
              style={styles.deleteConfirmBtn}
              onPress={() => setShowDeleteConfirm(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF5252', '#D32F2F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.deleteConfirmGradient}
              >
                <Trash2 size={18} color="#FFFFFF" />
                <Text style={styles.deleteConfirmText}>Delete {selectedForDelete.size} drill{selectedForDelete.size !== 1 ? 's' : ''}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>

        {showDeleteConfirm && (
          <View style={styles.deleteOverlay}>
            <LinearGradient
              colors={['#0059B2', '#1075E3', '#1C8CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.deleteModal}
            >
              <Text style={styles.deleteModalTitle}>Delete Drills?</Text>
              <Text style={styles.deleteModalMessage}>Are you sure you want to delete {selectedForDelete.size} drill{selectedForDelete.size !== 1 ? 's' : ''}? This cannot be undone.</Text>
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteModalCancel}
                  onPress={() => setShowDeleteConfirm(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteModalConfirm}
                  onPress={handleDeleteConfirmed}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteModalConfirmText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        <Animated.View
          style={[
            styles.floatingHeader,
            {
              paddingTop: insets.top + 8,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Drills</Text>
            {onMinimize && (
              <TouchableOpacity
                onPress={onMinimize}
                style={styles.minimizeBtn}
                activeOpacity={0.7}
              >
                <View style={styles.minimizeGlassCircle}>
                  <ChevronDown size={26} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIconBtnTransparent}
              activeOpacity={0.7}
              onPress={() => setCurrentScreen('calendar')}
            >
              <CalendarDays size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtnTransparent}
              activeOpacity={0.7}
              onPress={() => setCurrentScreen('progressChart')}
            >
              <BarChart3 size={22} color="#FFFFFF" />
            </TouchableOpacity>
            {(savedDrills.length > 0 || savedSensorDrills.length > 0) && (
              <TouchableOpacity
                style={styles.headerIconBtnTransparent}
                activeOpacity={0.7}
                onPress={toggleDeleteMode}
              >
                <Trash2 size={22} color={isDeleteMode ? '#FF5252' : '#FFFFFF'} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const GLASS_BG = 'rgba(0,0,0,0.28)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#FFFFFF",
  },
  headerIcons: {
    flexDirection: "row" as const,
    gap: 10,
  },
  headerIconBtn: {
    backgroundColor: GLASS_BG,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  todaySection: {
    marginBottom: 16,
  },
  todaySectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  todaySectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  todayCard: {
    borderRadius: 14,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.3)',
    marginBottom: 6,
  },
  todayCardGradient: {
    borderRadius: 14,
  },
  todayCardInner: {
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  todayCardContent: {
    flex: 1,
    gap: 2,
  },
  todayCardName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  todayCardType: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
  },
  topRow: {
    flexDirection: "row" as const,
    gap: 10,
    marginBottom: 12,
  },
  topCard: {
    flex: 1,
    backgroundColor: GLASS_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingVertical: 18,
    alignItems: "center" as const,
    gap: 10,
  },
  topIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  topCardLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  sensorRow: {
    flexDirection: "row" as const,
    gap: 10,
    marginBottom: 24,
  },
  sensorCard: {
    flex: 1,
    backgroundColor: GLASS_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingVertical: 16,
    alignItems: "center" as const,
    gap: 8,
  },
  sensorLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
  },
  sensorIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  sensorCardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  drillCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    marginBottom: 8,
  },
  drillCardGradient: {
    borderRadius: 16,
  },
  drillCardInner: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  drillCardContent: {
    flex: 1,
    gap: 4,
  },
  drillCardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  drillCardMeta: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.55)',
  },
  emptyState: {
    alignItems: "center" as const,
    paddingTop: 30,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: "#FFFFFF",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center" as const,
    maxWidth: 240,
    lineHeight: 20,
  },
  sensorDrillNameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  headerLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  minimizeBtn: {
    width: 40,
    height: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
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
  drillWrapper: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: "#000",
  },
  floatingHeader: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerIconBtnTransparent: {
    width: 38,
    height: 38,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  drillCardDeleteSelected: {
    borderColor: '#FF5252',
    borderWidth: 2,
  },
  deleteCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  deleteCheckboxActive: {
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255,82,82,0.2)',
  },
  deleteCheckboxDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5252',
  },
  deleteConfirmBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  deleteConfirmGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    gap: 8,
    borderRadius: 14,
  },
  deleteConfirmText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  deleteOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 200,
  },
  deleteModal: {
    borderRadius: 20,
    padding: 28,
    width: '80%' as unknown as number,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 21,
  },
  deleteModalButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%' as unknown as number,
  },
  deleteModalCancel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000000',
  },
  deleteModalConfirm: {
    flex: 1,
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
