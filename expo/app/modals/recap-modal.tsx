import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Target, Calendar, RefreshCw } from 'lucide-react-native';
import GlassBackButton from '@/components/reusables/GlassBackButton';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateText } from '@rork-ai/toolkit-sdk';
import { supabase } from '@/lib/supabase';
import { useUserData } from '@/hooks/useUserData';
import { getScreenWidth } from '@/utils/responsive';

const SCREEN_WIDTH = getScreenWidth();

const GOAL_STORAGE_KEY = 'coach_handicap_goal';
const COACH_SUMMARIES_KEY = 'coach_analysis_summaries';

interface CoachSummary {
  id: string;
  type: 'round' | 'drill';
  text: string;
  createdAt: string;
  sourceId: string;
}

export default function RecapModal() {
  const insets = useSafeAreaInsets();
  const [goalModalVisible, setGoalModalVisible] = useState<boolean>(false);
  const [handicapGoal, setHandicapGoal] = useState<string>('');
  const [savedGoal, setSavedGoal] = useState<string>('');
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const goalInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasCheckedRef = useRef<boolean>(false);
  const [summaries, setSummaries] = useState<CoachSummary[]>([]);
  const summariesRef = useRef<CoachSummary[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastCheckedRoundId, setLastCheckedRoundId] = useState<string>('');
  const [lastCheckedDrillId, setLastCheckedDrillId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);

  const { userData } = useUserData();
  const currentHandicap = userData.profile.handicap ? parseFloat(userData.profile.handicap) : 0;
  const goalHandicap = userData.profile.goal1 ? parseFloat(userData.profile.goal1) : 0;
  const yearProgress = goalHandicap && currentHandicap ? currentHandicap - goalHandicap : 0;

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.log('[Coach] Auth error:', authError.message);
          setErrorMessage('Could not verify your account. Please try again.');
          return;
        }
        if (!user) {
          console.log('[Coach] No authenticated user found');
          setErrorMessage('Please log in to see your coach analysis.');
          return;
        }
        console.log('[Coach] Authenticated user:', user.id);
        setUserId(user.id);
      } catch (e: any) {
        console.log('[Coach] Init error:', e.message);
        setErrorMessage('Connection error. Please check your internet.');
      }
    };
    void init();
  }, []);

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const stored = await AsyncStorage.getItem(GOAL_STORAGE_KEY);
        if (stored) {
          setSavedGoal(stored);
          setHandicapGoal(stored);
          console.log('[Coach] Loaded saved goal:', stored);
        }
      } catch (e: any) {
        console.log('[Coach] Error loading goal:', e.message);
      }
    };
    void loadGoal();
  }, []);

  useEffect(() => {
    const loadSummaries = async () => {
      try {
        const stored = await AsyncStorage.getItem(COACH_SUMMARIES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CoachSummary[];
          setSummaries(parsed);
          if (parsed.length > 0) {
            const lastRoundSummary = parsed.find(s => s.type === 'round');
            const lastDrillSummary = parsed.find(s => s.type === 'drill');
            if (lastRoundSummary) setLastCheckedRoundId(lastRoundSummary.sourceId);
            if (lastDrillSummary) setLastCheckedDrillId(lastDrillSummary.sourceId);
          }
          console.log('[Coach] Loaded summaries:', parsed.length);
        }
      } catch (e: any) {
        console.log('[Coach] Error loading summaries:', e.message);
      }
    };
    void loadSummaries();
  }, []);

  useEffect(() => {
    summariesRef.current = summaries;
  }, [summaries]);

  const generateRoundSummary = useCallback(async (roundId: string, courseName: string, scores: { hole: number; par: number; score: number; putts: number; fairway: string; gir: boolean }[]) => {
    const goalText = savedGoal ? `The player's handicap goal is ${savedGoal}.` : 'No handicap goal is set.';
    const totalScore = scores.reduce((a, b) => a + b.score, 0);
    const totalPar = scores.reduce((a, b) => a + b.par, 0);
    const totalPutts = scores.reduce((a, b) => a + b.putts, 0);
    const girCount = scores.filter(s => s.gir).length;
    const fwHits = scores.filter(s => s.fairway === 'hit').length;
    const fwTotal = scores.filter(s => s.fairway !== 'n/a').length;
    const diff = totalScore - totalPar;
    const diffStr = diff === 0 ? 'Even par' : diff > 0 ? `+${diff}` : `${diff}`;

    const prompt = `You are a golf coach AI. Analyze this completed round and give a brief, motivating summary (3-5 sentences). Compare performance to the player's goal and current handicap.\n\nCurrent handicap: ${currentHandicap}\n${goalText}\nCourse: ${courseName}\nTotal: ${totalScore} (${diffStr})\nHoles: ${scores.length}\nTotal putts: ${totalPutts}\nGIR: ${girCount}/${scores.length}\nFairways hit: ${fwHits}/${fwTotal}\n\nKeep it concise, direct, and encouraging. Mention specific strengths and one area to improve.`;

    try {
      console.log('[Coach] Generating round summary for:', roundId);
      const text = await generateText(prompt);
      console.log('[Coach] Round summary generated');
      return text;
    } catch (e: any) {
      console.log('[Coach] Error generating round summary:', e.message);
      return null;
    }
  }, [savedGoal, currentHandicap]);

  const generateDrillSummary = useCallback(async (drillName: string, score: number | null, drillCount: number) => {
    const goalText = savedGoal ? `The player's handicap goal is ${savedGoal}.` : 'No handicap goal is set.';

    const prompt = `You are a golf coach AI. Analyze this completed practice drill and give a brief, motivating summary (2-4 sentences). Compare to the player's goal.\n\nCurrent handicap: ${currentHandicap}\n${goalText}\nDrill: ${drillName}\nScore: ${score ?? 'N/A'}\nTotal drills completed: ${drillCount}\n\nKeep it concise and encouraging. Mention how this practice contributes to their goal.`;

    try {
      console.log('[Coach] Generating drill summary for:', drillName);
      const text = await generateText(prompt);
      console.log('[Coach] Drill summary generated');
      return text;
    } catch (e: any) {
      console.log('[Coach] Error generating drill summary:', e.message);
      return null;
    }
  }, [savedGoal, currentHandicap]);

  const saveSummary = useCallback(async (summary: CoachSummary) => {
    try {
      const current = summariesRef.current;
      const updated = [summary, ...current].slice(0, 20);
      setSummaries(updated);
      summariesRef.current = updated;
      await AsyncStorage.setItem(COACH_SUMMARIES_KEY, JSON.stringify(updated));
      console.log('[Coach] Summary saved, total:', updated.length);
    } catch (e: any) {
      console.log('[Coach] Error saving summary:', e.message);
    }
  }, []);

  const checkForNewActivity = useCallback(async () => {
    if (isGenerating) return;
    if (!userId) {
      console.log('[Coach] No user ID available, skipping activity check');
      return;
    }
    setIsGenerating(true);
    setErrorMessage('');
    console.log('[Coach] Checking for new activity for user:', userId);

    try {
      const { data: latestRound, error: roundErr } = await supabase
        .from('rounds')
        .select('id, course_name, is_completed, created_at')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roundErr) {
        console.log('[Coach] Round fetch error:', roundErr.message, roundErr.details, roundErr.hint);
        setErrorMessage('Could not load your rounds. Please try again.');
      }

      if (latestRound && latestRound.id !== lastCheckedRoundId) {
        console.log('[Coach] New completed round found:', latestRound.id);
        setLastCheckedRoundId(latestRound.id);

        const { data: holeScores, error: holeErr } = await supabase
          .from('hole_scores')
          .select('hole_number, par, score, putts, fairway_status, gir')
          .eq('round_id', latestRound.id)
          .order('hole_number', { ascending: true });

        if (holeErr) console.log('[Coach] Hole scores fetch error:', holeErr.message);

        if (holeScores && holeScores.length > 0) {
          const scores = holeScores.map(h => ({
            hole: h.hole_number,
            par: h.par,
            score: h.score,
            putts: h.putts ?? 2,
            fairway: h.fairway_status ?? 'n/a',
            gir: h.gir ?? false,
          }));

          const text = await generateRoundSummary(latestRound.id, latestRound.course_name || 'Unknown', scores);
          if (text) {
            await saveSummary({
              id: `round-${latestRound.id}`,
              type: 'round',
              text,
              createdAt: new Date().toISOString(),
              sourceId: latestRound.id,
            });
          }
        }
      }

      const { data: latestDrill, error: drillErr } = await supabase
        .from('drill_results')
        .select('id, drill_name, percentage, category, total_hits, total_shots, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (drillErr) {
        console.log('[Coach] Drill fetch error:', drillErr.message, drillErr.details, drillErr.hint);
        setErrorMessage(prev => prev || 'Could not load your drills. Please try again.');
      }

      if (latestDrill && latestDrill.id !== lastCheckedDrillId) {
        console.log('[Coach] New drill found:', latestDrill.id);
        setLastCheckedDrillId(latestDrill.id);

        const { count } = await supabase
          .from('drill_results')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        const text = await generateDrillSummary(latestDrill.drill_name, latestDrill.percentage, count || 0);
        if (text) {
          await saveSummary({
            id: `drill-${latestDrill.id}`,
            type: 'drill',
            text,
            createdAt: new Date().toISOString(),
            sourceId: latestDrill.id,
          });
        }
      }

      if ((!latestRound || latestRound.id === lastCheckedRoundId) && (!latestDrill || latestDrill.id === lastCheckedDrillId)) {
        console.log('[Coach] No new activity found');
      }
    } catch (e: any) {
      console.log('[Coach] Error checking activity:', e.message);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, userId, lastCheckedRoundId, lastCheckedDrillId, generateRoundSummary, generateDrillSummary, saveSummary]);

  useEffect(() => {
    if (!userId) return;
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    console.log('[Coach] Starting initial activity check for user:', userId);
    const timer = setTimeout(() => {
      void checkForNewActivity();
    }, 800);
    return () => clearTimeout(timer);
  }, [userId, checkForNewActivity]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSaveGoal = async () => {
    if (handicapGoal.trim() === '') return;
    try {
      await AsyncStorage.setItem(GOAL_STORAGE_KEY, handicapGoal);
      setSavedGoal(handicapGoal);
      setIsEditingGoal(false);
      console.log('[Coach] Saved goal:', handicapGoal);
    } catch (e: any) {
      console.log('[Coach] Error saving goal:', e.message);
    }
  };

  const openGoalModal = () => {
    console.log('[Coach] Opening goal modal');
    setGoalModalVisible(true);
  };

  const closeGoalModal = () => {
    setGoalModalVisible(false);
    setIsEditingGoal(false);
  };

  const canEditGoal = () => {
    if (!savedGoal) return true;
    const goalNum = parseFloat(savedGoal);
    return currentHandicap <= goalNum;
  };

  return (
    <LinearGradient
      colors={['#4BA35B', '#3D954D', '#2D803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <GlassBackButton onPress={() => router.back()} />
        <Text style={styles.title}>Coach</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => router.push('/modals/past-summaries-modal')} style={styles.calendarBtn} activeOpacity={0.7}>
          <Calendar size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        <View style={styles.topRow}>
          <View
            style={styles.handicapBox}
          >
            <Image
              source={require('@/assets/images/sgf-icon.png')}
              style={styles.sgfIcon}
              resizeMode="contain"
            />
            <View style={styles.handicapContent}>
              <View style={styles.handicapLeft}>
                <Text style={styles.handicapNumber}>{currentHandicap.toFixed(1)}</Text>
                <Text style={styles.handicapLabel}>Current Handicap</Text>
              </View>
              <View style={styles.handicapDivider} />
              <View style={styles.handicapRight}>
                <Text style={styles.progressNumber}>
                  {yearProgress > 0 ? '+' : ''}{yearProgress.toFixed(1)}
                </Text>
                <Text style={styles.handicapLabel}>Year Progress</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={openGoalModal} activeOpacity={0.8} style={styles.goalSquareWrap}>
            <View
              style={styles.goalSquare}
            >
              {savedGoal ? (
                <>
                  <Text style={styles.goalSquareNumber}>{savedGoal}</Text>
                  <Target size={14} color="#D1F2DE" />
                </>
              ) : (
                <>
                  <Target size={22} color="#D1F2DE" />
                  <Text style={styles.goalSquareHint}>Goal</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerLine} />

        <View style={styles.weekDayRow}>
          <Text style={styles.weekDayText}>
            Week {(() => { const now = new Date(); const start = new Date(now.getFullYear(), 0, 1); const diff = now.getTime() - start.getTime(); const oneWeek = 7 * 24 * 60 * 60 * 1000; return Math.ceil((diff + start.getDay() * 24 * 60 * 60 * 1000) / oneWeek); })()}
          </Text>
          <Text style={styles.weekDayDot}> · </Text>
          <Text style={styles.weekDayText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </Text>
          <Text style={styles.weekDayDot}> · </Text>
          <Text style={styles.coachAnalysisHeader}>Coach Analysis</Text>
        </View>
      </Animated.View>

      <ScrollView style={styles.summariesScroll} contentContainerStyle={styles.summariesContent} showsVerticalScrollIndicator={false}>
        {isGenerating && summaries.length === 0 && (
          <View style={styles.generatingRow}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.generatingText}>Analyzing your latest activity...</Text>
          </View>
        )}

        {errorMessage ? (
          <View style={styles.emptySummaries}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                hasCheckedRef.current = false;
                setErrorMessage('');
                void checkForNewActivity();
              }}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : summaries.length === 0 && !isGenerating ? (
          <View style={styles.emptySummaries}>
            <Text style={styles.emptySummariesText}>Complete a round or drill to get your first coach analysis</Text>
          </View>
        ) : null}

        {summaries.map((summary) => {
          const dateStr = new Date(summary.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          return (
            <View key={summary.id} style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <View style={[styles.summaryTypeBadge, summary.type === 'round' ? styles.summaryTypeBadgeRound : styles.summaryTypeBadgeDrill]}>
                  <Text style={styles.summaryTypeBadgeText}>{summary.type === 'round' ? 'Round' : 'Drill'}</Text>
                </View>
                <Text style={styles.summaryDate}>{dateStr}</Text>
              </View>
              <Text style={styles.summaryText}>{summary.text}</Text>
            </View>
          );
        })}

        {summaries.length > 0 && (
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => void checkForNewActivity()}
            activeOpacity={0.7}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCw size={16} color="#FFFFFF" />
            )}
            <Text style={styles.refreshBtnText}>{isGenerating ? 'Analyzing...' : 'Check for new activity'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={goalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeGoalModal}
      >
        <View style={styles.goalOverlay}>
          <LinearGradient
            colors={['#86D9A5', '#5BBF7F', '#3A8E56']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.goalModal}
          >
            <TouchableOpacity onPress={closeGoalModal} style={styles.goalCloseBtn} activeOpacity={0.7}>
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.goalModalContent}>
              <Text style={styles.goalModalTitle}>Set Your Handicap Goal</Text>
              <Text style={styles.goalModalText}>
                Setting a handicap goal helps you stay focused and motivated throughout the season. 
                Track your progress and push yourself to reach the next level. 
                A clear target gives your practice purpose and makes every round count towards something bigger.
              </Text>

              {savedGoal && !canEditGoal() ? (
                <View style={styles.goalLockedSection}>
                  <Text style={styles.goalLockedText}>
                    Current goal: {savedGoal}
                  </Text>
                  <Text style={styles.goalLockedSubtext}>
                    Achieve your current goal to set a new one
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.goalBottomRow}>
              <Text style={styles.yearGoalLabel}>Year Goal</Text>
              {isEditingGoal || !savedGoal ? (
                <View style={styles.goalInputRow}>
                  <TextInput
                    ref={goalInputRef}
                    style={styles.goalInput}
                    value={handicapGoal}
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^0-9.]/g, '');
                      setHandicapGoal(filtered);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    maxLength={5}
                    autoFocus={isEditingGoal}
                  />
                  <TouchableOpacity
                    style={styles.goalSaveBtn}
                    onPress={handleSaveGoal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.goalSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.goalEditBtn}
                  onPress={() => {
                    if (canEditGoal()) {
                      setIsEditingGoal(true);
                    }
                  }}
                  activeOpacity={canEditGoal() ? 0.7 : 1}
                >
                  <Text style={styles.goalEditValue}>{savedGoal}</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
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

  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  handicapBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    position: 'relative' as const,
    minHeight: 90,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden' as const,
  },
  sgfIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute' as const,
    top: 12,
    right: 12,
  },
  handicapContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  handicapLeft: {
    flex: 1,
    alignItems: 'center' as const,
  },
  handicapNumber: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  handicapLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#D1F2DE',
    marginTop: 2,
  },
  handicapDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 12,
  },
  handicapRight: {
    flex: 1,
    alignItems: 'center' as const,
  },
  progressNumber: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  goalSquareWrap: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  goalSquare: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 16,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  goalSquareNumber: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  goalSquareHint: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#D1F2DE',
  },
  goalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  goalModal: {
    width: '100%' as const,
    borderRadius: 24,
    padding: 24,
    position: 'relative' as const,
    maxWidth: SCREEN_WIDTH - 60,
  },
  goalCloseBtn: {
    position: 'absolute' as const,
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  goalModalContent: {
    marginTop: 36,
    marginBottom: 24,
  },
  goalModalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  goalModalText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#D1F2DE',
    lineHeight: 21,
  },
  goalLockedSection: {
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  goalLockedText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  goalLockedSubtext: {
    fontSize: 12,
    color: '#D1F2DE',
    marginTop: 4,
  },
  goalBottomRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    gap: 12,
  },
  yearGoalLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  goalInputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  goalInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    minWidth: 70,
    textAlign: 'center' as const,
  },
  goalSaveBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  goalSaveBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#3A8E56',
  },
  goalEditBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  goalEditValue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#3A8E56',
  },
  calendarBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 20,
    marginBottom: 14,
  },
  weekDayRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingLeft: 2,
  },
  weekDayText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  weekDayDot: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
  },
  coachAnalysisHeader: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  summariesScroll: {
    flex: 1,
    marginTop: 18,
  },
  summariesContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  generatingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 20,
    justifyContent: 'center' as const,
  },
  generatingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.8)',
  },
  emptySummaries: {
    paddingVertical: 40,
    alignItems: 'center' as const,
  },
  emptySummariesText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFD6D6',
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 12,
  },
  retryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
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
  refreshBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
});
