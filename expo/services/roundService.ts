import { supabase } from '@/lib/supabase';
import type { HoleScore } from '@/contexts/ScoringContext';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export async function createRound(
  courseName: string,
  options?: { holeOption?: string; sensorsActive?: boolean }
): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[RoundService] No user found');
      return null;
    }

    const roundId = uuidv4();

    const { data, error } = await supabase
      .from('rounds')
      .insert({
        id: roundId,
        user_id: user.id,
        course_name: courseName,
        is_completed: false,
        hole_option: options?.holeOption ?? '18',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[RoundService] Error creating round:', error.message);
      return null;
    }

    console.log('[RoundService] Round created:', data.id);
    return data.id;
  } catch (e) {
    console.error('[RoundService] Exception creating round:', e);
    return null;
  }
}

export async function saveHoleScore(
  roundId: string,
  holeScore: HoleScore,
  par: number
): Promise<boolean> {
  try {
    const gir = holeScore.greenMiss === 'hit';
    const girMissDirection = holeScore.greenMiss === 'hit' ? 'none' : (holeScore.greenMiss || 'none');

    let fairwayStatus: string = 'n/a';
    if (holeScore.fairway === 'hit') fairwayStatus = 'hit';
    else if (holeScore.fairway === 'left') fairwayStatus = 'miss_left';
    else if (holeScore.fairway === 'right') fairwayStatus = 'miss_right';

    let puttLengthFeet = 0;
    switch (holeScore.puttDistance) {
      case '<1': puttLengthFeet = 0.5; break;
      case '1-2': puttLengthFeet = 1.5; break;
      case '2-4': puttLengthFeet = 3; break;
      case '4-8': puttLengthFeet = 6; break;
      case '8+': puttLengthFeet = 10; break;
    }

    const { error } = await supabase
      .from('hole_scores')
      .upsert({
        round_id: roundId,
        hole_number: holeScore.holeNumber,
        par,
        score: holeScore.score,
        fairway_status: fairwayStatus,
        gir,
        gir_miss_direction: girMissDirection,
        putts: holeScore.putts,
        first_putt_length_feet: puttLengthFeet,
        bunker_shots: holeScore.bunkerShots,
        penalty_shots: holeScore.penaltyShots,
        chips: holeScore.chips,
        sand_save: holeScore.sandSave,
        up_and_down: holeScore.upAndDown,
      }, {
        onConflict: 'round_id,hole_number',
      });

    if (error) {
      console.error('[RoundService] Error saving hole score:', error.message);
      return false;
    }

    console.log('[RoundService] Hole score saved for hole:', holeScore.holeNumber);
    return true;
  } catch (e) {
    console.error('[RoundService] Exception saving hole score:', e);
    return false;
  }
}

export async function completeRound(roundId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rounds')
      .update({ is_completed: true })
      .eq('id', roundId);

    if (error) {
      console.error('[RoundService] Error completing round:', error.message);
      return false;
    }

    console.log('[RoundService] Round completed:', roundId);
    return true;
  } catch (e) {
    console.error('[RoundService] Exception completing round:', e);
    return false;
  }
}
