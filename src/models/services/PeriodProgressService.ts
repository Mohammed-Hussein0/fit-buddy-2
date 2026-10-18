import { EXERCISES, normalizeExerciseKey } from '../types/Exercise';
import { calculateEpley1RM, getAllometricScore, getGenderModifier, getAgeModifier, calculateLifterPercentile } from './StrengthEngine';
import { Tier, TIER_COLORS } from '../types/StrengthStandards';
import { getBaseRateForDays, getExperienceModifier, ExperienceLevel, PillarProgress } from './ProgressDiagnosticEngine';
import { BodyMeasurement } from '../types/Measurement';
import { useMeasurementStore } from '../repositories/MeasurementStore';
import { useWorkoutStore } from '../repositories/WorkoutStore';
import { usePRStore } from '../repositories/PRStore';
import { apiClient } from './ApiClient';

export type CompoundMovementKey = 'bench' | 'squat' | 'deadlift' | 'row';

export interface CompoundMovementConfig {
  key: CompoundMovementKey;
  name: string;
  category: string;
  exerciseId: string;
}

export const THE_BIG_4_MOVEMENTS: Record<CompoundMovementKey, CompoundMovementConfig> = {
  bench: {
    key: 'bench',
    name: 'Barbell Bench Press',
    category: 'Chest / Upper Push',
    exerciseId: EXERCISES.BARBELL_BENCH_PRESS,
  },
  squat: {
    key: 'squat',
    name: 'Barbell Squat',
    category: 'Quads & Glutes / Lower Push',
    exerciseId: EXERCISES.BARBELL_SQUAT,
  },
  deadlift: {
    key: 'deadlift',
    name: 'Deadlift',
    category: 'Posterior Chain / Lower Hinge',
    exerciseId: EXERCISES.DEADLIFT,
  },
  row: {
    key: 'row',
    name: 'Barbell Row',
    category: 'Upper Back & Lats / Horizontal Pull',
    exerciseId: EXERCISES.BARBELL_ROW,
  },
};

export interface CompoundInputValues {
  enabled: boolean;
  startWeight: string;
  startReps: string;
  start1RM: number;
  endWeight: string;
  endReps: string;
  end1RM: number;
}

export interface PeriodMeasurementsInput {
  waist_cm?: string;
  chest_cm?: string;
  arm_cm?: string;
  thigh_cm?: string;
  shoulders_cm?: string;
  hip_cm?: string;
  calf_cm?: string;
}

export interface PeriodAssessmentFormState {
  startDate: string;
  endDate: string;
  startBodyweightKg: string;
  endBodyweightKg: string;
  startMeasurements: PeriodMeasurementsInput;
  endMeasurements: PeriodMeasurementsInput;
  lifts: Record<CompoundMovementKey, CompoundInputValues>;
}

export interface CompoundLiftResult {
  key: CompoundMovementKey;
  name: string;
  category: string;
  start1RM: number;
  end1RM: number;
  deltaKg: number;
  gainPct: number;
  startAS: number;
  endAS: number;
  deltaAS: number;
  asGainPct: number;
  status: 'SURPASSING' | 'OPTIMAL' | 'DEVELOPING' | 'LACKING';
  statusColor: string;
  weightContextNote: string;

  // Kilgore Strength Standards
  tier: Tier;
  tierLabel: string;
  tierColor: string;
  percentile: number;
  percentileFormatted: string;
  ratingTitle: string;
  thresholds: [number, number, number, number, number];
  kgToNextTier: number | null;
  nextTierLabel: string | null;
  standardComparisonNote: string;
}

export interface PeriodAssessmentResult {
  durationDays: number;
  durationMonths: number;
  durationLabel: string;
  startBodyweightKg: number;
  endBodyweightKg: number;
  weightDeltaKg: number;
  weightDeltaPct: number;
  phaseType: 'CUT' | 'BULK' | 'MAINTENANCE';

  // Lifts evaluated (2 to 4)
  evaluatedLifts: CompoundLiftResult[];
  compoundCountUsed: number;
  averageStrengthGainPct: number;
  averageASDelta: number;
  averageASGainPct: number;
  expectedGainRatePct: number;
  relativeStrengthSummary: string;

  // Recomposition / Body Shape
  hasMeasurements: boolean;
  waistDeltaCm?: number;
  armDeltaCm?: number;
  chestDeltaCm?: number;
  thighDeltaCm?: number;
  limbsAverageDeltaCm?: number;
  recompVerdict: string;
  recompBadge: string;
  recompColor: string;

  // Overall Velocity & Score
  overallVelocity: 'SURPASSING' | 'ON TRACK' | 'MAKING PROGRESS' | 'PLATEAU / STALLED';
  velocityColor: string;
  compositeScorePct: number;
  mathematicalReality: string;
  physiologicalMeaning: string;
  actionDirective: string;

  // The 4 Pillars of Progression
  pillars: PillarProgress[];
  accuracyVerdict: 'ACCURATE (FULL MEASUREMENTS)' | 'ESTIMATED (WORKOUT PERFORMANCE ONLY)';
  accuracyNote: string;
  reallocatedWeightsNote: string;
  compositeWeightFormula: string;
}

/**
 * Validates and runs a multi-dimensional progress assessment over any custom period.
 * Requires at least 2 of the 4 compound movements.
 * If 2 are entered, strength progression is judged purely off of them.
 */
