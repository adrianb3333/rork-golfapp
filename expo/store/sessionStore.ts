import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisSession } from '@/Types';

interface SessionState {
  sessions: AnalysisSession[];
  addSession: (videoUris: string[]) => void;
  removeSession: (id: string) => void;
  clearHistory: () => void;
}

export const useSessions = create<SessionState>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (videoUris: string[]) =>
        set((state) => ({
          sessions: [
            {
              id: Math.random().toString(36).substring(7),
              videoUris,
              createdAt: new Date().toISOString(),
              isComparison: videoUris.length > 1,
            },
            ...(state.sessions || []),
          ],
        })),
      removeSession: (id: string) =>
        set((state) => ({
          sessions: (state.sessions || []).filter((s) => s.id !== id),
        })),
      clearHistory: () => set({ sessions: [] }),
    }),
    {
      name: 'golf-sessions-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);