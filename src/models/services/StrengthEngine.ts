import { ExerciseId, COMPOUND_EXERCISES, MOVEMENT_PATTERNS } from '../types/Exercise';
import { Tier } from '../types/StrengthStandards';
import STRENGTH_STANDARDS_DATA from '../types/strength_standards.json';

export interface ExerciseStandardMetadata {
  name: string;
  weight_type: string;
  unit_label: string;
  tiers_80kg_male: [number, number, number, number, number];
  allometric_coeffs: [number, number, number, number, number];
}

export const STRENGTH_STANDARDS_CATALOG: Record<string, ExerciseStandardMetadata> = STRENGTH_STANDARDS_DATA as any;

/**
 * Allometric Scaling Constants derived from empirical StrengthLevel crowdsourced data.
 * Scaled across all bodyweights via: Standard (kg) = C × BW^0.67 × genderMod × ageMod
 * (BW^0.67 at 80kg ≈ 18.85)
 * All dumbbell movements are strictly calibrated PER DUMBBELL.
 */
const STANDARDS: Partial<Record<ExerciseId, [number, number, number, number, number]>> = Object.entries(
  STRENGTH_STANDARDS_CATALOG
).reduce((acc, [key, val]) => {
  acc[key as ExerciseId] = val.allometric_coeffs;
  return acc;
}, {} as Partial<Record<ExerciseId, [number, number, number, number, number]>>);

export function getExerciseStandardMeta(exerciseId: string): ExerciseStandardMetadata | null {
  return STRENGTH_STANDARDS_CATALOG[exerciseId] || null;
}

export function getExerciseUnitLabel(exerciseId: string): string {
  const meta = STRENGTH_STANDARDS_CATALOG[exerciseId];
  return meta?.unit_label || 'Weight (kg)';
}

export function isDumbbellExercise(exerciseId: string): boolean {
  const meta = STRENGTH_STANDARDS_CATALOG[exerciseId];
  return meta?.weight_type === 'per_dumbbell';
}

// ─── Modifiers ────────────────────────────────────────────────────────────────

export function getGenderModifier(gender: string): number {
  return gender === 'Female' ? 0.70 : 1.0;
}

export function getAgeModifier(age: number): number {
  if (age <= 35) return 1.0;
  if (age <= 45) return 0.85;
  return 0.60;
}

// ─── Core Calculations ────────────────────────────────────────────────────────

/**
 * Epley 1RM Formula: 1RM = weight × (1 + reps / 30)
 */
export function calculateEpley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Allometric Score — bodyweight-normalized strength:
 * AS = 1RM / BW^0.67
 */
export function getAllometricScore(oneRM: number, bodyweightKg: number): number {
  if (bodyweightKg <= 0 || oneRM <= 0) return 0;
  return Math.round((oneRM / Math.pow(bodyweightKg, 0.67)) * 100) / 100;
}

/**
 * Returns the Kilgore 5-star tier (1–5)
 */
export function getTier(
  exerciseId: string,
  oneRM: number,
  bodyweightKg: number,
  gender: string = 'Male',
  age: number = 25,
): Tier {
  if (bodyweightKg <= 0 || oneRM <= 0) return 1;
  return calculateLifterPercentile(exerciseId, oneRM, bodyweightKg, gender, age).tier;
}

/**
 * Returns Kilgore thresholds in kg for [Untrained, Novice, Intermediate, Advanced, Elite]
 */
export function getTierThresholds(
  exerciseId: string,
  bodyweightKg: number,
  gender: string,
  age: number,
): [number, number, number, number, number] | null {
  const constants = STANDARDS[exerciseId as ExerciseId];
  if (!constants || bodyweightKg <= 0) return null;

  const bwFactor = Math.pow(bodyweightKg, 0.67);
  const gMod = getGenderModifier(gender);
  const aMod = getAgeModifier(age);

  return constants.map((c) => Math.round(c * bwFactor * gMod * aMod)) as [
    number, number, number, number, number,
  ];
}

export interface LifterStrengthAnalysis {
  oneRM: number;
  allometricScore: number;
  tier: Tier;
  tierLabel: string;
  percentile: number; // e.g. 78.4
  percentileFormatted: string; // e.g. "78.4%"
  ratingTitle: string; // e.g. "SUPERIOR ATHLETIC STRENGTH"
  ratingDescription: string;
  thresholds: [number, number, number, number, number];
  comparisonSummary: string;
  unitLabel: string;
  weightType: string;
  demographic: {
    gender: string;
    age: number;
    bodyweightKg: number;
    sexMod: number;
    ageMod: number;
  };
  kgToNextTier: number | null;
  nextTierLabel: string | null;
}

