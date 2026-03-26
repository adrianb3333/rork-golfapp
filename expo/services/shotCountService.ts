import { supabase } from '@/lib/supabase';

export async function fetchRoundShotCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[ShotCountService] No user');
      return 0;
    }

    const { data: rounds, error: roundError } = await supabase
      .from('rounds')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_completed', true);

    if (roundError || !rounds || rounds.length === 0) {
      console.log('[ShotCountService] No completed rounds');
      return 0;
    }

    const roundIds = rounds.map((r: { id: string }) => r.id);

    const { data: holeRows, error: holeError } = await supabase
      .from('hole_scores')
      .select('score')
      .in('round_id', roundIds);

    if (holeError || !holeRows) {
      console.log('[ShotCountService] Error fetching hole scores:', holeError?.message);
      return 0;
    }

    let totalShots = 0;
    for (const row of holeRows as { score: number }[]) {
      if (row.score > 0) totalShots += row.score;
    }

    console.log('[ShotCountService] Total round shots:', totalShots);
    return totalShots;
  } catch (e) {
    console.error('[ShotCountService] fetchRoundShotCount error:', e);
    return 0;
  }
}

export async function fetchPracticeShotCount(): Promise<number> {
  console.log('[ShotCountService] Returning empty practice shot count');
  return 0;
}
