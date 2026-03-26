import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HoleInfo, getHolesForOption, loadSelectedCourseHoles, loadSelectedCourseName } from '@/mocks/courseData';
import { createRound, saveHoleScore, completeRound } from '@/services/roundService';

export type FairwayHit = 'left' | 'hit' | 'right';
export type GreenMiss = 'short' | 'long' | 'left' | 'right' | 'hit';
export type PuttDistance = '<1' | '1-2' | '2-4' | '4-8' | '8+';
export type InputStep = 'digit' | 'fairway' | 'green' | 'extrashot';

export interface HoleScore {
  holeNumber: number;
  score: number;
  fairway: FairwayHit | null;
  putts: number;
  puttDistance: PuttDistance | null;
  greenMiss: GreenMiss | null;
  bunkerShots: number;
  penaltyShots: number;
  chips: number;
  sandSave: boolean;
  upAndDown: boolean;
}

export interface PlayerRoundInfo {
  id: string;
  name: string;
  hcp: number;
}

const STORAGE_KEY_HOLE_OPTION = 'play_setup_hole_option';
const STORAGE_KEY_PLAYERS = 'play_setup_selected_players';
const STORAGE_KEY_ADVANCED_DATA = 'play_setup_advanced_data';

function createEmptyHoleScore(holeNumber: number): HoleScore {
  return {
    holeNumber,
    score: 0,
    fairway: null,
    putts: 2,
    puttDistance: null,
    greenMiss: null,
    bunkerShots: 0,
    penaltyShots: 0,
    chips: 0,
    sandSave: false,
    upAndDown: false,
  };
}

