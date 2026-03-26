import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// --- Interfaces ---
export interface NotesState {
  point1: string;
  point2: string;
  point3: string;
}

export interface FocusData {
  id: number;
  name: string;
  content: string;
}

export interface ProfileData {
  profileImage: string | null;
  handicap: string;
  goal1: string;
  goal3: string;
  lowestRound: string;
}

export interface SwingThoughtsData {
  driver: NotesState;
  woods: NotesState;
  irons: NotesState;
  wedges: NotesState;
  chipping: NotesState;
  bunker: NotesState;
  putter: NotesState;
}

export interface UserDataState {
  profile: ProfileData;
  swingThoughts: SwingThoughtsData;
  clubNotes: Record<string, NotesState>;
  mentalGame: { preShotRoutine: string };
  golfIQ: Record<string, string>;
  general: { focuses: FocusData[] };
  preRound: { routine: string };
}

// --- Constants & Defaults ---
const DEFAULT_NOTES_STATE: NotesState = { point1: '', point2: '', point3: '' };

const DEFAULT_USER_DATA: UserDataState = {
  profile: {
    profileImage: null,
    handicap: '',
    goal1: '',
    goal3: '',
    lowestRound: '',
  },
  swingThoughts: {
    driver: DEFAULT_NOTES_STATE,
    woods: DEFAULT_NOTES_STATE,
    irons: DEFAULT_NOTES_STATE,
    wedges: DEFAULT_NOTES_STATE,
    chipping: DEFAULT_NOTES_STATE,
    bunker: DEFAULT_NOTES_STATE,
    putter: DEFAULT_NOTES_STATE,
  },
  clubNotes: {},
  mentalGame: { preShotRoutine: '1:\n\n2:\n\n3:\n' },
  golfIQ: {},
  general: { focuses: [{ id: 1, name: 'My Focus', content: '' }] },
  preRound: { routine: '1:\n\n2:\n\n3:\n' },
};

const USER_DATA_KEY = 'golf_user_data';

export const [UserDataProvider, useUserData] = createContextHook(() => {
  const [userData, setUserData] = useState<UserDataState>(DEFAULT_USER_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // --- Initialization Logic ---
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[useUserData] Initializing data load...');
        
        // 1. Load from Local Storage (Fastest UI response)
        const stored = await AsyncStorage.getItem(USER_DATA_KEY);
        let initialData = DEFAULT_USER_DATA;

        if (stored) {
          initialData = { ...DEFAULT_USER_DATA, ...JSON.parse(stored) };
          setUserData(initialData);
        }

        // 2. Load from Supabase (Source of truth)
        let session = null;
        try {
          const sessionResult = await supabase.auth.getSession();
          session = sessionResult.data?.session;
        } catch (sessionErr) {
          console.warn('[useUserData] Could not get session:', sessionErr);
        }
        if (session?.user) {
          console.log('[useUserData] Fetching from Supabase for user:', session.user.id);
          const { data, error } = await supabase
            .from('user_profiles')
            .select('full_data')
            .eq('user_id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.warn('[useUserData] Supabase fetch error (non-critical):', error?.message || JSON.stringify(error));
          }

          if (data?.full_data) {
            const cloudData = data.full_data as UserDataState;
            setUserData(cloudData);
            // Sync local storage with what we just got from the cloud
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(cloudData));
          }
        }
      } catch (error) {
        console.error('[useUserData] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  // --- Internal Sync Pipeline ---
  const persistData = useCallback(async (newData: UserDataState) => {
    try {
      // Always save to local storage immediately
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(newData));
      console.log('[useUserData] Saved to local storage');

      // Attempt to sync to Supabase if logged in
      let session = null;
      try {
        const sessionResult = await supabase.auth.getSession();
        session = sessionResult.data?.session;
      } catch (sessionErr) {
        console.warn('[useUserData] Could not get session for sync:', sessionErr);
      }
      if (session?.user) {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: session.user.id,
            full_data: newData,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.warn('[useUserData] Supabase sync error (non-critical):', error?.message || JSON.stringify(error));
        } else {
          console.log('[useUserData] Synced to Supabase');
        }
      }
    } catch (error) {
      console.error('[useUserData] Sync error:', error);
    }
  }, []);

  // --- Exposed Update Functions ---

  const updateProfile = useCallback((updates: Partial<ProfileData>) => {
    console.log('[useUserData] Updating profile');
    setUserData(prev => {
      const newData = {
        ...prev,
        profile: { ...prev.profile, ...updates },
      };
      void persistData(newData);
      return newData;
    });
  }, [persistData]);

  const updateSwingThoughts = useCallback((thoughts: SwingThoughtsData) => {
    console.log('[useUserData] Updating swing thoughts');
    setUserData(prev => {
      const newData = { ...prev, swingThoughts: thoughts };
      void persistData(newData);
      return newData;
    });
  }, [persistData]);

  const updateClubNotes = useCallback((club: string, notes: NotesState) => {
    console.log('[useUserData] Updating club notes for:', club);
    setUserData(prev => {
      const newData = {
        ...prev,
        clubNotes: { ...prev.clubNotes, [club]: notes },
      };
      void persistData(newData);
      return newData;
    });
  }, [persistData]);

  const updateMentalGame = useCallback((preShotRoutine: string) => {
    console.log('[useUserData] Updating mental game');
    setUserData(prev => {
      const newData = { ...prev, mentalGame: { preShotRoutine } };
      void persistData(newData);
      return newData;
    });
  }, [persistData]);

  const updateGolfIQ = useCallback((key: string, value: string) => {
    console.log('[useUserData] Updating golf IQ:', key);
    setUserData(prev => {
      const newData = {
        ...prev,
        golfIQ: { ...prev.golfIQ, [key]: value },
      };
      void persistData(newData);
      return newData;
    });
  }, [persistData]);

  const updateGeneral = useCallback((focuses: FocusData[]) => {
    console.log('[useUserData] Updating general focuses:', focuses.length);
    setUserData(prev => {
      const newData = { ...prev, general: { focuses } };
      void persistData(newData);
      return newData;
    });
  }, [persistData]);

  const updatePreRound = useCallback((routine: string) => {
    console.log('[useUserData] Updating pre-round routine');
    setUserData(prev => {
      const newData = { ...prev, preRound: { routine } };
      void persistData(newData);
      return newData;
    });
  }, [persistData]);

  return useMemo(() => ({
    userData,
    isLoading,
    updateProfile,
    updateSwingThoughts,
    updateClubNotes,
    updateMentalGame,
    updateGolfIQ,
    updateGeneral,
    updatePreRound,
  }), [userData, isLoading, updateProfile, updateSwingThoughts, updateClubNotes, updateMentalGame, updateGolfIQ, updateGeneral, updatePreRound]);
});