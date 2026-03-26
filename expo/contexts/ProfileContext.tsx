import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface FollowRelation {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

const avatarCacheMap = new Map<string, string>();
let avatarCacheBuster = Date.now();

function resolveAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) {
    if (avatarPath.includes('supabase') && !avatarPath.includes('_cb=')) {
      return `${avatarPath}${avatarPath.includes('?') ? '&' : '?'}_cb=${avatarCacheBuster}`;
    }
    return avatarPath;
  }
  const cacheKey = `${avatarPath}_${avatarCacheBuster}`;
  const cached = avatarCacheMap.get(cacheKey);
  if (cached) return cached;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  const url = `${data.publicUrl}?_cb=${avatarCacheBuster}`;
  avatarCacheMap.set(cacheKey, url);
  return url;
}

function invalidateAvatarCache() {
  avatarCacheBuster = Date.now();
  avatarCacheMap.clear();
}

function resolveProfileAvatar(profile: UserProfile): UserProfile {
  return { ...profile, avatar_url: resolveAvatarUrl(profile.avatar_url) };
}

const BG_IMAGE_KEY_PREFIX = 'profile_background_image';
const COACH_MODE_KEY_PREFIX = 'coach_mode_activated';
const CREW_NAME_KEY_PREFIX = 'crew_name';
const CREW_COLOR_KEY_PREFIX = 'crew_color';
const CREW_LOGO_KEY_PREFIX = 'crew_logo';
const CREW_PLAYERS_KEY_PREFIX = 'crew_players';
const CREW_MANAGERS_KEY_PREFIX = 'crew_managers';
const CREW_DRILLS_KEY_PREFIX = 'crew_drills';
const CREW_SCHEDULED_KEY_PREFIX = 'crew_scheduled';
const CREW_ROUNDS_KEY_PREFIX = 'crew_rounds';
const CREW_SCHEDULED_ROUNDS_KEY_PREFIX = 'crew_scheduled_rounds';
const CREW_TOURNAMENTS_KEY_PREFIX = 'crew_tournaments';
const CREW_SCHEDULED_TOURNAMENTS_KEY_PREFIX = 'crew_scheduled_tournaments';
const CREW_INVITES_KEY_PREFIX = 'crew_invites';
const CREW_MEMBERSHIP_KEY_PREFIX = 'crew_membership';

function userKey(prefix: string, uid: string | null): string {
  return uid ? `${prefix}_${uid}` : prefix;
}

export type CrewRole = 'leader' | 'manager' | 'player' | null;

export interface CrewDrill {
  id: string;
  name: string;
  category: string;
  rounds: number;
  shotsPerRound: number;
  totalShots: number;
  acceptedDistances: number[];
  info: string;
  createdAt: number;
}

export interface ScheduledDrill {
  id: string;
  drillId: string;
  drillName: string;
  date: string;
  time: string;
  createdAt: number;
}

export interface CrewRoundGroup {
  id: string;
  players: string[];
}

export interface CrewRound {
  id: string;
  name: string;
  groups: CrewRoundGroup[];
  courseName: string;
  courseClubName?: string;
  courseCity?: string;
  courseCountry?: string;
  holeOption: string;
  info: string;
  createdAt: number;
}

export interface ScheduledRound {
  id: string;
  roundId: string;
  roundName: string;
  courseName?: string;
  courseClubName?: string;
  courseCity?: string;
  courseCountry?: string;
  holeOption?: string;
  groups?: CrewRoundGroup[];
  info?: string;
  date: string;
  time: string;
  createdAt: number;
}

export interface CrewTournament {
  id: string;
  name: string;
  info: string;
  courseName: string;
  courseClubName?: string;
  courseCity?: string;
  courseCountry?: string;
  holeOption: string;
  format: string;
  totalRounds?: number;
  groups: CrewRoundGroup[];
  createdAt: number;
}

export interface ScheduledTournament {
  id: string;
  tournamentId: string;
  tournamentName: string;
  courseName?: string;
  courseClubName?: string;
  courseCity?: string;
  courseCountry?: string;
  holeOption?: string;
  format?: string;
  totalRounds?: number;
  groups?: CrewRoundGroup[];
  info?: string;
  date: string;
  time: string;
  createdAt: number;
}

