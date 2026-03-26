import { create } from 'zustand';
import { DrawingPath, DrawingTool, Point, VideoState } from '@/Types';

interface SwingStore {
  video: VideoState;
  video2: VideoState;
  isComparisonMode: boolean;
  activeVideoIndex: 0 | 1;
  drawings: DrawingPath[];
  currentTool: DrawingTool;
  currentColor: string;
  currentStrokeWidth: number;
  activeDrawing: DrawingPath | null;
  canvasSize: { width: number; height: number };

  setVideoUri: (uri: string | null, index?: 0 | 1) => void;
  setDuration: (duration: number, index?: 0 | 1) => void;
  setCurrentTime: (time: number, index?: 0 | 1) => void;
  setIsPlaying: (playing: boolean, index?: 0 | 1) => void;
  setPlaybackRate: (rate: number, index?: 0 | 1) => void;
  setIsLoaded: (loaded: boolean, index?: 0 | 1) => void;
  setComparisonMode: (enabled: boolean) => void;
  setActiveVideoIndex: (index: 0 | 1) => void;
  setCurrentTool: (tool: DrawingTool) => void;
  setCurrentColor: (color: string) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;

  startDrawing: (point: Point) => void;
  continueDrawing: (point: Point) => void;
  finishDrawing: () => void;
  undoDrawing: () => void;
  clearDrawings: () => void;
  clearAll: () => void;
}

const defaultVideoState: VideoState = {
  uri: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  playbackRate: 1.0,
  isLoaded: false,
};

export const useSwingStore = create<SwingStore>((set, get) => ({
  video: { ...defaultVideoState },
  video2: { ...defaultVideoState },
  isComparisonMode: false,
  activeVideoIndex: 0,
  drawings: [],
  currentTool: 'none',
  currentColor: '#00E676',
  currentStrokeWidth: 3,
  activeDrawing: null,
  canvasSize: { width: 0, height: 0 },

  setVideoUri: (uri, index = 0) => {
    const videoState = { ...defaultVideoState, uri };
    if (index === 0) {
      set({ video: videoState, drawings: [] });
    } else {
      set({ video2: videoState, drawings: [] });
    }
  },

  setDuration: (duration, index = get().activeVideoIndex) => {
    if (index === 0) {
      set((state) => ({ video: { ...state.video, duration } }));
    } else {
      set((state) => ({ video2: { ...state.video2, duration } }));
    }
  },

  setCurrentTime: (currentTime, index = get().activeVideoIndex) => {
    if (index === 0) {
      set((state) => ({ video: { ...state.video, currentTime } }));
    } else {
      set((state) => ({ video2: { ...state.video2, currentTime } }));
    }
  },

  setIsPlaying: (isPlaying, index = get().activeVideoIndex) => {
    if (index === 0) {
      set((state) => ({ video: { ...state.video, isPlaying } }));
    } else {
      set((state) => ({ video2: { ...state.video2, isPlaying } }));
    }
  },

  setPlaybackRate: (playbackRate, index = get().activeVideoIndex) => {
    if (index === 0) {
      set((state) => ({ video: { ...state.video, playbackRate } }));
    } else {
      set((state) => ({ video2: { ...state.video2, playbackRate } }));
    }
  },

  setIsLoaded: (isLoaded, index = get().activeVideoIndex) => {
    if (index === 0) {
      set((state) => ({ video: { ...state.video, isLoaded } }));
    } else {
      set((state) => ({ video2: { ...state.video2, isLoaded } }));
    }
  },

  setComparisonMode: (enabled) => set({ isComparisonMode: enabled }),
  setActiveVideoIndex: (index) => set({ activeVideoIndex: index }),

  setCurrentTool: (tool) => set({ currentTool: tool }),
  setCurrentColor: (color) => set({ currentColor: color }),
  setCanvasSize: (size) => set({ canvasSize: size }),

  startDrawing: (point) => {
    const { currentTool, currentColor, currentStrokeWidth, video, video2, activeVideoIndex } = get();
    if (currentTool === 'none') return;
    const activeVideo = activeVideoIndex === 0 ? video : video2;

    const newDrawing: DrawingPath = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      tool: currentTool,
      points: [point],
      color: currentColor,
      strokeWidth: currentStrokeWidth,
      timestamp: activeVideo.currentTime,
    };
    set({ activeDrawing: newDrawing });
  },

  continueDrawing: (point) => {
    const { activeDrawing } = get();
    if (!activeDrawing) return;
    set({
      activeDrawing: {
        ...activeDrawing,
        points: [...activeDrawing.points, point],
      },
    });
  },

  finishDrawing: () => {
    const { activeDrawing, drawings } = get();
    if (!activeDrawing) return;
    if (activeDrawing.points.length < 2) {
      set({ activeDrawing: null });
      return;
    }
    set({
      drawings: [...drawings, activeDrawing],
      activeDrawing: null,
    });
  },

  undoDrawing: () => {
    set((state) => ({
      drawings: state.drawings.slice(0, -1),
    }));
  },

  clearDrawings: () => set({ drawings: [], activeDrawing: null }),

  clearAll: () =>
    set({
      video: { ...defaultVideoState },
      video2: { ...defaultVideoState },
      isComparisonMode: false,
      activeVideoIndex: 0,
      drawings: [],
      activeDrawing: null,
      currentTool: 'none',
    }),
}));
