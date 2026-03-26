import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/lib/supabase';

export interface LivePlayerScore {
  playerId: string;
  playerName: string;
  hcp: number;
  totalScore: number;
  totalPar: number;
  holesPlayed: number;
  holeScores: {
    holeNumber: number;
    score: number;
    par: number;
    fairway: string | null;
    putts: number;
    greenMiss: string | null;
    bunkerShots: number;
    penaltyShots: number;
    chips: number;
  }[];
}

export interface LiveRoundData {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar: string | null;
  courseName: string;
  holeOption: string;
  startedAt: number;
  sensorsActive: boolean;
  players: LivePlayerScore[];
  holes: { number: number; par: number; index: number; distance: number }[];
  isPrivate: boolean;
}

export const [LiveRoundProvider, useLiveRound] = createContextHook(() => {
  const { following, followers, userId } = useProfile();
  const [liveRounds, setLiveRounds] = useState<LiveRoundData[]>([]);
  const [selectedRound, setSelectedRound] = useState<LiveRoundData | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const friends = useMemo(() => {
    const followerIds = new Set(followers.map((f) => f.id));
    return following.filter((f) => followerIds.has(f.id));
  }, [following, followers]);

  const pollLiveRounds = useCallback(async () => {
    if (friends.length === 0) {
      setLiveRounds([]);
      return;
    }

    try {
      const friendIds = friends.map((f) => f.id);
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .in('user_id', friendIds)
        .eq('is_completed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('[LiveRound] Error fetching live rounds:', error.message);
        return;
      }

      if (!data || data.length === 0) {
        setLiveRounds([]);
        return;
      }

      const rounds: LiveRoundData[] = [];

      for (const round of data) {
        const friend = friends.find((f) => f.id === round.user_id);
        if (!friend) continue;

        const { data: holeData } = await supabase
          .from('hole_scores')
          .select('*')
          .eq('round_id', round.id)
          .order('hole_number', { ascending: true });

        const playerScores: LivePlayerScore[] = [{
          playerId: friend.id,
          playerName: friend.display_name || friend.username,
          hcp: 0,
          totalScore: 0,
          totalPar: 0,
          holesPlayed: 0,
          holeScores: [],
        }];

        if (holeData && holeData.length > 0) {
          let totalScore = 0;
          let totalPar = 0;
          const holeScores = holeData.map((h: any) => {
            if (h.score > 0) {
              totalScore += h.score;
              totalPar += h.par || 0;
            }
            return {
              holeNumber: h.hole_number,
              score: h.score || 0,
              par: h.par || 0,
              fairway: h.fairway_status || null,
              putts: h.putts || 0,
              greenMiss: h.gir_miss_direction || null,
              bunkerShots: h.bunker_shots || 0,
              penaltyShots: h.penalty_shots || 0,
              chips: h.chips || 0,
            };
          });
          playerScores[0].totalScore = totalScore;
          playerScores[0].totalPar = totalPar;
          playerScores[0].holesPlayed = holeScores.filter((h) => h.score > 0).length;
          playerScores[0].holeScores = holeScores;
        }

        rounds.push({
          id: round.id,
          friendId: friend.id,
          friendName: friend.display_name || friend.username,
          friendAvatar: friend.avatar_url,
          courseName: round.course_name || 'Unknown Course',
          holeOption: round.hole_option || '18',
          startedAt: new Date(round.created_at).getTime(),
          sensorsActive: false,
          players: playerScores,
          holes: [],
          isPrivate: false,
        });
      }

      setLiveRounds(rounds);
      console.log('[LiveRound] Found', rounds.length, 'live rounds from friends');
    } catch (e: any) {
      console.log('[LiveRound] Polling error:', e.message);
    }
  }, [friends]);

  useEffect(() => {
    if (!userId) return;
    void pollLiveRounds();
    pollingRef.current = setInterval(() => {
      void pollLiveRounds();
    }, 10000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [userId, pollLiveRounds]);

  const selectRound = useCallback((round: LiveRoundData | null) => {
    console.log('[LiveRound] Selected round:', round?.courseName ?? 'none');
    setSelectedRound(round);
  }, []);

  const refreshSelectedRound = useCallback(async () => {
    if (!selectedRound) return;
    await pollLiveRounds();
    const updated = liveRounds.find((r) => r.id === selectedRound.id);
    if (updated) {
      setSelectedRound(updated);
    }
  }, [selectedRound, pollLiveRounds, liveRounds]);

  return useMemo(() => ({
    liveRounds,
    selectedRound,
    selectRound,
    friends,
    refreshSelectedRound,
    pollLiveRounds,
  }), [liveRounds, selectedRound, selectRound, friends, refreshSelectedRound, pollLiveRounds]);
});