export const [ScoringProvider, useScoring] = createContextHook(() => {
  const [holeOption, setHoleOption] = useState<string>('18');
  const [holes, setHoles] = useState<HoleInfo[]>([]);
  const [_allCourseHoles, setAllCourseHoles] = useState<HoleInfo[]>([]);
  const [currentHoleIndex, setCurrentHoleIndex] = useState<number>(0);
  const [inputStep, setInputStep] = useState<InputStep>('digit');
  const [scores, setScores] = useState<Map<number, HoleScore>>(new Map());
  const [players, setPlayers] = useState<PlayerRoundInfo[]>([]);
  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);
  const [supabaseRoundId, setSupabaseRoundId] = useState<string | null>(null);
  const [advancedDataEnabled, setAdvancedDataEnabled] = useState<boolean>(false);
  const [playerScores, setPlayerScores] = useState<Map<string, Map<number, HoleScore>>>(new Map());
  const [currentScoringPlayerIndex, setCurrentScoringPlayerIndex] = useState<number>(0);
  const [courseName, setCourseName] = useState<string>('Golf Course');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    void loadSetupData();
  }, []);

  useEffect(() => {
    if (isLoaded && !supabaseRoundId) {
      void initSupabaseRound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const initSupabaseRound = async () => {
    try {
      const storedSensors = await AsyncStorage.getItem('sensor_is_paired');
      const sensorsActive = storedSensors === 'true';
      const roundId = await createRound(courseName, {
        holeOption: holeOption,
        sensorsActive,
      });
      if (roundId) {
        setSupabaseRoundId(roundId);
        console.log('[ScoringContext] Supabase round initialized:', roundId, 'sensors:', sensorsActive, 'holes:', holeOption);
      }
    } catch (e) {
      console.log('[ScoringContext] Could not create supabase round:', e);
    }
  };

  const loadSetupData = async () => {
    try {
      const courseHoles = await loadSelectedCourseHoles();
      setAllCourseHoles(courseHoles);
      console.log('[ScoringContext] Loaded course holes from API:', courseHoles.length);

      const name = await loadSelectedCourseName();
      setCourseName(name);
      console.log('[ScoringContext] Loaded course name:', name);

      const storedOption = await AsyncStorage.getItem(STORAGE_KEY_HOLE_OPTION);
      const option = storedOption || '18';
      setHoleOption(option);
      const activeHoles = getHolesForOption(option, courseHoles);
      setHoles(activeHoles);
      console.log('[ScoringContext] Loaded hole option:', option, 'holes:', activeHoles.length);

      const storedPlayers = await AsyncStorage.getItem(STORAGE_KEY_PLAYERS);
      if (storedPlayers) {
        const parsed = JSON.parse(storedPlayers) as { id: string; name: string; hcp?: number }[];
        setPlayers(parsed.map((p) => ({ id: p.id, name: p.name, hcp: p.hcp ?? 0 })));
      }

      const storedAdvanced = await AsyncStorage.getItem(STORAGE_KEY_ADVANCED_DATA);
      if (storedAdvanced !== null) {
        setAdvancedDataEnabled(JSON.parse(storedAdvanced));
        console.log('[ScoringContext] Advanced data enabled:', JSON.parse(storedAdvanced));
      }

      setIsLoaded(true);
    } catch (e) {
      console.log('[ScoringContext] Error loading setup data:', e);
      setIsLoaded(true);
    }
  };

  const persistHoleToSupabase = useCallback(async (holeScore: HoleScore, par: number) => {
    if (!supabaseRoundId) {
      console.log('[ScoringContext] No supabase round id, skipping save');
      return;
    }
    try {
      await saveHoleScore(supabaseRoundId, holeScore, par);
    } catch (e) {
      console.log('[ScoringContext] Error persisting hole to supabase:', e);
    }
  }, [supabaseRoundId]);

  const completeSupabaseRound = useCallback(async () => {
    if (!supabaseRoundId) return;
    try {
      await completeRound(supabaseRoundId);
      console.log('[ScoringContext] Supabase round completed');
    } catch (e) {
      console.log('[ScoringContext] Error completing supabase round:', e);
    }
  }, [supabaseRoundId]);

  const allScoringPlayers = useMemo(() => {
    return [{ id: '__creator__', name: 'Creator', hcp: 0 }, ...players];
  }, [players]);

  const currentScoringPlayer = useMemo(() => {
    return allScoringPlayers[currentScoringPlayerIndex] ?? allScoringPlayers[0];
  }, [allScoringPlayers, currentScoringPlayerIndex]);

  const isCreatorScoring = currentScoringPlayerIndex === 0;

  const currentHole = useMemo(() => {
    return holes[currentHoleIndex] ?? holes[0];
  }, [holes, currentHoleIndex]);

  const currentHoleScore = useMemo(() => {
    if (!currentHole) return createEmptyHoleScore(1);
    if (isCreatorScoring) {
      return scores.get(currentHole.number) ?? createEmptyHoleScore(currentHole.number);
    }
    const pScores = playerScores.get(currentScoringPlayer.id);
    if (pScores) {
      return pScores.get(currentHole.number) ?? createEmptyHoleScore(currentHole.number);
    }
    return createEmptyHoleScore(currentHole.number);
  }, [scores, playerScores, currentHole, isCreatorScoring, currentScoringPlayer]);

  const totalScore = useMemo(() => {
    let total = 0;
    scores.forEach((s) => {
      if (s.score > 0) total += s.score;
    });
    return total;
  }, [scores]);

  const totalPar = useMemo(() => {
    let par = 0;
    scores.forEach((s, holeNum) => {
      if (s.score > 0) {
        const hole = holes.find((h) => h.number === holeNum);
        if (hole) par += hole.par;
      }
    });
    return par;
  }, [scores, holes]);

  const holesPlayed = useMemo(() => {
    let count = 0;
    scores.forEach((s) => {
      if (s.score > 0) count++;
    });
    return count;
  }, [scores]);

  const getPlayerTotalScore = useCallback((playerId: string): number => {
    if (playerId === '__creator__') return totalScore;
    const pScores = playerScores.get(playerId);
    if (!pScores) return 0;
    let total = 0;
    pScores.forEach((s) => {
      if (s.score > 0) total += s.score;
    });
    return total;
  }, [totalScore, playerScores]);

  const getPlayerTotalPar = useCallback((playerId: string): number => {
    if (playerId === '__creator__') return totalPar;
    const pScores = playerScores.get(playerId);
    if (!pScores) return 0;
    let par = 0;
    pScores.forEach((s, holeNum) => {
      if (s.score > 0) {
        const hole = holes.find((h) => h.number === holeNum);
        if (hole) par += hole.par;
      }
    });
    return par;
  }, [totalPar, playerScores, holes]);

  const getPlayerHolesPlayed = useCallback((playerId: string): number => {
    if (playerId === '__creator__') return holesPlayed;
    const pScores = playerScores.get(playerId);
    if (!pScores) return 0;
    let count = 0;
    pScores.forEach((s) => {
      if (s.score > 0) count++;
    });
    return count;
  }, [holesPlayed, playerScores]);

  const getPlayerHoleScore = useCallback((playerId: string, holeNum: number): HoleScore | undefined => {
    if (playerId === '__creator__') return scores.get(holeNum);
    const pScores = playerScores.get(playerId);
    return pScores?.get(holeNum);
  }, [scores, playerScores]);

  const moveToNextScoringPlayer = useCallback(() => {
    const nextIdx = currentScoringPlayerIndex + 1;
    if (nextIdx < allScoringPlayers.length) {
      console.log('[ScoringContext] Moving to next player:', nextIdx, allScoringPlayers[nextIdx]?.name);
      setCurrentScoringPlayerIndex(nextIdx);
      setInputStep('digit');
      return true;
    }
    return false;
  }, [currentScoringPlayerIndex, allScoringPlayers]);

  const setScore = useCallback((holeNumber: number, score: number) => {
    if (isCreatorScoring) {
      setScores((prev) => {
        const next = new Map(prev);
        const existing = next.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
        next.set(holeNumber, { ...existing, score });
        return next;
      });
      setInputStep('fairway');
    } else {
      setPlayerScores((prev) => {
        const next = new Map(prev);
        const pMap = new Map(next.get(currentScoringPlayer.id) ?? new Map());
        const existing = pMap.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
        pMap.set(holeNumber, { ...existing, score });
        next.set(currentScoringPlayer.id, pMap);
        return next;
      });

      if (advancedDataEnabled) {
        setInputStep('fairway');
      } else {
        const hasMore = currentScoringPlayerIndex + 1 < allScoringPlayers.length;
        if (hasMore) {
          setCurrentScoringPlayerIndex((prev) => prev + 1);
          setInputStep('digit');
        } else {
          if (currentHoleIndex < holes.length - 1) {
            setCurrentHoleIndex((prev) => prev + 1);
          }
          setCurrentScoringPlayerIndex(0);
          setInputStep('digit');
        }
      }
    }
  }, [isCreatorScoring, currentScoringPlayer, advancedDataEnabled, currentScoringPlayerIndex, allScoringPlayers.length, currentHoleIndex, holes.length]);

  const setFairwayData = useCallback((holeNumber: number, fairway: FairwayHit, putts: number, puttDistance: PuttDistance | null) => {
    if (isCreatorScoring) {
      setScores((prev) => {
        const next = new Map(prev);
        const existing = next.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
        next.set(holeNumber, { ...existing, fairway, putts, puttDistance });
        return next;
      });
    } else {
      setPlayerScores((prev) => {
        const next = new Map(prev);
        const pMap = new Map(next.get(currentScoringPlayer.id) ?? new Map());
        const existing = pMap.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
        pMap.set(holeNumber, { ...existing, fairway, putts, puttDistance });
        next.set(currentScoringPlayer.id, pMap);
        return next;
      });
    }
    setInputStep('green');
  }, [isCreatorScoring, currentScoringPlayer]);

  const setGreenData = useCallback((holeNumber: number, greenMiss: GreenMiss) => {
    if (isCreatorScoring) {
      setScores((prev) => {
        const next = new Map(prev);
        const existing = next.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
        next.set(holeNumber, { ...existing, greenMiss });
        return next;
      });
    } else {
      setPlayerScores((prev) => {
        const next = new Map(prev);
        const pMap = new Map(next.get(currentScoringPlayer.id) ?? new Map());
        const existing = pMap.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
        pMap.set(holeNumber, { ...existing, greenMiss });
        next.set(currentScoringPlayer.id, pMap);
        return next;
      });
    }
    setInputStep('extrashot');
  }, [isCreatorScoring, currentScoringPlayer]);

  const setExtraShotData = useCallback((
    holeNumber: number,
    bunkerShots: number,
    penaltyShots: number,
    chips: number,
    sandSave: boolean,
    upAndDown: boolean
  ) => {
    if (isCreatorScoring) {
      setScores((prev) => {
        const next = new Map(prev);
        const existing = next.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
        const updated = { ...existing, bunkerShots, penaltyShots, chips, sandSave, upAndDown };
        next.set(holeNumber, updated);

        const holeInfo = holes.find((h) => h.number === holeNumber);
        if (holeInfo) {
          void persistHoleToSupabase(updated, holeInfo.par);
        }

        return next;
      });
    } else {
      setPlayerScores((prev) => {
        const next = new Map(prev);
        const pMap = new Map(next.get(currentScoringPlayer.id) ?? new Map());
        const existing = pMap.get(holeNumber) ?? createEmptyHoleScore(holeNumber);
        pMap.set(holeNumber, { ...existing, bunkerShots, penaltyShots, chips, sandSave, upAndDown });
        next.set(currentScoringPlayer.id, pMap);
        return next;
      });
    }

    const hasMorePlayers = currentScoringPlayerIndex + 1 < allScoringPlayers.length;
    if (hasMorePlayers) {
      setCurrentScoringPlayerIndex((prev) => prev + 1);
      setInputStep('digit');
    } else {
      if (currentHoleIndex < holes.length - 1) {
        setCurrentHoleIndex((prev) => prev + 1);
      }
      setCurrentScoringPlayerIndex(0);
      setInputStep('digit');
    }
  }, [isCreatorScoring, currentScoringPlayer, currentHoleIndex, holes, persistHoleToSupabase, currentScoringPlayerIndex, allScoringPlayers.length]);

  const goToNextHole = useCallback(() => {
    if (currentHoleIndex < holes.length - 1) {
      setCurrentHoleIndex((prev) => prev + 1);
      setCurrentScoringPlayerIndex(0);
      setInputStep('digit');
    }
  }, [currentHoleIndex, holes.length]);

  const goToPrevHole = useCallback(() => {
    if (currentHoleIndex > 0) {
      setCurrentHoleIndex((prev) => prev - 1);
      setCurrentScoringPlayerIndex(0);
      setInputStep('digit');
    }
  }, [currentHoleIndex]);

  const goToHole = useCallback((index: number) => {
    if (index >= 0 && index < holes.length) {
      setCurrentHoleIndex(index);
      setCurrentScoringPlayerIndex(0);
      setInputStep('digit');
    }
  }, [holes.length]);

  const goBackStep = useCallback(() => {
    const stepOrder: InputStep[] = ['digit', 'fairway', 'green', 'extrashot'];
    const currentIndex = stepOrder.indexOf(inputStep);
    if (currentIndex > 0) {
      setInputStep(stepOrder[currentIndex - 1]);
    } else if (currentScoringPlayerIndex > 0) {
      setCurrentScoringPlayerIndex((prev) => prev - 1);
      setInputStep('digit');
    }
  }, [inputStep, currentScoringPlayerIndex]);

  const clearHoleScore = useCallback((holeNumber: number) => {
    if (isCreatorScoring) {
      setScores((prev) => {
        const next = new Map(prev);
        next.delete(holeNumber);
        return next;
      });
    } else {
      setPlayerScores((prev) => {
        const next = new Map(prev);
        const pMap = new Map(next.get(currentScoringPlayer.id) ?? new Map());
        pMap.delete(holeNumber);
        next.set(currentScoringPlayer.id, pMap);
        return next;
      });
    }
    setInputStep('digit');
  }, [isCreatorScoring, currentScoringPlayer]);

  const getScoreForHole = useCallback((holeNumber: number): HoleScore | undefined => {
    return scores.get(holeNumber);
  }, [scores]);

  const allScores = useMemo(() => {
    return Array.from(scores.entries()).sort((a, b) => a[0] - b[0]);
  }, [scores]);

  return useMemo(() => ({
    holeOption,
    holes,
    currentHole,
    currentHoleIndex,
    currentHoleScore,
    inputStep,
    scores,
    players,
    totalScore,
    totalPar,
    holesPlayed,
    showScoreboard,
    setShowScoreboard,
    setScore,
    setFairwayData,
    setGreenData,
    setExtraShotData,
    goToNextHole,
    goToPrevHole,
    goToHole,
    goBackStep,
    clearHoleScore,
    getScoreForHole,
    allScores,
    setInputStep,
    courseName,
    supabaseRoundId,
    completeSupabaseRound,
    advancedDataEnabled,
    playerScores,
    currentScoringPlayerIndex,
    currentScoringPlayer,
    allScoringPlayers,
    isCreatorScoring,
    getPlayerTotalScore,
    getPlayerTotalPar,
    getPlayerHolesPlayed,
    getPlayerHoleScore,
    moveToNextScoringPlayer,
  }), [
    holeOption, holes, currentHole, currentHoleIndex, currentHoleScore,
    inputStep, scores, players, totalScore, totalPar, holesPlayed,
    showScoreboard, setShowScoreboard, setScore, setFairwayData,
    setGreenData, setExtraShotData, goToNextHole, goToPrevHole, goToHole,
    goBackStep, clearHoleScore, getScoreForHole, allScores, setInputStep,
    courseName, completeSupabaseRound, advancedDataEnabled, playerScores,
    currentScoringPlayerIndex, currentScoringPlayer, allScoringPlayers,
    isCreatorScoring, getPlayerTotalScore, getPlayerTotalPar,
    getPlayerHolesPlayed, getPlayerHoleScore, moveToNextScoringPlayer,
    supabaseRoundId,
  ]);
});