export function evaluatePeriodProgress(
  form: PeriodAssessmentFormState,
  userProfile: { gender: string; age: number; experienceLevel: ExperienceLevel }
): { error?: string; result?: PeriodAssessmentResult } {
  // 1. Date Validation
  const start = new Date(form.startDate);
  const end = new Date(form.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: 'Please select valid start and end dates.' };
  }
  if (start >= end) {
    return { error: 'End date must be strictly after the start date.' };
  }

  const durationMs = end.getTime() - start.getTime();
  const durationDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)));
  const durationMonths = parseFloat((durationDays / 30.4375).toFixed(1));
  const durationLabel =
    durationDays < 60
      ? `${durationDays} Days`
      : `${durationMonths} Months (${durationDays} Days)`;

  // 2. Bodyweight Validation
  const startBW = parseFloat(form.startBodyweightKg);
  const endBW = parseFloat(form.endBodyweightKg);
  if (isNaN(startBW) || startBW <= 20 || isNaN(endBW) || endBW <= 20) {
    return { error: 'Please enter valid starting and ending body weights (in kg).' };
  }
  const weightDeltaKg = parseFloat((endBW - startBW).toFixed(1));
  const weightDeltaPct = parseFloat(((weightDeltaKg / startBW) * 100).toFixed(1));

  // Determine nutritional phase
  const isCut = weightDeltaPct <= -1.5;
  const isBulk = weightDeltaPct >= 1.5;
  const phaseType: 'CUT' | 'BULK' | 'MAINTENANCE' = isCut ? 'CUT' : isBulk ? 'BULK' : 'MAINTENANCE';

  // 3. Compounds Validation (Must have at least 2 valid movements)
  const evaluatedLifts: CompoundLiftResult[] = [];
  const keys: CompoundMovementKey[] = ['bench', 'squat', 'deadlift', 'row'];

  // Expected biological gain rate for this timeframe (surplus/baseline standard)
  const genderMod = getGenderModifier(userProfile.gender);
  const ageMod = getAgeModifier(userProfile.age);
  const expMod = getExperienceModifier(userProfile.experienceLevel);
  const baseRate = getBaseRateForDays(durationDays);
  const expectedGainRatePct = parseFloat((baseRate * genderMod * ageMod * expMod).toFixed(1));

  for (const k of keys) {
    const input = form.lifts[k];
    if (!input || !input.enabled) continue;

    // Derive 1RM either directly from 1RM or weight/reps
    let start1RM = input.start1RM || 0;
    if (start1RM <= 0 && input.startWeight && input.startReps) {
      start1RM = calculateEpley1RM(parseFloat(input.startWeight) || 0, parseInt(input.startReps, 10) || 1);
    }

    let end1RM = input.end1RM || 0;
    if (end1RM <= 0 && input.endWeight && input.endReps) {
      end1RM = calculateEpley1RM(parseFloat(input.endWeight) || 0, parseInt(input.endReps, 10) || 1);
    }

    if (start1RM > 0 && end1RM > 0) {
      const deltaKg = parseFloat((end1RM - start1RM).toFixed(1));
      const gainPct = parseFloat((((end1RM - start1RM) / start1RM) * 100).toFixed(1));
      const startAS = getAllometricScore(start1RM, startBW);
      const endAS = getAllometricScore(end1RM, endBW);
      const deltaAS = parseFloat((endAS - startAS).toFixed(2));
      const asGainPct = startAS > 0 ? parseFloat((((endAS - startAS) / startAS) * 100).toFixed(1)) : 0;

      let status: CompoundLiftResult['status'] = 'DEVELOPING';
      let statusColor = '#eab308';
      let weightContextNote = '';

      if (isCut) {
        if (userProfile.experienceLevel === 'Novice') {
          // Novice expectations in deficit (untapped recomp potential):
          if (gainPct >= 3.0) {
            status = 'SURPASSING';
            statusColor = '#22c55e';
            weightContextNote = `Newbie Recomp: Strength surged (+${gainPct}%) while shedding ${Math.abs(weightDeltaKg)}kg. Relative strength jumped +${asGainPct}%.`;
          } else if (gainPct >= 1.5) {
            status = 'OPTIMAL';
            statusColor = '#22c55e';
            weightContextNote = `Progressive Overload in Deficit: 1RM climbed +${gainPct}%. Solid beginner recomp progression.`;
          } else if (gainPct >= -0.5) {
            status = 'DEVELOPING';
            statusColor = '#eab308';
            weightContextNote = `1RM maintained (+${asGainPct}% relative strength). Good muscle protection, but novices have untapped potential to gain strength during a deficit.`;
          } else {
            status = 'LACKING';
            statusColor = '#ef4444';
            weightContextNote = `Strength dropped (${gainPct}%). Beginners should not lose strength during a moderate cut.`;
          }
        } else if (userProfile.experienceLevel === 'Intermediate') {
          // Intermediate expectations in deficit (1RM retention standard):
          if (gainPct >= 1.5) {
            status = 'SURPASSING';
            statusColor = '#22c55e';
            weightContextNote = `Strength surged (+${gainPct}%) during weight cut. Relative strength jumped +${asGainPct}%.`;
          } else if (gainPct >= -0.5) {
            status = 'OPTIMAL';
            statusColor = '#22c55e';
            weightContextNote = `1RM preserved during ${Math.abs(weightDeltaKg)}kg cut -> +${asGainPct}% relative strength.`;
          } else if (gainPct >= -1.5) {
            status = 'DEVELOPING';
            statusColor = '#eab308';
            weightContextNote = `Minor strength dip (${gainPct}%) in deficit.`;
          } else {
            status = 'LACKING';
            statusColor = '#ef4444';
            weightContextNote = `Strength drop (${gainPct}%) exceeded standard deficit tolerance.`;
          }
        } else if (userProfile.experienceLevel === 'Advanced') {
          // Advanced expectations in deficit (preserving 1RM is exceptional):
          if (gainPct >= 0) {
            status = 'SURPASSING';
            statusColor = '#22c55e';
            weightContextNote = `Elite Deficit Execution: Preserved 100% of 1RM near genetic ceiling while losing ${Math.abs(weightDeltaKg)}kg (+${asGainPct}% relative strength).`;
          } else if (gainPct >= -1.5) {
            status = 'OPTIMAL';
            statusColor = '#22c55e';
            weightContextNote = `Controlled leverage loss (${gainPct}%); well within acceptable buffer for advanced lifter in deficit.`;
          } else {
            status = 'LACKING';
            statusColor = '#ef4444';
            weightContextNote = `Deficit pace too fast. Loss of ${gainPct}% on main compound.`;
          }
        } else {
          // Elite expectations in deficit:
          if (gainPct >= 0) {
            status = 'SURPASSING';
            statusColor = '#22c55e';
            weightContextNote = `Peak Conditioning: 100% 1RM retention at elite level during ${Math.abs(weightDeltaKg)}kg cut.`;
          } else if (gainPct >= -2.0) {
            status = 'OPTIMAL';
            statusColor = '#22c55e';
            weightContextNote = `Minimal strength shift (${gainPct}%); optimal retention at genetic ceiling.`;
          } else {
            status = 'LACKING';
            statusColor = '#ef4444';
            weightContextNote = `Strength drop (${gainPct}%) in deficit.`;
          }
        }
      } else if (isBulk) {
        // In a Bulk: Gaining mass means strength should comfortably outpace weight gain
        if (gainPct >= expectedGainRatePct && asGainPct > 0) {
          status = 'SURPASSING';
          statusColor = '#22c55e';
          weightContextNote = `Contractile Hypertrophy: Strength (+${gainPct}%) outpaced bodyweight (+${weightDeltaPct}%).`;
        } else if (gainPct >= 6.0 && asGainPct >= 0) {
          status = 'OPTIMAL';
          statusColor = '#22c55e';
          weightContextNote = `Productive bulk: 1RM climbed +${gainPct}% (+${asGainPct}% allometric strength).`;
        } else if (asGainPct < 0) {
          status = 'LACKING';
          statusColor = '#ef4444';
          weightContextNote = `Unproductive Mass Gain: Lift gained +${deltaKg}kg (+${gainPct}%), but bodyweight jumped +${weightDeltaKg}kg (+${weightDeltaPct}%). Allometric relative strength dropped by ${asGainPct}% (mass gained was mostly non-contractile fat/water).`;
        } else if (gainPct > 0) {
          status = 'DEVELOPING';
          statusColor = '#eab308';
          weightContextNote = `Strength climbed (+${gainPct}%), but relative strength shift is modest (${asGainPct}%).`;
        } else {
          status = 'LACKING';
          statusColor = '#ef4444';
          weightContextNote = `Bodyweight increased (+${weightDeltaKg}kg) without corresponding strength gains.`;
        }
      } else {
        // Maintenance: Stable body weight
        if (gainPct >= expectedGainRatePct * 1.5 || gainPct >= 7.0) {
          status = 'SURPASSING';
          statusColor = '#22c55e';
          weightContextNote = `Exceptional strength surge (+${gainPct}%) at stable bodyweight (Benchmark: +${expectedGainRatePct}%).`;
        } else if (gainPct >= expectedGainRatePct) {
          status = 'OPTIMAL';
          statusColor = '#22c55e';
          weightContextNote = `Optimal progressive overload (+${gainPct}%) at stable bodyweight (Benchmark: +${expectedGainRatePct}%).`;
        } else if (gainPct > 0) {
          status = 'DEVELOPING';
          statusColor = '#eab308';
          weightContextNote = `Steady strength progression (+${gainPct}%).`;
        } else {
          status = 'LACKING';
          statusColor = '#ef4444';
          weightContextNote = `Strength plateaued at maintenance calories.`;
        }
      }

      // Kilgore Strength Standards calculation for this compound lift
      const analysis = calculateLifterPercentile(
        THE_BIG_4_MOVEMENTS[k].exerciseId,
        end1RM,
        endBW,
        userProfile.gender,
        userProfile.age
      );

      let standardComparisonNote = '';
      if (userProfile.experienceLevel.toLowerCase() === analysis.tierLabel.toLowerCase()) {
        standardComparisonNote = `Lift is firmly in the ${analysis.tierLabel} standard (Top ${Math.round(100 - analysis.percentile)}% of lifters).`;
      } else if (analysis.tier > (userProfile.experienceLevel === 'Novice' ? 2 : userProfile.experienceLevel === 'Intermediate' ? 3 : 4)) {
        standardComparisonNote = `Exceeds your profile level: Your 1RM qualifies as ${analysis.tierLabel} (Tier ${analysis.tier})!`;
      } else {
        standardComparisonNote = `Current standard: ${analysis.tierLabel} (Tier ${analysis.tier}, Top ${Math.round(100 - analysis.percentile)}%). Next tier (${analysis.nextTierLabel}): ${analysis.kgToNextTier ? `+${analysis.kgToNextTier}kg` : 'Reached'}.`;
      }

      evaluatedLifts.push({
        key: k,
        name: THE_BIG_4_MOVEMENTS[k].name,
        category: THE_BIG_4_MOVEMENTS[k].category,
        start1RM,
        end1RM,
        deltaKg,
        gainPct,
        startAS,
        endAS,
        deltaAS,
        asGainPct,
        status,
        statusColor,
        weightContextNote,
        tier: analysis.tier,
        tierLabel: analysis.tierLabel,
        tierColor: TIER_COLORS[analysis.tier],
        percentile: analysis.percentile,
        percentileFormatted: analysis.percentileFormatted,
        ratingTitle: analysis.ratingTitle,
        thresholds: analysis.thresholds,
        kgToNextTier: analysis.kgToNextTier,
        nextTierLabel: analysis.nextTierLabel,
        standardComparisonNote,
      });
    }
  }

  // Enforce rule: At least 2 compound movements required
  if (evaluatedLifts.length < 2) {
    return {
      error: `Please enter starting and ending strength for at least 2 of the 4 compound movements (Bench Press, Squat, Deadlift, Barbell Row). Currently entered: ${evaluatedLifts.length} of 2.`,
    };
  }

  // Average strength progress across the entered lifts (judged purely off of them!)
  const totalGainPct = evaluatedLifts.reduce((acc, l) => acc + l.gainPct, 0);
  const averageStrengthGainPct = parseFloat((totalGainPct / evaluatedLifts.length).toFixed(1));
  const totalASDelta = evaluatedLifts.reduce((acc, l) => acc + l.deltaAS, 0);
  const averageASDelta = parseFloat((totalASDelta / evaluatedLifts.length).toFixed(2));
  const totalASGainPct = evaluatedLifts.reduce((acc, l) => acc + l.asGainPct, 0);
  const averageASGainPct = parseFloat((totalASGainPct / evaluatedLifts.length).toFixed(1));

  const relativeStrengthSummary = isCut
    ? `Maintained/improved relative strength (+${averageASGainPct}%) during weight reduction.`
    : isBulk
    ? `Allometric strength shifted by ${averageASGainPct >= 0 ? '+' : ''}${averageASGainPct}% during bulk.`
    : `Strength climbed ${averageStrengthGainPct >= 0 ? '+' : ''}${averageStrengthGainPct}% at maintenance weight.`;

  // 5. Body Measurements & Recomposition Diagnostic
  const sM = form.startMeasurements || {};
  const eM = form.endMeasurements || {};

  const startWaist = parseFloat(sM.waist_cm || '');
  const endWaist = parseFloat(eM.waist_cm || '');
  const startArms = parseFloat(sM.arm_cm || '');
  const endArms = parseFloat(eM.arm_cm || '');
  const startChest = parseFloat(sM.chest_cm || '');
  const endChest = parseFloat(eM.chest_cm || '');
  const startThigh = parseFloat(sM.thigh_cm || '');
  const endThigh = parseFloat(eM.thigh_cm || '');

  const hasWaist = !isNaN(startWaist) && !isNaN(endWaist) && startWaist > 0 && endWaist > 0;
  const hasArms = !isNaN(startArms) && !isNaN(endArms) && startArms > 0 && endArms > 0;
  const hasChest = !isNaN(startChest) && !isNaN(endChest) && startChest > 0 && endChest > 0;
  const hasThighs = !isNaN(startThigh) && !isNaN(endThigh) && startThigh > 0 && endThigh > 0;

  const hasMeasurements = hasWaist || hasArms || hasChest || hasThighs;

  let waistDeltaCm: number | undefined;
  let armDeltaCm: number | undefined;
  let chestDeltaCm: number | undefined;
  let thighDeltaCm: number | undefined;
  let limbsAverageDeltaCm: number | undefined;

  let recompVerdict = 'No body measurements were recorded over this period. Progression is evaluated purely from your compound lifts and bodyweight change.';
  let recompBadge = isCut ? 'CUT (LIFTS ONLY)' : isBulk ? 'BULK (LIFTS ONLY)' : 'LIFTS ONLY';
  let recompColor = '#3b82f6';

  if (hasMeasurements) {
    const limbDeltas: number[] = [];
    if (hasArms) {
      armDeltaCm = parseFloat((endArms - startArms).toFixed(1));
      limbDeltas.push(armDeltaCm);
    }
    if (hasChest) {
      chestDeltaCm = parseFloat((endChest - startChest).toFixed(1));
      limbDeltas.push(chestDeltaCm);
    }
    if (hasThighs) {
      thighDeltaCm = parseFloat((endThigh - startThigh).toFixed(1));
      limbDeltas.push(thighDeltaCm);
    }
    if (hasWaist) {
      waistDeltaCm = parseFloat((endWaist - startWaist).toFixed(1));
    }

    if (limbDeltas.length > 0) {
      limbsAverageDeltaCm = parseFloat((limbDeltas.reduce((a, b) => a + b, 0) / limbDeltas.length).toFixed(1));
    }

    const waistChange = waistDeltaCm ?? 0;
    const limbChange = limbsAverageDeltaCm ?? 0;

    if (waistChange <= 0 && (limbChange > 0 || averageStrengthGainPct > 0)) {
      recompVerdict = `Optimal Body Recomposition: Waist reduced/maintained (${waistChange >= 0 ? '+' : ''}${waistChange}cm) while muscle size and strength climbed (${limbChange >= 0 ? '+' : ''}${limbChange}cm limbs, +${averageStrengthGainPct}% strength). You lost fat while building muscle!`;
      recompBadge = 'IDEAL RECOMP';
      recompColor = '#22c55e';
    } else if (weightDeltaKg > 0 && limbChange > 0 && waistChange <= 2) {
      recompVerdict = `Lean Hypertrophy Bulk: Gained +${weightDeltaKg}kg with significant limb growth (+${limbChange}cm) and controlled waist change (+${waistChange}cm). Very productive muscle-building phase.`;
      recompBadge = 'LEAN BULK';
      recompColor = '#22c55e';
    } else if (weightDeltaKg < 0 && waistChange < 0 && averageStrengthGainPct >= -1.0) {
      recompVerdict = `Successful Cut: Lost ${Math.abs(weightDeltaKg)}kg body weight and ${Math.abs(waistChange)}cm waist while holding 1RM strength (${averageStrengthGainPct >= 0 ? '+' : ''}${averageStrengthGainPct}%). Flawless muscle retention in a deficit.`;
      recompBadge = 'FAT LOSS WITH MUSCLE RETENTION';
      recompColor = '#22c55e';
    } else if (waistChange > limbChange && waistChange > 2) {
      recompVerdict = `Waist increased (+${waistChange}cm) faster than muscle circumferences (+${limbChange}cm). Caloric intake may be slightly too high relative to lifting stimulus.`;
      recompBadge = 'SURPLUS HIGH';
      recompColor = '#eab308';
    } else {
      recompVerdict = `Steady Progress: Body weight changed by ${weightDeltaKg >= 0 ? '+' : ''}${weightDeltaKg}kg, waist ${waistChange >= 0 ? '+' : ''}${waistChange}cm, and strength shifted by ${averageStrengthGainPct >= 0 ? '+' : ''}${averageStrengthGainPct}%.`;
      recompBadge = 'BALANCED PROGRESS';
      recompColor = '#3b82f6';
    }
  }

  // 6. The 4 Pillars of Progression & Composite Score
  // Pillar 1: Strength Progression (Relative Allometric 1RM)
  let p1Percent = 100;
  if (isCut) {
    if (userProfile.experienceLevel === 'Novice') {
      // Beginners have high neuromuscular plasticity & recomp potential: target is +2.5% to +3.0%
      if (averageStrengthGainPct >= 3.0) {
        p1Percent = Math.min(130, Math.round(100 + (averageStrengthGainPct - 3.0) * 10));
      } else if (averageStrengthGainPct >= 1.5) {
        p1Percent = Math.round(90 + (averageStrengthGainPct - 1.5) * 6.7);
      } else if (averageStrengthGainPct >= 0) {
        // Holding 1RM is solid muscle retention, but underperforms beginner recomp potential
        p1Percent = Math.round(75 + averageStrengthGainPct * 10);
      } else {
        p1Percent = Math.max(20, Math.round(55 + averageStrengthGainPct * 10));
      }
    } else if (userProfile.experienceLevel === 'Intermediate') {
      // Intermediates: 1RM preservation (0.0%) is standard benchmark
      if (averageStrengthGainPct >= 1.5) {
        p1Percent = Math.min(130, Math.round(105 + averageStrengthGainPct * 5));
      } else if (averageStrengthGainPct >= 0) {
        p1Percent = 100;
      } else if (averageStrengthGainPct >= -1.5) {
        p1Percent = Math.max(80, Math.round(100 + averageStrengthGainPct * 10));
      } else {
        p1Percent = Math.max(20, Math.round(60 + averageStrengthGainPct * 10));
      }
    } else if (userProfile.experienceLevel === 'Advanced') {
      // Advanced: holding 1RM near genetic ceiling is surpassing!
      if (averageStrengthGainPct >= 0) {
        p1Percent = Math.min(135, Math.round(110 + averageStrengthGainPct * 10));
      } else if (averageStrengthGainPct >= -1.0) {
        p1Percent = 100;
      } else if (averageStrengthGainPct >= -2.5) {
        p1Percent = Math.max(75, Math.round(90 + (averageStrengthGainPct + 1.0) * 10));
      } else {
        p1Percent = Math.max(20, Math.round(60 + averageStrengthGainPct * 10));
      }
    } else {
      // Elite:
      if (averageStrengthGainPct >= 0) {
        p1Percent = 115;
      } else if (averageStrengthGainPct >= -1.5) {
        p1Percent = 100;
      } else {
        p1Percent = Math.max(30, Math.round(80 + averageStrengthGainPct * 10));
      }
    }
  } else if (isBulk) {
    if (averageASGainPct < 0) {
      p1Percent = Math.max(15, Math.round(45 + averageASGainPct * 5));
    } else if (expectedGainRatePct > 0) {
      p1Percent = Math.min(140, Math.max(0, Math.round((averageStrengthGainPct / expectedGainRatePct) * 100)));
    }
  } else {
    // Maintenance
    if (expectedGainRatePct > 0) {
      p1Percent = Math.min(140, Math.max(0, Math.round((averageStrengthGainPct / expectedGainRatePct) * 100)));
    }
  }

  const p1Status: PillarProgress['status'] =
    isBulk && averageASGainPct < 0
      ? 'LACKING'
      : isCut && userProfile.experienceLevel === 'Novice' && averageStrengthGainPct < 1.5
      ? 'DEVELOPING'
      : p1Percent >= 105
      ? 'SURPASSING'
      : p1Percent >= 85
      ? 'OPTIMAL'
      : p1Percent >= 55
      ? 'DEVELOPING'
      : 'LACKING';

  const p1Color =
    isBulk && averageASGainPct < 0
      ? '#ef4444'
      : isCut && userProfile.experienceLevel === 'Novice' && averageStrengthGainPct < 1.5
      ? '#eab308'
      : p1Percent >= 85
      ? '#22c55e'
      : p1Percent >= 55
      ? '#eab308'
      : '#ef4444';

  const p1WhereLacking =
    isBulk && averageASGainPct < 0
      ? `Bodyweight (+${weightDeltaKg}kg) climbed faster than strength (+${averageStrengthGainPct}%). Allometric relative strength dropped by ${averageASGainPct}%.`
      : isCut && userProfile.experienceLevel === 'Novice' && averageStrengthGainPct < 1.5
      ? `Novices typically achieve body recomposition (+2.5% to +3% strength) during a cut. 1RM was maintained, but strength gain potential remains untapped.`
      : p1Percent < 85
      ? `Strength gain (+${averageStrengthGainPct}%) is below your benchmark target (+${expectedGainRatePct}%).`
      : '';

  const p1Action =
    isBulk && averageASGainPct < 0
      ? 'Reduce caloric surplus by 250–350 kcal/day and demand progressive overload on compound lifts before scale weight increases.'
      : isCut && userProfile.experienceLevel === 'Novice' && averageStrengthGainPct < 1.5
      ? 'Push for progressive overload! Even in a deficit, add 1 rep or 1 kg to compound lifts each week and keep protein at 2.0g/kg.'
      : p1Percent < 85
      ? 'Focus on heavy 3–5 rep sets on main compound lifts. Add 1–2.5 kg to bench, squat, deadlift, and row each week.'
      : 'Maintain current progressive overload trajectory.';

  // Pillar 2: Compound Workload (Number of Big 4 compounds tracked & performance)
  let p2Percent = 100;
  if (isCut) {
    p2Percent = evaluatedLifts.every((l) => l.deltaKg >= 0)
      ? 100
      : Math.max(70, Math.round(90 + averageStrengthGainPct * 5));
  } else {
    p2Percent = evaluatedLifts.length === 4 ? 100 : evaluatedLifts.length === 3 ? 95 : 90;
    if (evaluatedLifts.every((l) => l.deltaKg > 0)) {
      p2Percent = Math.min(120, p2Percent + 10);
    }
  }

  const p2Status: PillarProgress['status'] =
    p2Percent >= 105 ? 'SURPASSING' : p2Percent >= 80 ? 'OPTIMAL' : p2Percent >= 60 ? 'DEVELOPING' : 'LACKING';
  const p2Color = p2Percent >= 80 ? '#22c55e' : p2Percent >= 60 ? '#eab308' : '#ef4444';

  const p2WhereLacking =
    evaluatedLifts.length < 4
      ? `Currently evaluating ${evaluatedLifts.length} of 4 Big compound lifts. Tracking all 4 provides complete full-body stimulus diagnostic.`
      : '';
  const p2Action =
    evaluatedLifts.length < 4
      ? 'Track all 4 compound movements (Bench Press, Squat, Deadlift, Barbell Row) to verify balance across upper and lower push and pull.'
      : 'Great compound coverage across all primary human movement patterns.';

  // Pillar 3: Pace of Progress (Timeframe velocity vs biological benchmark)
  let p3Percent = 100;
  if (isCut) {
    if (userProfile.experienceLevel === 'Novice') {
      if (averageStrengthGainPct >= 3.0) {
        p3Percent = Math.min(130, Math.round(100 + (averageStrengthGainPct - 3.0) * 10));
      } else if (averageStrengthGainPct >= 1.5) {
        p3Percent = Math.round(90 + (averageStrengthGainPct - 1.5) * 6.7);
      } else if (averageStrengthGainPct >= 0) {
        p3Percent = 75; // 0% gain vs 3% recomp target
      } else {
        p3Percent = Math.max(20, Math.round(55 + averageStrengthGainPct * 10));
      }
    } else if (userProfile.experienceLevel === 'Intermediate') {
      if (averageStrengthGainPct >= 1.5) {
        p3Percent = Math.min(130, Math.round(105 + averageStrengthGainPct * 5));
      } else if (averageStrengthGainPct >= 0) {
        p3Percent = 100;
      } else if (averageStrengthGainPct >= -1.5) {
        p3Percent = Math.max(80, Math.round(100 + averageStrengthGainPct * 10));
      } else {
        p3Percent = Math.max(20, Math.round(60 + averageStrengthGainPct * 10));
      }
    } else if (userProfile.experienceLevel === 'Advanced') {
      if (averageStrengthGainPct >= 0) {
        p3Percent = Math.min(135, Math.round(110 + averageStrengthGainPct * 10));
      } else if (averageStrengthGainPct >= -1.0) {
        p3Percent = 100;
      } else {
        p3Percent = Math.max(30, Math.round(85 + averageStrengthGainPct * 10));
      }
    } else {
      // Elite
      if (averageStrengthGainPct >= 0) {
        p3Percent = 115;
      } else if (averageStrengthGainPct >= -1.5) {
        p3Percent = 100;
      } else {
        p3Percent = Math.max(30, Math.round(85 + averageStrengthGainPct * 10));
      }
    }
  } else if (isBulk && averageASGainPct < 0) {
    p3Percent = Math.max(20, Math.round(40 + averageASGainPct * 4));
  } else if (expectedGainRatePct > 0) {
    p3Percent = Math.min(140, Math.max(0, Math.round((averageStrengthGainPct / expectedGainRatePct) * 100)));
  }

  const p3Status: PillarProgress['status'] =
    isBulk && averageASGainPct < 0
      ? 'LACKING'
      : isCut && userProfile.experienceLevel === 'Novice' && averageStrengthGainPct < 1.5
      ? 'DEVELOPING'
      : p3Percent >= 105
      ? 'SURPASSING'
      : p3Percent >= 85
      ? 'OPTIMAL'
      : p3Percent >= 55
      ? 'DEVELOPING'
      : 'LACKING';
  const p3Color =
    isBulk && averageASGainPct < 0
      ? '#ef4444'
      : isCut && userProfile.experienceLevel === 'Novice' && averageStrengthGainPct < 1.5
      ? '#eab308'
      : p3Percent >= 85
      ? '#22c55e'
      : p3Percent >= 55
      ? '#eab308'
      : '#ef4444';

  const p3WhereLacking =
    isBulk && averageASGainPct < 0
      ? 'Weight gain outpaced force output. Non-contractile mass gained.'
      : isCut && userProfile.experienceLevel === 'Novice' && averageStrengthGainPct < 1.5
      ? 'Progress pace is conservative. Novices can push for 1–2kg overload increments even in a caloric deficit.'
      : p3Percent < 85
      ? `Rate of progression is below the biological standard (+${expectedGainRatePct}% over ${durationLabel}).`
      : '';
  const p3Action =
    isBulk && averageASGainPct < 0
      ? 'Tighten nutrition and emphasize intensity of effort.'
      : isCut && userProfile.experienceLevel === 'Novice' && averageStrengthGainPct < 1.5
      ? 'Take advantage of newbie adaptation: add 1 rep per set next week to drive recomposition.'
      : p3Percent < 85
      ? 'Ensure sufficient sleep (7.5+ hrs), protein intake (1.8–2.2g/kg), and proximity to failure (RIR 1–2).'
      : 'Pace is on point. Continue current progression.';

  // Pillar 4: Body Shape & Recomposition
  let p4Percent = 0;
  let p4Status: PillarProgress['status'] = 'DEVELOPING';
  let p4Color = '#71717a';
  let p4ActualVal = 'No measurements entered';
  let p4WhereLacking = '';
  let p4Action = '';

  if (!hasMeasurements) {
    p4Percent = 0;
    p4Status = 'DEVELOPING';
    p4Color = '#71717a';
    p4ActualVal = 'No measurements entered';
    p4WhereLacking = "No body circumferences entered for this period. Without measurements, physical muscle hypertrophy cannot be separated from fat mass changes or scale fluctuations.";
    p4Action = "Add starting and ending circumferences (waist, arms, chest, thighs) to unlock 100% accurate body recomposition diagnosis alongside your lift numbers.";
  } else {
    if (recompBadge === 'IDEAL RECOMP') {
      p4Percent = 115;
      p4Status = 'SURPASSING';
      p4Color = '#22c55e';
    } else if (recompBadge === 'LEAN BULK') {
      p4Percent = 105;
      p4Status = 'OPTIMAL';
      p4Color = '#22c55e';
    } else if (recompBadge === 'FAT LOSS WITH MUSCLE RETENTION') {
      p4Percent = 110;
      p4Status = 'OPTIMAL';
      p4Color = '#22c55e';
    } else if (recompBadge === 'SURPLUS HIGH') {
      p4Percent = 60;
      p4Status = 'DEVELOPING';
      p4Color = '#eab308';
      p4WhereLacking = 'Waist increased faster than limb circumferences. Caloric surplus may be too high.';
      p4Action = 'Reduce surplus by 200–300 kcal/day to keep gains clean and focused on lean contractile tissue.';
    } else {
      p4Percent = 90;
      p4Status = 'OPTIMAL';
      p4Color = '#3b82f6';
    }

    const parts: string[] = [];
    if (limbsAverageDeltaCm !== undefined) parts.push(`${limbsAverageDeltaCm >= 0 ? '+' : ''}${limbsAverageDeltaCm}cm Limbs`);
    if (waistDeltaCm !== undefined) parts.push(`${waistDeltaCm >= 0 ? '+' : ''}${waistDeltaCm}cm Waist`);
    p4ActualVal = parts.length > 0 ? parts.join(', ') : 'Measurements recorded';
  }

  // Weight reallocation logic:
  // When measurements present: 30% Strength, 25% Workload, 20% Pace, 25% Body Shape
  // When measurements missing: 40% Strength, 33% Workload, 27% Pace, 0% Body Shape
  const p1Weight = hasMeasurements ? 30 : 40;
  const p2Weight = hasMeasurements ? 25 : 33;
  const p3Weight = hasMeasurements ? 20 : 27;
  const p4Weight = hasMeasurements ? 25 : 0;

  const pillars: PillarProgress[] = [
    {
      id: 'allometric',
      name: 'Strength Score',
      badge: 'PILLAR 1',
      formula: 'Adjusted for bodyweight (1RM / BW^0.67)',
      scorePercent: p1Percent,
      weightPercent: p1Weight,
      weightBadge: hasMeasurements ? '30% WEIGHT • STRENGTH' : '40% WEIGHT (ADJUSTED) • STRENGTH',
      targetValue: isCut
        ? userProfile.experienceLevel === 'Novice'
          ? '+3.0% (Newbie Recomp Target)'
          : userProfile.experienceLevel === 'Advanced' || userProfile.experienceLevel === 'Elite'
          ? 'Preserve 1RM (-1.0% Buffer)'
          : 'Preserve 1RM (100% Target)'
        : `+${expectedGainRatePct}% Target`,
      actualValue: isCut
        ? `${averageStrengthGainPct >= 0 ? '+' : ''}${averageStrengthGainPct}% 1RM (${averageASGainPct >= 0 ? '+' : ''}${averageASGainPct}% Relative)`
        : `${averageStrengthGainPct >= 0 ? '+' : ''}${averageStrengthGainPct}% 1RM (${averageASGainPct >= 0 ? '+' : ''}${averageASGainPct}% AS)`,
      status: p1Status,
      statusColor: p1Color,
      whatItIsolates: hasMeasurements
        ? 'Pure strength relative to body size. Ensures gaining body weight is not mistaken for true strength progress.'
        : 'Pure strength relative to body size. [Weight boosted from 30% to 40% because body measurements are not logged].',
      whereLacking: p1WhereLacking,
      actionRequired: p1Action,
    },
    {
      id: 'volume',
      name: 'Compound Workload',
      badge: 'PILLAR 2',
      formula: 'Big 4 Compounds Tracked & Progression',
      scorePercent: p2Percent,
      weightPercent: p2Weight,
      weightBadge: hasMeasurements ? '25% WEIGHT • WORKLOAD' : '33% WEIGHT (ADJUSTED) • WORKLOAD',
      targetValue: isCut ? 'Preserve Working Loads' : '4 Big Compounds',
      actualValue: `${evaluatedLifts.length}/4 Compounds Tracked`,
      status: p2Status,
      statusColor: p2Color,
      whatItIsolates: hasMeasurements
        ? 'Total compound stimulus across the primary human movement patterns (push, pull, squat, hinge).'
        : 'Total compound stimulus across movement patterns. [Weight boosted from 25% to 33% because body measurements are not logged].',
      whereLacking: p2WhereLacking,
      actionRequired: p2Action,
    },
    {
      id: 'velocity',
      name: 'Pace of Progress',
      badge: 'PILLAR 3',
      formula: 'Actual gains vs Target gains over time',
      scorePercent: p3Percent,
      weightPercent: p3Weight,
      weightBadge: hasMeasurements ? '20% WEIGHT • PACE' : '27% WEIGHT (ADJUSTED) • PACE',
      targetValue: isCut
        ? userProfile.experienceLevel === 'Novice'
          ? '1.0× (+3% Recomp Benchmark)'
          : '1.0× Benchmark Pace'
        : '1.0× Benchmark Pace',
      actualValue: isCut
        ? userProfile.experienceLevel === 'Novice'
          ? averageStrengthGainPct >= 3.0
            ? '1.0× Pace (Recomp Target Met)'
            : '0.0× Growth (1RM Preserved - Recomp Below Potential)'
          : averageStrengthGainPct >= 0
          ? '1.0× Pace (1RM Preserved in Deficit)'
          : `${(1 + averageStrengthGainPct / 10).toFixed(2)}× Pace`
        : `${(averageStrengthGainPct / (expectedGainRatePct || 1)).toFixed(2)}× Pace`,
      status: p3Status,
      statusColor: p3Color,
      whatItIsolates: hasMeasurements
        ? 'How quickly you are improving compared to your biological benchmark over this timeframe.'
        : 'Pace of progress vs benchmark target. [Weight boosted from 20% to 27% because body measurements are not logged].',
      whereLacking: p3WhereLacking,
      actionRequired: p3Action,
    },
    {
      id: 'recomp',
      name: 'Body Shape & Measurements',
      badge: 'PILLAR 4',
      formula: 'Circumferences vs Scale Weight',
      scorePercent: p4Percent,
      weightPercent: p4Weight,
      weightBadge: hasMeasurements ? '25% WEIGHT • BODY SHAPE' : '0% WEIGHT • AWAITING MEASUREMENTS',
      targetValue: hasMeasurements ? 'Lean & Muscular Shape' : 'Circumferences required',
      actualValue: p4ActualVal,
      status: p4Status,
      statusColor: p4Color,
      whatItIsolates: hasMeasurements
        ? 'All your body measurements (arms, chest, thighs, waist) compared with bodyweight to give an honest picture of muscle vs. fat changes.'
        : 'Body shape & circumference symmetry. [UNWEIGHTED: 25% weight shifted to Strength (+10%), Workload (+8%), and Pace (+7%) so your progress can still be assessed from gym performance, but physical measurements are required for an accurate picture].',
      whereLacking: p4WhereLacking,
      actionRequired: p4Action,
    },
  ];

  // Composite Weighted Score across all 4 pillars!
  let compositeScorePct = 0;
  if (!hasMeasurements) {
    compositeScorePct = Math.round((p1Percent * 40 + p2Percent * 33 + p3Percent * 27) / 100);
  } else {
    compositeScorePct = Math.round(
      p1Percent * 0.30 + p2Percent * 0.25 + p3Percent * 0.20 + p4Percent * 0.25
    );
  }

  // Velocity classification derived from the composite score & experience level
  let overallVelocity: PeriodAssessmentResult['overallVelocity'] = 'ON TRACK';
  let velocityColor = '#22c55e';

  if (isBulk && averageASGainPct < 0) {
    overallVelocity = 'PLATEAU / STALLED';
    velocityColor = '#ef4444';
  } else if (isCut && userProfile.experienceLevel === 'Novice' && averageStrengthGainPct < 1.5) {
    overallVelocity = 'MAKING PROGRESS';
    velocityColor = '#eab308';
  } else if (isCut && (userProfile.experienceLevel === 'Advanced' || userProfile.experienceLevel === 'Elite') && averageStrengthGainPct >= 0) {
    overallVelocity = 'SURPASSING';
    velocityColor = '#22c55e';
  } else if (compositeScorePct >= 105) {
    overallVelocity = 'SURPASSING';
    velocityColor = '#22c55e';
  } else if (compositeScorePct >= 85) {
    overallVelocity = 'ON TRACK';
    velocityColor = '#22c55e';
  } else if (compositeScorePct >= 55) {
    overallVelocity = 'MAKING PROGRESS';
    velocityColor = '#eab308';
  } else {
    overallVelocity = 'PLATEAU / STALLED';
    velocityColor = '#ef4444';
  }

  const accuracyVerdict: PeriodAssessmentResult['accuracyVerdict'] = hasMeasurements
    ? 'ACCURATE (FULL MEASUREMENTS)'
    : 'ESTIMATED (WORKOUT PERFORMANCE ONLY)';

  const accuracyNote = hasMeasurements
    ? 'Full multi-dimensional diagnostic with both workout performance and physical body measurements factored in.'
    : "Your progress isn't sufficiently or accurately described because you haven't added your measurements yet. We have increased the weight of your other facets (Strength: 40%, Workload: 33%, Pace: 27%) so we can still judge your progression, but it won't be as accurate as when you add your measurements.";

  const reallocatedWeightsNote = hasMeasurements
    ? 'Standard balanced weighting: Strength (30%) + Workload (25%) + Pace (20%) + Body Shape (25%)'
    : 'Adjusted weighting: Strength (40%) + Workload (33%) + Pace (27%) • Body Shape (0% - awaiting circumferences)';

  const compositeWeightFormula = hasMeasurements
    ? 'Strength (30%) + Workload (25%) + Pace (20%) + Body Shape (25%)'
    : 'Strength (40%) + Workload (33%) + Pace (27%) • (Measurements Missing)';

  const mathematicalReality = isCut
    ? `Bodyweight dropped: ${weightDeltaKg}kg (${weightDeltaPct}%). 1RM change across ${evaluatedLifts.length} compound movements: ${averageStrengthGainPct >= 0 ? '+' : ''}${averageStrengthGainPct}%, boosting Allometric Relative Strength (1RM / BW^0.67) by +${averageASGainPct}% (Overall Score: ${compositeScorePct}%).`
    : isBulk
    ? averageASGainPct < 0
      ? `Bodyweight jumped +${weightDeltaKg}kg (+${weightDeltaPct}%), while 1RM only rose +${averageStrengthGainPct}%. Your Allometric Relative Strength (1RM / BW^0.67) dropped by ${averageASGainPct}%, meaning force per unit of mass declined (Score: ${compositeScorePct}%).`
      : `Bodyweight gained: +${weightDeltaKg}kg (+${weightDeltaPct}%). 1RM gain: +${averageStrengthGainPct}% across ${evaluatedLifts.length} compound movements vs target of +${expectedGainRatePct}% over ${durationLabel} (Overall Progression Score: ${compositeScorePct}%).`
    : `Stable bodyweight (±${Math.abs(weightDeltaKg)}kg). Strength gained: +${averageStrengthGainPct}% across ${evaluatedLifts.length} compound movements vs target of +${expectedGainRatePct}% over ${durationLabel} (Overall Progression Score: ${compositeScorePct}%).`;

  const physiologicalMeaning = isCut
    ? userProfile.experienceLevel === 'Novice'
      ? averageStrengthGainPct >= 2.0
        ? `Exceptional Novice Recomposition: As a Novice in a caloric deficit, adding +${averageStrengthGainPct}% to your 1RM while losing ${Math.abs(weightDeltaKg)}kg proves dramatic neuromuscular recruitment and muscle gain despite caloric restriction. Relative strength rose +${averageASGainPct}%.`
        : averageStrengthGainPct >= 0
        ? `Solid Retention, Untapped Recomp Potential: As a Novice, maintaining 1RM during a cut is positive (relative strength +${averageASGainPct}%), but novices possess high biological plasticity to actively gain strength (recomposition) even in a deficit. You protected your baseline, but can push for progressive overload.`
        : `Novice Strength Dip: In a caloric deficit, dropping ${Math.abs(weightDeltaKg)}kg coincided with a ${Math.abs(averageStrengthGainPct)}% drop in 1RM. Novices should aim to maintain or gain strength during cuts.`
      : (userProfile.experienceLevel === 'Advanced' || userProfile.experienceLevel === 'Elite')
      ? averageStrengthGainPct >= 0
        ? `Elite Contractile Preservation: Near the genetic ceiling, maintaining 100% of your 1RM while shedding ${Math.abs(weightDeltaKg)}kg is an outstanding feat of anti-catabolic preservation. Relative strength escalated by +${averageASGainPct}%.`
        : averageStrengthGainPct >= -2.0
        ? `Acceptable Advanced Deficit Adaptation: Advanced lifters carrying high muscle mass often experience minor leverage loss (-${Math.abs(averageStrengthGainPct)}% 1RM) during deep cuts, while relative strength remained resilient.`
        : `Excessive Strength Decline: For an advanced lifter, losing ${Math.abs(averageStrengthGainPct)}% 1RM indicates potential contractile tissue catabolism or excessive fatigue.`
      : // Intermediate
      averageStrengthGainPct >= 0
      ? `Textbook Intermediate Deficit Mastery: Maintaining 1RM while dropping ${Math.abs(weightDeltaKg)}kg body mass proves your weight loss was purely adipose fat with zero contractile muscle loss. Relative strength climbed by +${averageASGainPct}%.`
      : `Moderate Strength Dip in Deficit: Bodyweight dropped by ${Math.abs(weightDeltaKg)}kg and 1RM dipped by ${Math.abs(averageStrengthGainPct)}%. Relative strength shifted by ${averageASGainPct >= 0 ? '+' : ''}${averageASGainPct}%.`
    : isBulk && averageASGainPct < 0
    ? `Putting on +${weightDeltaKg}kg while only increasing strength by +${averageStrengthGainPct}% is not true progress: Because force capacity failed to scale with body mass, the weight gained was non-contractile fat mass or fluid rather than functional muscle tissue. True muscle growth increases your Allometric Score.`
    : overallVelocity === 'SURPASSING'
    ? `Exceptional Progression Surge: Overall score of ${compositeScorePct}% across compound lifts (+${averageStrengthGainPct}%) over ${durationLabel} exceeds expected biological benchmarks (+${expectedGainRatePct}%). Rapid neuromuscular adaptation and force production.`
    : hasMeasurements
    ? `${recompVerdict} Overall multi-dimensional progression score reached ${compositeScorePct}%.`
    : `Progression evaluated from workout performance metrics across ${evaluatedLifts.length} compound lifts (${evaluatedLifts.map((l) => l.name).join(', ')}). Composite score: ${compositeScorePct}%.`;

  const actionDirective = isCut
    ? userProfile.experienceLevel === 'Novice'
      ? averageStrengthGainPct >= 2.0
        ? 'Outstanding novice recomp! Your training intensity and nutrition are dialed in. Continue this progression.'
        : averageStrengthGainPct >= 0
        ? 'You have maintained your strength well, but as a beginner/novice you have the biological potential to increase your lifts even while losing weight. Try microloading (+1kg) or aiming for 1 more rep on your main lifts before settling for maintenance.'
        : 'Ensure you are consuming 1.8-2.2g/kg protein and keeping lifting intensity high (RPE 7-9). Novices should not be losing strength on a moderate cut.'
      : (userProfile.experienceLevel === 'Advanced' || userProfile.experienceLevel === 'Elite')
      ? averageStrengthGainPct >= 0
        ? 'Elite execution! Holding onto your peak 1RM in a caloric deficit requires precise fatigue management and nutrition. Maintain current calorie and training parameters.'
        : 'Incorporate refeed days or reduce auxiliary volume to protect top-end neurological drive and leverage on key compound lifts.'
      : // Intermediate
      averageStrengthGainPct >= 0
      ? 'Your caloric deficit and lifting intensity are in golden balance. Your contractile muscle is 100% protected. Continue fat loss at this exact pace until you reach your target body fat percentage.'
      : 'Strength loss was slightly faster than optimal during this cut. Increase daily protein (aim for 2.0g/kg) and consider a 150 kcal bump or reducing non-essential accessory volume to safeguard top-end strength.'
    : isBulk && averageASGainPct < 0
    ? 'Scale back your caloric intake. Reduce surplus by 250–350 kcal/day and demand progressive overload on the bar before allowing scale weight to climb further.'
    : overallVelocity === 'SURPASSING' || overallVelocity === 'ON TRACK'
    ? 'Your programming and recovery are performing at or above expected standards for your experience level. Continue with your current overload progression.'
    : overallVelocity === 'MAKING PROGRESS'
    ? 'Progress is moving in the right direction. To accelerate gains closer to optimal, ensure you are progressively adding 1–2kg or 1 rep each week and hitting daily protein requirements.'
    : 'Progress has plateaued over this period. Consider taking a planned deload week to clear systemic fatigue, then re-engage with structured periodization.';

  return {
    result: {
      durationDays,
      durationMonths,
      durationLabel,
      startBodyweightKg: startBW,
      endBodyweightKg: endBW,
      weightDeltaKg,
      weightDeltaPct,
      phaseType,
      evaluatedLifts,
      compoundCountUsed: evaluatedLifts.length,
      averageStrengthGainPct,
      averageASDelta,
      averageASGainPct,
      expectedGainRatePct,
      relativeStrengthSummary,
      hasMeasurements,
      waistDeltaCm,
      armDeltaCm,
      chestDeltaCm,
      thighDeltaCm,
      limbsAverageDeltaCm,
      recompVerdict,
      recompBadge,
      recompColor,
      overallVelocity,
      velocityColor,
      compositeScorePct,
      mathematicalReality,
      physiologicalMeaning,
      actionDirective,
      pillars,
      accuracyVerdict,
      accuracyNote,
      reallocatedWeightsNote,
      compositeWeightFormula,
    },
  };
}

