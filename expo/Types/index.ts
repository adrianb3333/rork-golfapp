export type DrawingTool = 'line' | 'circle' | 'angle' | 'freehand' | 'none';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingPath {
  id: string;
  tool: DrawingTool;
  points: Point[];
  color: string;
  strokeWidth: number;
  timestamp: number;
}

export interface SwingMetrics {
  backswingAngle: number | null;
  downswingAngle: number | null;
  impactAngle: number | null;
  followThroughAngle: number | null;
}

export interface VideoState {
  uri: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  isLoaded: boolean;
}

export interface AnalysisSession {
  id: string;
  videoUris: string[];
  createdAt: string;
  isComparison: boolean;
}
