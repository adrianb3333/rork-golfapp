type FlightOption = 'Low' | 'Normal' | 'High';

interface TrajectoryMultipliers {
  headwindScale: number;
  tailwindScale: number;
  crosswindScale: number;
}

const TRAJECTORY_MULTIPLIERS: Record<FlightOption, TrajectoryMultipliers> = {
  Low: { headwindScale: 0.75, tailwindScale: 0.85, crosswindScale: 0.6 },
  Normal: { headwindScale: 1.0, tailwindScale: 1.0, crosswindScale: 1.0 },
  High: { headwindScale: 1.35, tailwindScale: 1.15, crosswindScale: 1.5 },
};

const HEADWIND_PERCENT_PER_MS = 0.01;
const TAILWIND_PERCENT_PER_MS = 0.005;
const CROSSWIND_DRIFT_PER_MS = 0.7;

const STD_PRESSURE_MB = 1013.25;
const STD_TEMP_C = 15;
const R_DRY_AIR = 287.058;

function calcAirDensity(pressureMb: number, tempC: number): number {
  const pressurePa = pressureMb * 100;
  const tempK = tempC + 273.15;
  return pressurePa / (R_DRY_AIR * tempK);
}

function calcDensityAdjustment(pressureMb: number, tempC: number, distance: number): number {
  const currentDensity = calcAirDensity(pressureMb, tempC);
  const standardDensity = calcAirDensity(STD_PRESSURE_MB, STD_TEMP_C);
  const densityRatio = currentDensity / standardDensity;
  const distanceChangePercent = (1 - densityRatio) * 0.5;
  return distance * distanceChangePercent;
}

export interface GolfCalculationResult {
  originalDistance: number;
  windAdjustment: number;
  tempAdjustment: number;
  totalAdjustment: number;
  adjustedDistance: number;
  crosswindDrift: number;
}

export function decomposeWind(windSpeedMs: number, windDeg: number, targetHeading: number): { headTail: number; cross: number } {
  const relativeAngleRad = ((windDeg - targetHeading) * Math.PI) / 180;
  const longitudinal = windSpeedMs * Math.cos(relativeAngleRad);
  const lateral = windSpeedMs * Math.sin(relativeAngleRad);
  return {
    headTail: parseFloat(longitudinal.toFixed(1)),
    cross: parseFloat(lateral.toFixed(1)),
  };
}

export function calculateGolfShot(
  distance: number,
  trajectory: FlightOption,
  windSpeedMs: number,
  headTailWind: number,
  crossWind: number,
  temperature: number,
  pressureMb: number = STD_PRESSURE_MB
): GolfCalculationResult {
  const multipliers = TRAJECTORY_MULTIPLIERS[trajectory];

  let windAdjustment = 0;
  if (headTailWind > 0) {
    windAdjustment = distance * HEADWIND_PERCENT_PER_MS * headTailWind * multipliers.headwindScale;
  } else if (headTailWind < 0) {
    windAdjustment = -(distance * TAILWIND_PERCENT_PER_MS * Math.abs(headTailWind) * multipliers.tailwindScale);
  }

  const crosswindDrift = Math.abs(crossWind) * CROSSWIND_DRIFT_PER_MS * multipliers.crosswindScale;

  const densityAdj = calcDensityAdjustment(pressureMb, temperature, distance);
  const tempAdjustment = -densityAdj;

  const totalAdjustment = windAdjustment + tempAdjustment;
  const adjustedDistance = distance + totalAdjustment;

  console.log('[GolfCalc] Input:', { distance, trajectory, headTailWind, crossWind, temperature, pressureMb });
  console.log('[GolfCalc] Wind adj:', windAdjustment.toFixed(1), 'Density adj:', tempAdjustment.toFixed(1), 'Drift:', crosswindDrift.toFixed(1));

  return {
    originalDistance: distance,
    windAdjustment: Math.round(windAdjustment * 10) / 10,
    tempAdjustment: Math.round(tempAdjustment * 10) / 10,
    totalAdjustment: Math.round(totalAdjustment * 10) / 10,
    adjustedDistance: Math.round(adjustedDistance * 10) / 10,
    crosswindDrift: Math.round(crosswindDrift * 10) / 10,
  };
}