/**
 * Evaluates lifter strength against peers matching their age, weight, and gender:
 * - Interpolates percentile ranking (0 - 99.9%)
 * - Assigns Kilgore tier (1 - 5 stars) and qualitative rating
 * - Normalizes via Allometric Scaling (BW^0.67)
 */
export function calculateLifterPercentile(
  exerciseId: string,
  oneRM: number,
  bodyweightKg: number = 75,
  gender: string = 'Male',
  age: number = 25,
): LifterStrengthAnalysis {
  const safeBW = bodyweightKg > 0 ? bodyweightKg : 75;
  const safeAge = age > 0 ? age : 25;
  const safeGender = gender || 'Male';

  const gMod = getGenderModifier(safeGender);
  const aMod = getAgeModifier(safeAge);
  const bwFactor = Math.pow(safeBW, 0.67);

  const rawConstants = STANDARDS[exerciseId as ExerciseId] || [1.5, 2.5, 3.5, 4.5, 5.5];
  const thresholds = rawConstants.map((c) => Math.round(c * bwFactor * gMod * aMod * 10) / 10) as [
    number, number, number, number, number
  ];

  const [t1, t2, t3, t4, t5] = thresholds;
  const asScore = getAllometricScore(oneRM, safeBW);

  let tier: Tier = 1;
  let percentile = 0;

  if (oneRM <= 0) {
    percentile = 0;
    tier = 1;
  } else if (oneRM < t1) {
    tier = 1;
    percentile = Math.max(1, (oneRM / Math.max(1, t1)) * 15);
  } else if (oneRM < t2) {
    tier = oneRM >= (t1 + t2) / 2 ? 2 : 1;
    percentile = 15 + ((oneRM - t1) / Math.max(0.1, t2 - t1)) * (45 - 15);
  } else if (oneRM < t3) {
    tier = oneRM >= (t2 + t3) / 2 ? 3 : 2;
    percentile = 45 + ((oneRM - t2) / Math.max(0.1, t3 - t2)) * (75 - 45);
  } else if (oneRM < t4) {
    tier = oneRM >= (t3 + t4) / 2 ? 4 : 3;
    percentile = 75 + ((oneRM - t3) / Math.max(0.1, t4 - t3)) * (92 - 75);
  } else if (oneRM < t5) {
    tier = oneRM >= (t4 + t5) / 2 ? 5 : 4;
    percentile = 92 + ((oneRM - t4) / Math.max(0.1, t5 - t4)) * (98.5 - 92);
  } else {
    tier = 5;
    percentile = Math.min(99.9, 98.5 + 1.4 * (1 - Math.exp(-(oneRM - t5) / Math.max(1, t5 * 0.2))));
  }

  percentile = Math.round(percentile * 10) / 10;
  const tierLabels: Record<Tier, string> = {
    1: 'Untrained',
    2: 'Novice',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Elite',
  };

  const tierLabel = tierLabels[tier];

  let ratingTitle = 'BEGINNER LIFTER';
  let ratingDescription = 'Great starting base. Consistent training will lead to rapid strength gains.';

  if (tier === 5) {
    ratingTitle = 'ELITE LIFTER';
    ratingDescription = 'In the top 1.5% of lifters. Outstanding, competition-level strength.';
  } else if (tier === 4) {
    ratingTitle = 'ADVANCED LIFTER';
    ratingDescription = 'In the top 8% of lifters. Represents years of dedicated and consistent training.';
  } else if (tier === 3) {
    ratingTitle = 'INTERMEDIATE LIFTER';
    ratingDescription = 'In the top 25% of lifters. Clearly stronger than the average gym-goer.';
  } else if (tier === 2) {
    ratingTitle = 'NOVICE LIFTER';
    ratingDescription = 'In the top 55% of lifters. Past the beginner stage with solid strength development.';
  }

  const nextTierIdx = (tier >= 1 && tier < 5) ? (tier as 1 | 2 | 3 | 4) : null;
  const nextTierKg: number | null = nextTierIdx !== null ? thresholds[nextTierIdx] : null;
  const kgToNextTier = nextTierKg !== null && oneRM > 0 ? Math.max(0, Math.round((nextTierKg - oneRM) * 10) / 10) : null;
  const nextTierLabel = nextTierIdx !== null ? tierLabels[(tier + 1) as Tier] : null;

  const comparisonSummary = oneRM > 0
    ? `Stronger than ${percentile.toFixed(1)}% of lifters matching your age (${safeAge}), sex (${safeGender}), and bodyweight (${safeBW} kg).`
    : `Enter a 1RM or weight/reps to calculate your demographic percentile ranking.`;
  const meta = STRENGTH_STANDARDS_CATALOG[exerciseId] || null;
  const unitLabel = meta?.unit_label || 'Weight (kg)';
  const weightType = meta?.weight_type || 'total_barbell';

  return {
    oneRM,
    allometricScore: asScore,
    tier,
    tierLabel,
    percentile,
    percentileFormatted: `${percentile.toFixed(1)}%`,
    ratingTitle,
    ratingDescription,
    thresholds,
    comparisonSummary,
    unitLabel,
    weightType,
    demographic: {
      gender: safeGender,
      age: safeAge,
      bodyweightKg: safeBW,
      sexMod: gMod,
      ageMod: aMod,
    },
    kgToNextTier,
    nextTierLabel,
  };
}

