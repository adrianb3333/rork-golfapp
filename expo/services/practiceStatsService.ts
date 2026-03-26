export interface DrillRecord {
  id: string;
  drill_name: string;
  score: number;
  created_at: string;
}

export interface DrillCategoryStats {
  category: string;
  drills: {
    name: string;
    avgScore: number;
    bestScore: number;
    totalAttempts: number;
    recentScores: number[];
  }[];
  overallAvg: number;
  totalAttempts: number;
}

export async function fetchPracticeStats(): Promise<DrillCategoryStats[]> {
  console.log('[PracticeStats] Returning empty practice stats');
  return [];
}
