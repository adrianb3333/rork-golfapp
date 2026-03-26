import type { HoleScore } from '@/contexts/ScoringContext';
import type { HoleInfo } from '@/mocks/courseData';

export interface ScoreCategory {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RoundStats {
  totalShots: number;
  totalPar: number;
  scoreToPar: number;
  scoreCategories: ScoreCategory[];
  fairwayHit: number;
  fairwayMissLeft: number;
  fairwayMissRight: number;
  fairwayTotal: number;
  girMade: number;
  girMissShort: number;
  girMissLong: number;
  girMissLeft: number;
  girMissRight: number;
  girTotal: number;
  putts1: number;
  putts2: number;
  putts3: number;
  putts4Plus: number;
  totalPutts: number;
  avgPutts: number;
  totalBunker: number;
  totalPenalty: number;
  totalChips: number;
  totalSandSaves: number;
  totalSandSaveAttempts: number;
  totalUpAndDowns: number;
  totalUpAndDownAttempts: number;
  holesPlayed: number;
}

export function computeRoundStats(
  allScores: [number, HoleScore][],
  holes: HoleInfo[]
): RoundStats {
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

  for (const [holeNum, score] of allScores) {
    if (score.score <= 0) continue;

    const holeInfo = holes.find((h) => h.number === holeNum);
    if (!holeInfo) continue;

    holesPlayed++;
    totalShots += score.score;
    totalPar += holeInfo.par;

    const diff = score.score - holeInfo.par;

    if (score.score === 1) {
      hio++;
    } else if (diff <= -3) {
      albatross++;
    } else if (diff === -2) {
      eagle++;
    } else if (diff === -1) {
      birdie++;
    } else if (diff === 0) {
      par++;
    } else if (diff === 1) {
      bogey++;
    } else if (diff === 2) {
      doubleBogey++;
    } else if (diff === 3) {
      tripleBogey++;
    } else {
      worse++;
    }

    if (score.fairway) {
      fairwayTotal++;
      if (score.fairway === 'hit') fairwayHit++;
      else if (score.fairway === 'left') fairwayMissLeft++;
      else if (score.fairway === 'right') fairwayMissRight++;
    }

    if (score.greenMiss) {
      girTotal++;
      if (score.greenMiss === 'hit') girMade++;
      else if (score.greenMiss === 'short') girMissShort++;
      else if (score.greenMiss === 'long') girMissLong++;
      else if (score.greenMiss === 'left') girMissLeft++;
      else if (score.greenMiss === 'right') girMissRight++;
    }

    totalPutts += score.putts;
    if (score.putts === 1) putts1++;
    else if (score.putts === 2) putts2++;
    else if (score.putts === 3) putts3++;
    else if (score.putts >= 4) putts4Plus++;

    totalBunker += score.bunkerShots;
    totalPenalty += score.penaltyShots;
    totalChips += score.chips;

    if (score.bunkerShots > 0) totalSandSaveAttempts++;
    if (score.sandSave) totalSandSaves++;

    if (score.greenMiss && score.greenMiss !== 'hit') {
      totalUpAndDownAttempts++;
      if (score.upAndDown) totalUpAndDowns++;
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

export function getToParString(scoreToPar: number): string {
  if (scoreToPar === 0) return 'E';
  return scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
}

export function pctOf(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}
