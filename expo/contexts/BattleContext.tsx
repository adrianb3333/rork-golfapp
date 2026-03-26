import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface BattleInvite {
  id: string;
  from_user_id: string;
  from_username: string;
  from_display_name: string;
  from_avatar_url: string | null;
  to_user_id: string;
  battle_name: string;
  rounds: number;
  shots_per_round: number;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface BattleResult {
  id: string;
  battle_name: string;
  user_id: string;
  opponent_id: string;
  opponent_username: string;
  opponent_display_name: string;
  opponent_avatar_url: string | null;
  user_score: number;
  user_total_shots: number;
  opponent_score: number;
  opponent_total_shots: number;
  user_percentage: number;
  opponent_percentage: number;
  rounds: number;
  shots_per_round: number;
  user_round_scores: number[];
  opponent_round_scores: number[];
  completed_at: string;
}

export interface ActiveBattle {
  id: string;
  battle_name: string;
  opponent_id: string;
  opponent_username: string;
  opponent_display_name: string;
  opponent_avatar_url: string | null;
  rounds: number;
  shots_per_round: number;
}

const BATTLES_STORAGE_KEY = 'battle_results';
const INVITES_STORAGE_KEY = 'battle_invites';
const ACTIVE_BATTLE_KEY = 'active_battle';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function useBattleState() {
  const _queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [battleResults, setBattleResults] = useState<BattleResult[]>([]);
  const [pendingInvites, setPendingInvites] = useState<BattleInvite[]>([]);
  const [activeBattle, setActiveBattle] = useState<ActiveBattle | null>(null);
  const [hasNewInvite, setHasNewInvite] = useState<boolean>(false);
  const [shouldNavigateToPractice, setShouldNavigateToPractice] = useState<boolean>(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [resultsRaw, invitesRaw, activeRaw] = await Promise.all([
          AsyncStorage.getItem(BATTLES_STORAGE_KEY),
          AsyncStorage.getItem(INVITES_STORAGE_KEY),
          AsyncStorage.getItem(ACTIVE_BATTLE_KEY),
        ]);
        if (resultsRaw) setBattleResults(JSON.parse(resultsRaw));
        if (invitesRaw) {
          const invites: BattleInvite[] = JSON.parse(invitesRaw);
          setPendingInvites(invites);
          if (invites.some(i => i.status === 'pending' && i.to_user_id === userId)) {
            setHasNewInvite(true);
          }
        }
        if (activeRaw) setActiveBattle(JSON.parse(activeRaw));
        console.log('[BattleContext] Data loaded');
      } catch (e) {
        console.log('[BattleContext] Error loading data:', e);
      }
    };
    if (userId) void load();
  }, [userId]);

  const sendInviteMutation = useMutation({
    mutationFn: async (params: {
      toUserId: string;
      battleName: string;
      rounds: number;
      shotsPerRound: number;
      toUsername: string;
      toDisplayName: string;
      toAvatarUrl: string | null;
    }) => {
      if (!userId) throw new Error('Not authenticated');

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', userId)
        .single();

      const invite: BattleInvite = {
        id: generateId(),
        from_user_id: userId,
        from_username: myProfile?.username ?? 'user',
        from_display_name: myProfile?.display_name ?? 'User',
        from_avatar_url: myProfile?.avatar_url ?? null,
        to_user_id: params.toUserId,
        battle_name: params.battleName,
        rounds: params.rounds,
        shots_per_round: params.shotsPerRound,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const stored = await AsyncStorage.getItem(INVITES_STORAGE_KEY);
      const all: BattleInvite[] = stored ? JSON.parse(stored) : [];
      all.push(invite);
      await AsyncStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(all));
      setPendingInvites(all);

      console.log('[BattleContext] Invite sent to:', params.toUserId);
      return invite;
    },
  });

  const acceptInvite = useCallback(async (inviteId: string) => {
    console.log('[BattleContext] Accepting invite:', inviteId);
    const stored = await AsyncStorage.getItem(INVITES_STORAGE_KEY);
    const all: BattleInvite[] = stored ? JSON.parse(stored) : [];
    const idx = all.findIndex(i => i.id === inviteId);
    if (idx < 0) return;

    all[idx].status = 'accepted';
    await AsyncStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(all));
    setPendingInvites(all);

    const invite = all[idx];
    const battle: ActiveBattle = {
      id: generateId(),
      battle_name: invite.battle_name,
      opponent_id: invite.from_user_id,
      opponent_username: invite.from_username,
      opponent_display_name: invite.from_display_name,
      opponent_avatar_url: invite.from_avatar_url,
      rounds: invite.rounds,
      shots_per_round: invite.shots_per_round,
    };
    setActiveBattle(battle);
    await AsyncStorage.setItem(ACTIVE_BATTLE_KEY, JSON.stringify(battle));
    setHasNewInvite(false);
    setShouldNavigateToPractice(true);

    return battle;
  }, []);

  const declineInvite = useCallback(async (inviteId: string) => {
    console.log('[BattleContext] Declining invite:', inviteId);
    const stored = await AsyncStorage.getItem(INVITES_STORAGE_KEY);
    const all: BattleInvite[] = stored ? JSON.parse(stored) : [];
    const idx = all.findIndex(i => i.id === inviteId);
    if (idx < 0) return;

    all[idx].status = 'declined';
    await AsyncStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(all));
    setPendingInvites(all);
    setHasNewInvite(false);
  }, []);

  const startBattleDirectly = useCallback(async (params: {
    battleName: string;
    opponentId: string;
    opponentUsername: string;
    opponentDisplayName: string;
    opponentAvatarUrl: string | null;
    rounds: number;
    shotsPerRound: number;
  }) => {
    const battle: ActiveBattle = {
      id: generateId(),
      battle_name: params.battleName,
      opponent_id: params.opponentId,
      opponent_username: params.opponentUsername,
      opponent_display_name: params.opponentDisplayName,
      opponent_avatar_url: params.opponentAvatarUrl,
      rounds: params.rounds,
      shots_per_round: params.shotsPerRound,
    };
    setActiveBattle(battle);
    await AsyncStorage.setItem(ACTIVE_BATTLE_KEY, JSON.stringify(battle));
    console.log('[BattleContext] Battle started directly:', battle.id);
    return battle;
  }, []);

  const completeBattle = useCallback(async (params: {
    userRoundScores: number[];
    opponentRoundScores: number[];
  }) => {
    if (!activeBattle || !userId) return;
    console.log('[BattleContext] Completing battle:', activeBattle.id);

    const userTotal = params.userRoundScores.reduce((a, b) => a + b, 0);
    const oppTotal = params.opponentRoundScores.reduce((a, b) => a + b, 0);
    const totalShots = activeBattle.rounds * activeBattle.shots_per_round;

    const result: BattleResult = {
      id: activeBattle.id,
      battle_name: activeBattle.battle_name,
      user_id: userId,
      opponent_id: activeBattle.opponent_id,
      opponent_username: activeBattle.opponent_username,
      opponent_display_name: activeBattle.opponent_display_name,
      opponent_avatar_url: activeBattle.opponent_avatar_url,
      user_score: userTotal,
      user_total_shots: totalShots,
      opponent_score: oppTotal,
      opponent_total_shots: totalShots,
      user_percentage: totalShots > 0 ? Math.round((userTotal / totalShots) * 100) : 0,
      opponent_percentage: totalShots > 0 ? Math.round((oppTotal / totalShots) * 100) : 0,
      rounds: activeBattle.rounds,
      shots_per_round: activeBattle.shots_per_round,
      user_round_scores: params.userRoundScores,
      opponent_round_scores: params.opponentRoundScores,
      completed_at: new Date().toISOString(),
    };

    const updated = [...battleResults, result];
    setBattleResults(updated);
    await AsyncStorage.setItem(BATTLES_STORAGE_KEY, JSON.stringify(updated));

    setActiveBattle(null);
    await AsyncStorage.removeItem(ACTIVE_BATTLE_KEY);

    console.log('[BattleContext] Battle completed, results saved');
    return result;
  }, [activeBattle, userId, battleResults]);

  const clearActiveBattle = useCallback(async () => {
    setActiveBattle(null);
    await AsyncStorage.removeItem(ACTIVE_BATTLE_KEY);
  }, []);

  const myPendingInvites = useMemo(() => {
    if (!userId) return [];
    return pendingInvites.filter(i => i.to_user_id === userId && i.status === 'pending');
  }, [pendingInvites, userId]);

  const dismissNewInvite = useCallback(() => {
    setHasNewInvite(false);
  }, []);

  return useMemo(() => ({
    userId,
    battleResults,
    activeBattle,
    pendingInvites: myPendingInvites,
    hasNewInvite,
    shouldNavigateToPractice,
    clearNavigateToPractice: () => setShouldNavigateToPractice(false),
    sendInvite: sendInviteMutation.mutateAsync,
    isSendingInvite: sendInviteMutation.isPending,
    acceptInvite,
    declineInvite,
    startBattleDirectly,
    completeBattle,
    clearActiveBattle,
    dismissNewInvite,
  }), [
    userId,
    battleResults,
    activeBattle,
    myPendingInvites,
    hasNewInvite,
    shouldNavigateToPractice,
    sendInviteMutation.mutateAsync,
    sendInviteMutation.isPending,
    acceptInvite,
    declineInvite,
    startBattleDirectly,
    completeBattle,
    clearActiveBattle,
    dismissNewInvite,
  ]);
}

export const [BattleProvider, useBattle] = createContextHook(useBattleState);
