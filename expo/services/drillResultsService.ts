import { supabase } from '@/lib/supabase';

export interface DrillResultRow {
  id: string;
  user_id: string;
  drill_name: string;
  category: string;
  is_sensor_drill: boolean;
  rounds: number;
  targets_per_round: number;
  total_shots: number;
  round_scores: number[];
  total_hits: number;
  percentage: number;
  completed_at: string;
}

export interface SaveDrillResultParams {
  drillName: string;
  category: string;
  isSensorDrill: boolean;
  rounds: number;
  targetsPerRound: number;
  totalShots: number;
  roundScores: number[];
  totalHits: number;
  percentage: number;
}

export async function saveDrillResult(params: SaveDrillResultParams): Promise<DrillResultRow | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      console.log('[drillResultsService] No authenticated user, skipping Supabase save');
      return null;
    }

    const { data, error } = await supabase
      .from('drill_results')
      .insert({
        user_id: userId,
        drill_name: params.drillName,
        category: params.category,
        is_sensor_drill: params.isSensorDrill,
        rounds: params.rounds,
        targets_per_round: params.targetsPerRound,
        total_shots: params.totalShots,
        round_scores: params.roundScores,
        total_hits: params.totalHits,
        percentage: params.percentage,
      })
      .select()
      .single();

    if (error) {
      console.log('[drillResultsService] Error saving drill result:', error.message);
      return null;
    }

    console.log('[drillResultsService] Drill result saved to Supabase:', data?.id);
    return data as DrillResultRow;
  } catch (e) {
    console.log('[drillResultsService] Exception saving drill result:', e);
    return null;
  }
}

export async function fetchDrillHistory(): Promise<DrillResultRow[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      console.log('[drillResultsService] No authenticated user, cannot fetch history');
      return [];
    }

    const { data, error } = await supabase
      .from('drill_results')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.log('[drillResultsService] Error fetching drill history:', error.message);
      return [];
    }

    console.log('[drillResultsService] Fetched', data?.length ?? 0, 'drill results from Supabase');
    return (data as DrillResultRow[]) ?? [];
  } catch (e) {
    console.log('[drillResultsService] Exception fetching drill history:', e);
    return [];
  }
}