/**
 * Pick the top 5 exercises using movement-pattern logic:
 * Checks (bench, ohp, squat, deadlift, row) and picks the user's most trained variant.
 * Fills remaining slots with other compounds, then isolations.
 */
export function getTop5Exercises(
  prRecord: Partial<Record<string, { oneRM: number }>>,
  sessionCounts: Partial<Record<string, number>>,
): ExerciseId[] {
  const count = (id: string) => sessionCounts[id] ?? 0;
  const oneRM  = (id: string) => prRecord[id]?.oneRM  ?? 0;
  const hasData = (id: string) => count(id) > 0 || oneRM(id) > 0;

  const result: ExerciseId[] = [];
  const used   = new Set<ExerciseId>();

  // 1. One representative per movement pattern
  for (const variants of Object.values(MOVEMENT_PATTERNS)) {
    const candidates = (variants as ExerciseId[]).filter(hasData);
    if (candidates.length === 0) continue;

    candidates.sort((a, b) =>
      count(b) !== count(a)
        ? count(b) - count(a)
        : oneRM(b) - oneRM(a),
    );

    const best = candidates[0];
    result.push(best);
    used.add(best);
  }

  // 2. Remaining slots: other compounds then isolations
  const allWithData = [
    ...(Object.keys({ ...prRecord, ...sessionCounts }) as ExerciseId[])
      .filter((id) => COMPOUND_EXERCISES.has(id) && !used.has(id) && hasData(id))
      .sort((a, b) => count(b) !== count(a) ? count(b) - count(a) : oneRM(b) - oneRM(a)),
    ...(Object.keys({ ...prRecord, ...sessionCounts }) as ExerciseId[])
      .filter((id) => !COMPOUND_EXERCISES.has(id) && !used.has(id) && hasData(id))
      .sort((a, b) => count(b) !== count(a) ? count(b) - count(a) : oneRM(b) - oneRM(a)),
  ];

  for (const id of allWithData) {
    if (result.length >= 5) break;
    if (!used.has(id)) {
      result.push(id);
      used.add(id);
    }
  }

  // 3. Fallback defaults if fewer than 5 exercises have logged data (The Big 5 Foundational Compounds)
  const defaultCompounds: ExerciseId[] = [
    'barbell_squat',
    'barbell_bench_press',
    'deadlift',
    'overhead_press',
    'barbell_row',
  ];
  for (const id of defaultCompounds) {
    if (result.length >= 5) break;
    if (!used.has(id)) {
      result.push(id);
      used.add(id);
    }
  }

  return result;
}

/**
 * Returns % change in 1RM from the first logged session to the latest
 */
export function getStrengthGainPct(
  sessions: { bestEpley1RM: number }[],
): number | null {
  if (sessions.length < 2) return null;
  const first = sessions[sessions.length - 1].bestEpley1RM;
  const latest = sessions[0].bestEpley1RM;
  if (first <= 0) return null;
  return Math.round(((latest - first) / first) * 100 * 10) / 10;
}