export interface CrewSettings {
  name: string;
  color: string;
  logo: string | null;
  players: string[];
  managers: string[];
}

export interface CrewInvite {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'player' | 'manager';
  status: 'pending' | 'accepted' | 'declined';
  crewName: string;
  createdAt: number;
}

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [backgroundImageUri, setBackgroundImageUriState] = useState<string | null>(null);
  const [isCoachMode, setIsCoachModeState] = useState<boolean>(false);
  const [crewName, setCrewNameState] = useState<string>('');
  const [crewColor, setCrewColorState] = useState<string>('#1A1A1A');
  const [crewLogo, setCrewLogoState] = useState<string | null>(null);
  const [crewPlayers, setCrewPlayersState] = useState<string[]>([]);
  const [crewManagers, setCrewManagersState] = useState<string[]>([]);
  const [crewDrills, setCrewDrillsState] = useState<CrewDrill[]>([]);
  const [crewScheduled, setCrewScheduledState] = useState<ScheduledDrill[]>([]);
  const [crewRounds, setCrewRoundsState] = useState<CrewRound[]>([]);
  const [crewScheduledRounds, setCrewScheduledRoundsState] = useState<ScheduledRound[]>([]);
  const [crewTournaments, setCrewTournamentsState] = useState<CrewTournament[]>([]);
  const [crewScheduledTournaments, setCrewScheduledTournamentsState] = useState<ScheduledTournament[]>([]);
  const [crewInvites, setCrewInvitesState] = useState<CrewInvite[]>([]);
  const [crewMembershipRole, setCrewMembershipRoleState] = useState<CrewRole>(null);

  useEffect(() => {
    if (!userId) {
      setBackgroundImageUriState(null);
      setIsCoachModeState(false);
      setCrewNameState('');
      setCrewColorState('#1A1A1A');
      setCrewLogoState(null);
      setCrewPlayersState([]);
      setCrewManagersState([]);
      setCrewDrillsState([]);
      setCrewScheduledState([]);
      setCrewRoundsState([]);
      setCrewScheduledRoundsState([]);
      setCrewTournamentsState([]);
      setCrewScheduledTournamentsState([]);
      setCrewInvitesState([]);
      setCrewMembershipRoleState(null);
      return;
    }
    console.log('[ProfileContext] Loading user-scoped storage for:', userId);
    AsyncStorage.getItem(userKey(BG_IMAGE_KEY_PREFIX, userId)).then((val) => {
      if (val) {
        console.log('[ProfileContext] Loaded background image from storage');
        setBackgroundImageUriState(val);
      } else {
        setBackgroundImageUriState(null);
      }
    }).catch(() => {});
    AsyncStorage.getItem(userKey(COACH_MODE_KEY_PREFIX, userId)).then((val) => {
      if (val === 'true') {
        console.log('[ProfileContext] Coach mode loaded from storage');
        setIsCoachModeState(true);
      } else {
        setIsCoachModeState(false);
      }
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_NAME_KEY_PREFIX, userId)).then((val) => {
      setCrewNameState(val || '');
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_COLOR_KEY_PREFIX, userId)).then((val) => {
      setCrewColorState(val || '#1A1A1A');
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_LOGO_KEY_PREFIX, userId)).then((val) => {
      setCrewLogoState(val || null);
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_PLAYERS_KEY_PREFIX, userId)).then((val) => {
      setCrewPlayersState(val ? JSON.parse(val) : []);
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_MANAGERS_KEY_PREFIX, userId)).then((val) => {
      setCrewManagersState(val ? JSON.parse(val) : []);
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_DRILLS_KEY_PREFIX, userId)).then((val) => {
      setCrewDrillsState(val ? JSON.parse(val) : []);
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_SCHEDULED_KEY_PREFIX, userId)).then((val) => {
      setCrewScheduledState(val ? JSON.parse(val) : []);
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_ROUNDS_KEY_PREFIX, userId)).then((val) => {
      setCrewRoundsState(val ? JSON.parse(val) : []);
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_SCHEDULED_ROUNDS_KEY_PREFIX, userId)).then((val) => {
      setCrewScheduledRoundsState(val ? JSON.parse(val) : []);
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_TOURNAMENTS_KEY_PREFIX, userId)).then((val) => {
      setCrewTournamentsState(val ? JSON.parse(val) : []);
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_SCHEDULED_TOURNAMENTS_KEY_PREFIX, userId)).then((val) => {
      setCrewScheduledTournamentsState(val ? JSON.parse(val) : []);
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_INVITES_KEY_PREFIX, userId)).then((val) => {
      setCrewInvitesState(val ? JSON.parse(val) : []);
    }).catch(() => {});
    AsyncStorage.getItem(userKey(CREW_MEMBERSHIP_KEY_PREFIX, userId)).then((val) => {
      if (val) {
        console.log('[ProfileContext] Loaded crew membership role:', val);
        setCrewMembershipRoleState(val as CrewRole);
      } else {
        setCrewMembershipRoleState(null);
      }
    }).catch(() => {});
  }, [userId]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[ProfileContext] Got session user:', session?.user?.id);
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[ProfileContext] Auth changed, user:', session?.user?.id);
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      console.log('[ProfileContext] Fetching profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.log('[ProfileContext] Profile fetch error:', error.message);
        if (error.code === 'PGRST116') {
          console.log('[ProfileContext] No profile found, creating one...');
          const { data: authUser } = await supabase.auth.getUser();
          const newProfile = {
            id: userId,
            username: authUser.user?.email?.split('@')[0] ?? 'user',
            display_name: authUser.user?.email?.split('@')[0] ?? 'User',
            avatar_url: null,
          };
          const { data: created, error: createErr } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
          if (createErr) {
            console.error('[ProfileContext] Create profile error:', createErr.message);
            return resolveProfileAvatar(newProfile as UserProfile);
          }
          return resolveProfileAvatar(created as UserProfile);
        }
        return null;
      }
      return resolveProfileAvatar(data as UserProfile);
    },
    enabled: !!userId,
  });

  const followersQuery = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      if (!userId) return [];
      console.log('[ProfileContext] Fetching followers for:', userId);
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id, profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)')
        .eq('following_id', userId);
      if (error) {
        console.log('[ProfileContext] Followers error:', error.message);
        return [];
      }
      return (data ?? []).map((f: any) => f.profiles as UserProfile).filter(Boolean).map(resolveProfileAvatar);
    },
    enabled: !!userId,
  });

  const allUsersQuery = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      console.log('[ProfileContext] Fetching all users');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .order('display_name', { ascending: true });
      if (error) {
        console.log('[ProfileContext] All users error:', error.message);
        return [];
      }
      return (data ?? []).filter((u: any) => u.id !== userId).map((u: any) => resolveProfileAvatar(u as UserProfile));
    },
    enabled: !!userId,
  });

  const followingQuery = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      if (!userId) return [];
      console.log('[ProfileContext] Fetching following for:', userId);
      const { data, error } = await supabase
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey(id, username, display_name, avatar_url)')
        .eq('follower_id', userId);
      if (error) {
        console.log('[ProfileContext] Following error:', error.message);
        return [];
      }
      return (data ?? []).map((f: any) => f.profiles as UserProfile).filter(Boolean).map(resolveProfileAvatar);
    },
    enabled: !!userId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { username?: string; display_name?: string; avatar_url?: string | null }) => {
      if (!userId) throw new Error('Not authenticated');
      console.log('[ProfileContext] Updating profile via upsert:', updates);
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: updates.username,
          display_name: updates.display_name,
          avatar_url: updates.avatar_url,
          updated_at: new Date(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!userId) throw new Error('Not authenticated');
      console.log('[ProfileContext] Toggle follow for:', targetUserId);
      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)
        .single();

      if (existing) {
        console.log('[ProfileContext] Unfollowing:', targetUserId);
        await supabase.from('follows').delete().eq('id', existing.id);
        return { action: 'unfollowed' as const, targetUserId };
      } else {
        console.log('[ProfileContext] Following:', targetUserId);
        await supabase.from('follows').insert({ follower_id: userId, following_id: targetUserId });
        return { action: 'followed' as const, targetUserId };
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      void queryClient.invalidateQueries({ queryKey: ['following', userId] });
    },
  });

  const setBackgroundImage = useCallback(async (uri: string | null) => {
    console.log('[ProfileContext] Setting background image:', uri ? 'has image' : 'cleared');
    setBackgroundImageUriState(uri);
    if (uri) {
      await AsyncStorage.setItem(userKey(BG_IMAGE_KEY_PREFIX, userId), uri);
    } else {
      await AsyncStorage.removeItem(userKey(BG_IMAGE_KEY_PREFIX, userId));
    }
  }, [userId]);

  const activateCoachMode = useCallback(async () => {
    console.log('[ProfileContext] Activating coach mode');
    setIsCoachModeState(true);
    await AsyncStorage.setItem(userKey(COACH_MODE_KEY_PREFIX, userId), 'true');
  }, [userId]);

  const deactivateCoachMode = useCallback(async () => {
    console.log('[ProfileContext] Deactivating coach mode');
    setIsCoachModeState(false);
    await AsyncStorage.removeItem(userKey(COACH_MODE_KEY_PREFIX, userId));
  }, [userId]);

  const saveCrewDrill = useCallback(async (drill: CrewDrill) => {
    console.log('[ProfileContext] Saving crew drill:', drill.name);
    const updated = [...crewDrills, drill];
    setCrewDrillsState(updated);
    await AsyncStorage.setItem(userKey(CREW_DRILLS_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewDrills, userId]);

  const deleteCrewDrill = useCallback(async (drillId: string) => {
    console.log('[ProfileContext] Deleting crew drill:', drillId);
    const updated = crewDrills.filter((d) => d.id !== drillId);
    setCrewDrillsState(updated);
    await AsyncStorage.setItem(userKey(CREW_DRILLS_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewDrills, userId]);

  const saveScheduledDrill = useCallback(async (scheduled: ScheduledDrill) => {
    console.log('[ProfileContext] Saving scheduled drill:', scheduled.drillName);
    const updated = [...crewScheduled, scheduled];
    setCrewScheduledState(updated);
    await AsyncStorage.setItem(userKey(CREW_SCHEDULED_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewScheduled, userId]);

  const deleteScheduledDrill = useCallback(async (scheduledId: string) => {
    console.log('[ProfileContext] Deleting scheduled drill:', scheduledId);
    const updated = crewScheduled.filter((s) => s.id !== scheduledId);
    setCrewScheduledState(updated);
    await AsyncStorage.setItem(userKey(CREW_SCHEDULED_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewScheduled, userId]);

  const saveCrewRound = useCallback(async (round: CrewRound) => {
    console.log('[ProfileContext] Saving crew round:', round.name);
    const updated = [...crewRounds, round];
    setCrewRoundsState(updated);
    await AsyncStorage.setItem(userKey(CREW_ROUNDS_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewRounds, userId]);

  const deleteCrewRound = useCallback(async (roundId: string) => {
    console.log('[ProfileContext] Deleting crew round:', roundId);
    const updated = crewRounds.filter((r) => r.id !== roundId);
    setCrewRoundsState(updated);
    await AsyncStorage.setItem(userKey(CREW_ROUNDS_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewRounds, userId]);

  const saveScheduledRound = useCallback(async (scheduled: ScheduledRound) => {
    console.log('[ProfileContext] Saving scheduled round:', scheduled.roundName);
    const updated = [...crewScheduledRounds, scheduled];
    setCrewScheduledRoundsState(updated);
    await AsyncStorage.setItem(userKey(CREW_SCHEDULED_ROUNDS_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewScheduledRounds, userId]);

  const deleteScheduledRound = useCallback(async (scheduledId: string) => {
    console.log('[ProfileContext] Deleting scheduled round:', scheduledId);
    const updated = crewScheduledRounds.filter((s) => s.id !== scheduledId);
    setCrewScheduledRoundsState(updated);
    await AsyncStorage.setItem(userKey(CREW_SCHEDULED_ROUNDS_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewScheduledRounds, userId]);

  const saveCrewTournament = useCallback(async (tournament: CrewTournament) => {
    console.log('[ProfileContext] Saving crew tournament:', tournament.name);
    const updated = [...crewTournaments, tournament];
    setCrewTournamentsState(updated);
    await AsyncStorage.setItem(userKey(CREW_TOURNAMENTS_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewTournaments, userId]);

  const deleteCrewTournament = useCallback(async (tournamentId: string) => {
    console.log('[ProfileContext] Deleting crew tournament:', tournamentId);
    const updated = crewTournaments.filter((t) => t.id !== tournamentId);
    setCrewTournamentsState(updated);
    await AsyncStorage.setItem(userKey(CREW_TOURNAMENTS_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewTournaments, userId]);

  const saveScheduledTournament = useCallback(async (scheduled: ScheduledTournament) => {
    console.log('[ProfileContext] Saving scheduled tournament:', scheduled.tournamentName);
    const updated = [...crewScheduledTournaments, scheduled];
    setCrewScheduledTournamentsState(updated);
    await AsyncStorage.setItem(userKey(CREW_SCHEDULED_TOURNAMENTS_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewScheduledTournaments, userId]);

  const deleteScheduledTournament = useCallback(async (scheduledId: string) => {
    console.log('[ProfileContext] Deleting scheduled tournament:', scheduledId);
    const updated = crewScheduledTournaments.filter((s) => s.id !== scheduledId);
    setCrewScheduledTournamentsState(updated);
    await AsyncStorage.setItem(userKey(CREW_SCHEDULED_TOURNAMENTS_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewScheduledTournaments, userId]);

  const saveCrewSettings = useCallback(async (settings: CrewSettings) => {
    console.log('[ProfileContext] Saving crew settings:', settings.name, settings.color);
    const previousPlayers = crewPlayers;
    const previousManagers = crewManagers;
    const newPlayers = settings.players.filter((id) => !previousPlayers.includes(id));
    const newManagers = settings.managers.filter((id) => !previousManagers.includes(id));

    const newInvites: CrewInvite[] = [];
    const allUsersList = allUsersQuery.data ?? [];

    newPlayers.forEach((playerId) => {
      const user = allUsersList.find((u) => u.id === playerId);
      if (user) {
        newInvites.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 10),
          userId: user.id,
          username: user.username,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          role: 'player',
          status: 'pending',
          crewName: settings.name || 'Crew',
          createdAt: Date.now(),
        });
      }
    });

    newManagers.forEach((managerId) => {
      const user = allUsersList.find((u) => u.id === managerId);
      if (user) {
        newInvites.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 10),
          userId: user.id,
          username: user.username,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          role: 'manager',
          status: 'pending',
          crewName: settings.name || 'Crew',
          createdAt: Date.now(),
        });
      }
    });

    if (newInvites.length > 0) {
      const updatedInvites = [...crewInvites, ...newInvites];
      setCrewInvitesState(updatedInvites);
      await AsyncStorage.setItem(userKey(CREW_INVITES_KEY_PREFIX, userId), JSON.stringify(updatedInvites));
      console.log('[ProfileContext] Created', newInvites.length, 'crew invites');
    }

    const acceptedPlayerIds = crewInvites.filter((i) => i.role === 'player' && i.status === 'accepted').map((i) => i.userId);
    const acceptedManagerIds = crewInvites.filter((i) => i.role === 'manager' && i.status === 'accepted').map((i) => i.userId);
    const confirmedPlayers = settings.players.filter((id) => previousPlayers.includes(id) || acceptedPlayerIds.includes(id));
    const confirmedManagers = settings.managers.filter((id) => previousManagers.includes(id) || acceptedManagerIds.includes(id));

    setCrewNameState(settings.name);
    setCrewColorState(settings.color);
    setCrewLogoState(settings.logo);
    setCrewPlayersState(confirmedPlayers);
    setCrewManagersState(confirmedManagers);
    await AsyncStorage.setItem(userKey(CREW_NAME_KEY_PREFIX, userId), settings.name);
    await AsyncStorage.setItem(userKey(CREW_COLOR_KEY_PREFIX, userId), settings.color);
    if (settings.logo) {
      await AsyncStorage.setItem(userKey(CREW_LOGO_KEY_PREFIX, userId), settings.logo);
    } else {
      await AsyncStorage.removeItem(userKey(CREW_LOGO_KEY_PREFIX, userId));
    }
    await AsyncStorage.setItem(userKey(CREW_PLAYERS_KEY_PREFIX, userId), JSON.stringify(confirmedPlayers));
    await AsyncStorage.setItem(userKey(CREW_MANAGERS_KEY_PREFIX, userId), JSON.stringify(confirmedManagers));
  }, [crewPlayers, crewManagers, crewInvites, allUsersQuery.data, userId]);

  const acceptCrewInvite = useCallback(async (inviteId: string) => {
    console.log('[ProfileContext] Accepting crew invite:', inviteId);
    const updated = crewInvites.map((i) => i.id === inviteId ? { ...i, status: 'accepted' as const } : i);
    setCrewInvitesState(updated);
    await AsyncStorage.setItem(userKey(CREW_INVITES_KEY_PREFIX, userId), JSON.stringify(updated));

    const invite = updated.find((i) => i.id === inviteId);
    if (invite) {
      if (invite.role === 'player') {
        const newPlayers = [...crewPlayers, invite.userId].filter((v, i, a) => a.indexOf(v) === i);
        setCrewPlayersState(newPlayers);
        await AsyncStorage.setItem(userKey(CREW_PLAYERS_KEY_PREFIX, userId), JSON.stringify(newPlayers));
        setCrewMembershipRoleState('player');
        await AsyncStorage.setItem(userKey(CREW_MEMBERSHIP_KEY_PREFIX, userId), 'player');
        console.log('[ProfileContext] User accepted as player, crew membership set');
      } else {
        const newManagers = [...crewManagers, invite.userId].filter((v, i, a) => a.indexOf(v) === i);
        setCrewManagersState(newManagers);
        await AsyncStorage.setItem(userKey(CREW_MANAGERS_KEY_PREFIX, userId), JSON.stringify(newManagers));
        setCrewMembershipRoleState('manager');
        await AsyncStorage.setItem(userKey(CREW_MEMBERSHIP_KEY_PREFIX, userId), 'manager');
        console.log('[ProfileContext] User accepted as manager, crew membership set');
      }
    }
  }, [crewInvites, crewPlayers, crewManagers, userId]);

  const declineCrewInvite = useCallback(async (inviteId: string) => {
    console.log('[ProfileContext] Declining crew invite:', inviteId);
    const updated = crewInvites.map((i) => i.id === inviteId ? { ...i, status: 'declined' as const } : i);
    setCrewInvitesState(updated);
    await AsyncStorage.setItem(userKey(CREW_INVITES_KEY_PREFIX, userId), JSON.stringify(updated));
  }, [crewInvites, userId]);

  const pendingCrewInvites = useMemo(() => {
    return crewInvites.filter((i) => i.status === 'pending');
  }, [crewInvites]);

  const crewRole = useMemo<CrewRole>(() => {
    if (isCoachMode) return 'leader';
    if (crewMembershipRole === 'manager') return 'manager';
    if (crewMembershipRole === 'player') return 'player';
    return null;
  }, [isCoachMode, crewMembershipRole]);

  const hasCrewAccess = useMemo(() => {
    return crewRole !== null;
  }, [crewRole]);

  const uploadAvatar = useCallback(async (uri: string) => {
    if (!userId) throw new Error('Not authenticated');
    console.log('[ProfileContext] Uploading avatar from:', uri, 'platform:', Platform.OS);
    const fileName = `${userId}/profile.jpg`;

    let uploadBody: ArrayBuffer | Blob;

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      uploadBody = await response.blob();
      console.log('[ProfileContext] Web blob ready, size:', (uploadBody as Blob).size);
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('[ProfileContext] Read base64, length:', base64.length);
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      uploadBody = bytes.buffer as ArrayBuffer;
      console.log('[ProfileContext] Converted to ArrayBuffer, byteLength:', uploadBody.byteLength);
    }

    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, uploadBody, { upsert: true, contentType: 'image/jpeg' });

    if (uploadError) {
      console.error('[ProfileContext] Upload error:', uploadError.message);
      throw uploadError;
    }
    console.log('[ProfileContext] Upload success:', data);

    invalidateAvatarCache();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: fileName })
      .eq('id', userId);

    if (updateError) {
      console.error('[ProfileContext] Profile update error:', updateError.message);
      throw updateError;
    }

    console.log('[ProfileContext] Profile avatar_url updated to:', fileName);

    const resolvedUrl = resolveAvatarUrl(fileName);
    console.log('[ProfileContext] Resolved avatar URL:', resolvedUrl);

    const currentProfile = queryClient.getQueryData<UserProfile | null>(['profile', userId]);
    if (currentProfile) {
      queryClient.setQueryData(['profile', userId], {
        ...currentProfile,
        avatar_url: resolvedUrl,
      });
      console.log('[ProfileContext] Optimistically updated profile cache with new avatar');
    }

    void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    void queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    return fileName;
  }, [userId, queryClient]);

  const isFollowing = useCallback((targetUserId: string) => {
    return (followingQuery.data ?? []).some((u) => u.id === targetUserId);
  }, [followingQuery.data]);

  const refetchAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    void queryClient.invalidateQueries({ queryKey: ['followers', userId] });
    void queryClient.invalidateQueries({ queryKey: ['following', userId] });
    void queryClient.invalidateQueries({ queryKey: ['allUsers'] });
  }, [queryClient, userId]);

  return useMemo(() => ({
    userId,
    profile: profileQuery.data ?? null,
    isLoading: profileQuery.isLoading,
    followers: followersQuery.data ?? [],
    following: followingQuery.data ?? [],
    followersCount: (followersQuery.data ?? []).length,
    followingCount: (followingQuery.data ?? []).length,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    toggleFollow: toggleFollowMutation.mutateAsync,
    isTogglingFollow: toggleFollowMutation.isPending,
    uploadAvatar,
    isFollowing,
    allUsers: allUsersQuery.data ?? [],
    isLoadingAllUsers: allUsersQuery.isLoading,
    refetchAll,
    backgroundImageUri,
    setBackgroundImage,
    isCoachMode,
    activateCoachMode,
    deactivateCoachMode,
    crewName,
    crewColor,
    crewLogo,
    crewPlayers,
    crewManagers,
    crewDrills,
    saveCrewDrill,
    deleteCrewDrill,
    crewScheduled,
    saveScheduledDrill,
    deleteScheduledDrill,
    crewRounds,
    saveCrewRound,
    deleteCrewRound,
    crewScheduledRounds,
    saveScheduledRound,
    deleteScheduledRound,
    crewTournaments,
    saveCrewTournament,
    deleteCrewTournament,
    crewScheduledTournaments,
    saveScheduledTournament,
    deleteScheduledTournament,
    saveCrewSettings,
    crewInvites,
    pendingCrewInvites,
    acceptCrewInvite,
    declineCrewInvite,
    crewRole,
    hasCrewAccess,
    crewMembershipRole,
  }), [
    userId,
    profileQuery.data,
    profileQuery.isLoading,
    followersQuery.data,
    followingQuery.data,
    updateProfileMutation.mutateAsync,
    updateProfileMutation.isPending,
    toggleFollowMutation.mutateAsync,
    toggleFollowMutation.isPending,
    uploadAvatar,
    isFollowing,
    allUsersQuery.data,
    allUsersQuery.isLoading,
    refetchAll,
    backgroundImageUri,
    setBackgroundImage,
    isCoachMode,
    activateCoachMode,
    deactivateCoachMode,
    crewName,
    crewColor,
    crewLogo,
    crewPlayers,
    crewManagers,
    crewDrills,
    saveCrewDrill,
    deleteCrewDrill,
    crewScheduled,
    saveScheduledDrill,
    deleteScheduledDrill,
    crewRounds,
    saveCrewRound,
    deleteCrewRound,
    crewScheduledRounds,
    saveScheduledRound,
    deleteScheduledRound,
    crewTournaments,
    saveCrewTournament,
    deleteCrewTournament,
    crewScheduledTournaments,
    saveScheduledTournament,
    deleteScheduledTournament,
    saveCrewSettings,
    crewInvites,
    pendingCrewInvites,
    acceptCrewInvite,
    declineCrewInvite,
    crewRole,
    hasCrewAccess,
    crewMembershipRole,
  ]);
});
