import { supabase } from '@/lib/supabase';
import type { RoundStats, ScoreCategory } from '@/services/statsHelper';

export interface SupabaseHoleRow {
  hole_number: number;
  par: number;
  score: number;
  fairway_status: string | null;
  gir: boolean;
  gir_miss_direction: string | null;
  putts: number;
  first_putt_length_feet: number;
  bunker_shots: number;
  penalty_shots: number;
  chips: number;
  sand_save: boolean;
  up_and_down: boolean;
}

export interface RoundRow {
  id: string;
  course_name: string;
  created_at: string;
  is_completed: boolean;
}

function computeStatsFromRows(rows: SupabaseHoleRow[]): RoundStats {
  let totalShots = 0;
  let totalPar = 0;
  let holesPlayed = 0;

  let hio = 0;
  let albatross = 0;
  let eagle = 0;
  let birdie = 0;
  let par = 0;
  let bogey = 0;
  let doubleBogey = 0;
  let tripleBogey = 0;
  let worse = 0;

  let fairwayHit = 0;
  let fairwayMissLeft = 0;
  let fairwayMissRight = 0;
  let fairwayTotal = 0;

  let girMade = 0;
  let girMissShort = 0;
  let girMissLong = 0;
  let girMissLeft = 0;
  let girMissRight = 0;
  let girTotal = 0;

  let putts1 = 0;
  let putts2 = 0;
  let putts3 = 0;
  let putts4Plus = 0;
  let totalPutts = 0;

  let totalBunker = 0;
  let totalPenalty = 0;
  let totalChips = 0;
  let totalSandSaves = 0;
  let totalSandSaveAttempts = 0;
  let totalUpAndDowns = 0;
  let totalUpAndDownAttempts = 0;

  for (const row of rows) {
    if (row.score <= 0) continue;

    holesPlayed++;
    totalShots += row.score;
    totalPar += row.par;

    const diff = row.score - row.par;

    if (row.score === 1) hio++;
    else if (diff <= -3) albatross++;
    else if (diff === -2) eagle++;
    else if (diff === -1) birdie++;
    else if (diff === 0) par++;
    else if (diff === 1) bogey++;
    else if (diff === 2) doubleBogey++;
    else if (diff === 3) tripleBogey++;
    else worse++;

    if (row.fairway_status && row.fairway_status !== 'n/a') {
      fairwayTotal++;
      if (row.fairway_status === 'hit') fairwayHit++;
      else if (row.fairway_status === 'miss_left') fairwayMissLeft++;
      else if (row.fairway_status === 'miss_right') fairwayMissRight++;
    }

    if (row.gir_miss_direction) {
      girTotal++;
      if (row.gir || row.gir_miss_direction === 'none') girMade++;
      else if (row.gir_miss_direction === 'short') girMissShort++;
      else if (row.gir_miss_direction === 'long') girMissLong++;
      else if (row.gir_miss_direction === 'left') girMissLeft++;
      else if (row.gir_miss_direction === 'right') girMissRight++;
    }

    totalPutts += row.putts;
    if (row.putts === 1) putts1++;
    else if (row.putts === 2) putts2++;
    else if (row.putts === 3) putts3++;
    else if (row.putts >= 4) putts4Plus++;

    totalBunker += row.bunker_shots;
    totalPenalty += row.penalty_shots;
    totalChips += row.chips;

    if (row.bunker_shots > 0) totalSandSaveAttempts++;
    if (row.sand_save) totalSandSaves++;

    if (row.gir_miss_direction && row.gir_miss_direction !== 'none') {
      totalUpAndDownAttempts++;
      if (row.up_and_down) totalUpAndDowns++;
    }
  }

  const scoreCategories: ScoreCategory[] = [];
  const addCategory = (label: string, count: number, color: string) => {
    if (count > 0) {
      scoreCategories.push({
        label,
        count,
        percentage: holesPlayed > 0 ? Math.round((count / holesPlayed) * 100) : 0,
        color,
      });
    }
  };

  addCategory('HIO', hio, '#FFD700');
  addCategory('ALBATROSS', albatross, '#FF69B4');
  addCategory('EAGLE', eagle, '#4CAF50');
  addCategory('BIRDIE', birdie, '#e53935');
  addCategory('PAR', par, '#FFFFFF');
  addCategory('BOGEY', bogey, '#42A5F5');
  addCategory('D.BOGEY', doubleBogey, '#1565C0');
  addCategory('TRIPLE', tripleBogey, '#333333');
  addCategory('WORSE', worse, '#9E9E9E');

  const avgPutts = holesPlayed > 0 ? Math.round((totalPutts / holesPlayed) * 10) / 10 : 0;

  return {
    totalShots,
    totalPar,
    scoreToPar: totalShots - totalPar,
    scoreCategories,
    fairwayHit,
    fairwayMissLeft,
    fairwayMissRight,
    fairwayTotal,
    girMade,
    girMissShort,
    girMissLong,
    girMissLeft,
    girMissRight,
    girTotal,
    putts1,
    putts2,
    putts3,
    putts4Plus,
    totalPutts,
    avgPutts,
    totalBunker,
    totalPenalty,
    totalChips,
    totalSandSaves,
    totalSandSaveAttempts,
    totalUpAndDowns,
    totalUpAndDownAttempts,
    holesPlayed,
  };
}

export async function fetchLastRoundStats(): Promise<{ stats: RoundStats; round: RoundRow } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[RoundStatsService] No user');
      return null;
    }

    const { data: rounds, error: roundError } = await supabase
      .from('rounds')
      .select('id, course_name, created_at, is_completed')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (roundError || !rounds || rounds.length === 0) {
      console.log('[RoundStatsService] No completed rounds found');
      return null;
    }

    const lastRound = rounds[0] as RoundRow;

    const { data: holeRows, error: holeError } = await supabase
      .from('hole_scores')
      .select('*')
      .eq('round_id', lastRound.id)
      .order('hole_number', { ascending: true });

    if (holeError || !holeRows) {
      console.log('[RoundStatsService] Error fetching hole scores:', holeError?.message);
      return null;
    }

    const stats = computeStatsFromRows(holeRows as SupabaseHoleRow[]);
    console.log('[RoundStatsService] Last round stats computed, holes:', stats.holesPlayed);
    return { stats, round: lastRound };
  } catch (e) {
    console.error('[RoundStatsService] fetchLastRoundStats error:', e);
    return null;
  }
}

export async function fetchAllTimeStats(): Promise<RoundStats | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[RoundStatsService] No user');
      return null;
    }

    const { data: rounds, error: roundError } = await supabase
      .from('rounds')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_completed', true);

    if (roundError || !rounds || rounds.length === 0) {
      console.log('[RoundStatsService] No completed rounds');
      return null;
    }

    const roundIds = rounds.map((r: { id: string }) => r.id);

    const { data: holeRows, error: holeError } = await supabase
      .from('hole_scores')
      .select('*')
      .in('round_id', roundIds)
      .order('hole_number', { ascending: true });

    if (holeError || !holeRows) {
      console.log('[RoundStatsService] Error fetching all hole scores:', holeError?.message);
      return null;
    }

    const stats = computeStatsFromRows(holeRows as SupabaseHoleRow[]);
    console.log('[RoundStatsService] All-time stats computed, total holes:', stats.holesPlayed);
    return stats;
  } catch (e) {
    console.error('[RoundStatsService] fetchAllTimeStats error:', e);
    return null;
  }
}