/**
 * 1-Click Action: Persists the assessed period progress to the user's account:
 * 1. Weigh-in logs (Start date & End date)
 * 2. Body measurement entries (Start date & End date)
 * 3. 1RM Benchmark sessions & PR records for the entered compound lifts (Start date & End date)
 * 4. Updates profile current weight
 */
export async function applyPeriodAssessmentToAccount(
  form: PeriodAssessmentFormState,
  evaluation: PeriodAssessmentResult,
  updateProfileWeight: (weight: string) => void
): Promise<boolean> {
  const { startDate, endDate, startBodyweightKg, endBodyweightKg, startMeasurements, endMeasurements } = form;

  try {
    const sBW = parseFloat(startBodyweightKg);
    const eBW = parseFloat(endBodyweightKg);

    // 1. Log weights
    if (sBW > 0) {
      await apiClient.logWeight(sBW, startDate);
    }
    if (eBW > 0) {
      await apiClient.logWeight(eBW, endDate);
      updateProfileWeight(endBodyweightKg);
    }

    // 2. Log measurements if provided
    const hasStartM = Object.values(startMeasurements).some((v) => parseFloat(v || '') > 0);
    if (hasStartM) {
      const entry: BodyMeasurement = {
        date: startDate,
        waist_cm: parseFloat(startMeasurements.waist_cm || '') || undefined,
        chest_cm: parseFloat(startMeasurements.chest_cm || '') || undefined,
        arm_cm: parseFloat(startMeasurements.arm_cm || '') || undefined,
        thigh_cm: parseFloat(startMeasurements.thigh_cm || '') || undefined,
        shoulders_cm: parseFloat(startMeasurements.shoulders_cm || '') || undefined,
        hip_cm: parseFloat(startMeasurements.hip_cm || '') || undefined,
        calf_cm: parseFloat(startMeasurements.calf_cm || '') || undefined,
        notes: `Period Progress (Start Date: ${startDate})`,
      };
      await useMeasurementStore.getState().saveMeasurement(entry);
    }

    const hasEndM = Object.values(endMeasurements).some((v) => parseFloat(v || '') > 0);
    if (hasEndM) {
      const entry: BodyMeasurement = {
        date: endDate,
        waist_cm: parseFloat(endMeasurements.waist_cm || '') || undefined,
        chest_cm: parseFloat(endMeasurements.chest_cm || '') || undefined,
        arm_cm: parseFloat(endMeasurements.arm_cm || '') || undefined,
        thigh_cm: parseFloat(endMeasurements.thigh_cm || '') || undefined,
        shoulders_cm: parseFloat(endMeasurements.shoulders_cm || '') || undefined,
        hip_cm: parseFloat(endMeasurements.hip_cm || '') || undefined,
        calf_cm: parseFloat(endMeasurements.calf_cm || '') || undefined,
        notes: `Period Progress (End Date: ${endDate})`,
      };
      await useMeasurementStore.getState().saveMeasurement(entry);
    }

    // 3. Record compound lift benchmark sessions & update PRs
    const workoutStore = useWorkoutStore.getState();
    const prStore = usePRStore.getState();

    for (const lift of evaluation.evaluatedLifts) {
      const exId = THE_BIG_4_MOVEMENTS[lift.key].exerciseId;
      const canonicalKey = normalizeExerciseKey(exId);

      // Record start session
      if (lift.start1RM > 0) {
        workoutStore.recordBenchmarkSession(canonicalKey, lift.start1RM, 10, startDate);
      }

      // Record end session
      if (lift.end1RM > 0) {
        workoutStore.recordBenchmarkSession(canonicalKey, lift.end1RM, 10, endDate);
        prStore.set1RM(canonicalKey, lift.end1RM, 10);
      }
    }

    return true;
  } catch (err) {
    console.error('Failed to apply period assessment to account:', err);
    return false;
  }
}
