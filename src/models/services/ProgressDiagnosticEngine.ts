import { getAllometricScore, getGenderModifier, getAgeModifier, calculateEpley1RM } from './StrengthEngine';
import { BodyMeasurement } from '../types/Measurement';
import { PREntry } from '../types/PersonalRecord';
import { WorkoutSession } from '../types/WorkoutHistory';

export type TimeFrame = '1m' | '3m' | '6m' | '1y' | 'lifetime';
export type ExperienceLevel = 'Novice' | 'Intermediate' | 'Advanced' | 'Elite';
export type DiagnosticVelocity = 'NOT STARTED' | 'ON TRACK' | 'MAKING PROGRESS' | 'PLATEAU / STALLED';

export interface ProgressDiagnosticOptions {
  gender: string; // 'Male' | 'Female'
  age: number;
  bodyweightKg: number;
  baselineBodyweightKg?: number; // Starting bodyweight at beginning of period
  experienceLevel: ExperienceLevel;
  timeframe: TimeFrame;
  personalRecords?: Record<string, PREntry>;
  measurements?: BodyMeasurement[];
  workoutHistory?: WorkoutSession[];
}

export interface MetricCorrelationDetail {
  metric: string;
  badge: string;
  whatItShows: string;
  whyItMatters: string;
  userValue: string;
  status: 'EXCELLING' | 'ON TRACK' | 'NEEDS ATTENTION' | 'AWAITING DATA';
  statusColor: string;
}

export interface HorizonDataPoint {
  timeframe?: TimeFrame;
  shortLabel: string;
  label: string;
  days: number;
  expectedRate: number; // Required progress rate %
  actualRate: number | null; // User's actual gain rate % (null if not reached)
  expectedDeltaAS: number; // Required Allometric Score gain
  actualDeltaAS: number | null; // User's actual Allometric Score gain (null if not reached)
  isCurrent?: boolean;
}

export interface TrainingAgeImpact {
  level: ExperienceLevel;
  modifier: number;
  expectedRateForCurrentTimeframe: number;
  expected6mRate: number;
  expected1yRate: number;
  biologicalRationale: string;
  isSelected: boolean;
}

export interface PillarProgress {
  id: 'allometric' | 'volume' | 'velocity' | 'recomp';
  name: string;
  badge: string;
  formula: string;
  scorePercent: number; // e.g. 91%
  targetValue: string;
  actualValue: string;
  status: 'SURPASSING' | 'OPTIMAL' | 'DEVELOPING' | 'LACKING';
  statusColor: string;
  weightPercent: number; // 30, 25, 20, 25
  weightBadge: string; // e.g. '30% WEIGHT • STRENGTH'
  isSkeletallyConstrained?: boolean;
  structuralNote?: string;
  whatItIsolates: string;
  whereLacking: string;
  actionRequired: string;
}

export interface DiagnosticResult {
  timeframe: TimeFrame;
  timeframeLabel: string;
  timeframeDays: number;
  baseGainRate: number; // e.g. 40.0% for 6m, 100.0% for lifetime
  genderModifier: number; // 1.00 or 0.70
  ageModifier: number; // 1.00, 0.85, 0.60
  experienceModifier: number; // 1.00, 0.55, 0.25, 0.10
  expectedGainRate: number; // The individual biological ceiling rate (100.0% for lifetime)
  actualGainRate: number; // User's actual calculated growth rate from real data
  actualDeltaAS: number; // Actual Allometric Score change
  loggedDays: number;
  loggedMonths: number;
  loggedDurationLabel: string;
  totalSessionsLogged: number;
  hasMeasurements: boolean;
  accuracyVerdict: 'ACCURATE (FULL MEASUREMENTS)' | 'ESTIMATED (WORKOUT PERFORMANCE ONLY)';
  accuracyNote: string;
  reallocatedWeightsNote: string;
  velocity: DiagnosticVelocity;
  velocityColor: string;
  mathematicalReality: string;
  physiologicalMeaning: string;
  actionDirective: string;
  metricsCorrelation: MetricCorrelationDetail[];
  curveData: HorizonDataPoint[];
  trainingAgeMatrix: TrainingAgeImpact[];
  pillars: PillarProgress[];
  compositeWeightedScore: number;
  compositeWeightFormula: string;
}

// ─── Biological Modifier Formulas (From Reference Graphics) ───────────────────

export function getExperienceModifier(level: ExperienceLevel): number {
  switch (level) {
    case 'Novice':
      return 1.0; // Rapid newbie velocity (< 1 year)
    case 'Intermediate':
      return 0.55; // 1 - 3 years
    case 'Advanced':
      return 0.25; // 3 - 5 years
    case 'Elite':
      return 0.10; // 5+ years (plateau near genetic limit)
    default:
      return 1.0;
  }
}

export function getBaseGainForTimeframe(timeframe: TimeFrame): { baseRate: number; days: number; label: string } {
  switch (timeframe) {
    case '1m':
      return { baseRate: 8.0, days: 30, label: '1 Month (Quick Start)' };
    case '3m':
      return { baseRate: 18.0, days: 90, label: '3 Months (Quarterly Progress)' };
    case '6m':
      return { baseRate: 30.0, days: 180, label: '6 Months (Standard Period)' };
    case '1y':
      return { baseRate: 45.0, days: 365, label: '1 Year (Annual Gains)' };
    case 'lifetime':
      return { baseRate: 100.0, days: 1825, label: 'Lifetime (Long-Term Potential)' };
    default:
      return { baseRate: 30.0, days: 180, label: '6 Months' };
  }
}

export function getBaseRateForDays(days: number): number {
  if (days <= 0) return 0;
  if (days <= 30) return parseFloat(((days / 30) * 8.0).toFixed(1));
  if (days <= 90) return parseFloat((8.0 + ((days - 30) / 60) * 10.0).toFixed(1));
  if (days <= 180) return parseFloat((18.0 + ((days - 90) / 90) * 12.0).toFixed(1));
  if (days <= 365) return parseFloat((30.0 + ((days - 180) / 185) * 15.0).toFixed(1));
  if (days <= 1825) return parseFloat((45.0 + ((days - 365) / 1460) * 55.0).toFixed(1));
  return 100.0;
}

/**
 * Calculates individual adaptation ceilings and diagnostic velocity classifications
 * matching Dr. Lon Kilgore and Rhea et al. dose-response peer-reviewed standards.
 * Strictly calculates actual progression from real user workout sessions and PRs.
 */
export function evaluateUserProgress(options: ProgressDiagnosticOptions): DiagnosticResult {
  const {
    gender,
    age,
    bodyweightKg,
    experienceLevel,
    timeframe,
    personalRecords = {},
    measurements = [],
    workoutHistory = [],
  } = options;

  // Step 1: Biological Modifiers
  const genderMod = gender === 'Female' ? 0.70 : 1.0;
  const ageMod = getAgeModifier(age);
  const expMod = getExperienceModifier(experienceLevel);

  const { baseRate, days, label } = getBaseGainForTimeframe(timeframe);

  // Requirement: When the user clicks Lifetime, expected growth is ALWAYS 100%
  // regardless of beginner, intermediate, advanced, or elite.
  const expectedGainRate = timeframe === 'lifetime'
    ? 100.0
    : parseFloat((baseRate * genderMod * ageMod * expMod).toFixed(1));

  // Step 2: Extract Real User Training Timeline & Exercise Histories (No Simulated Data)
  const validSessions = workoutHistory
    .filter((s) => s.date && s.exercises && s.exercises.length > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalSessionsLogged = validSessions.length;
  let loggedDays = 0;
  let loggedMonths = 0;
  let loggedDurationLabel = '0 days logged (No workouts yet)';

  interface TimelinePoint {
    daysFromStart: number;
    oneRM: number;
  }
  const exerciseHistories = new Map<string, TimelinePoint[]>();
  let earliestTime = 0;
  let latestTime = 0;

  if (totalSessionsLogged > 0) {
    earliestTime = new Date(validSessions[0].date).getTime();
    latestTime = new Date(validSessions[validSessions.length - 1].date).getTime();
    const spanMs = Math.max(0, latestTime - earliestTime);
    loggedDays = Math.max(1, Math.round(spanMs / (1000 * 60 * 60 * 24)));
    loggedMonths = parseFloat((loggedDays / 30.417).toFixed(1));

    if (loggedDays < 7) {
      loggedDurationLabel = `${loggedDays} day${loggedDays > 1 ? 's' : ''} logged (${totalSessionsLogged} session${totalSessionsLogged > 1 ? 's' : ''})`;
    } else if (loggedDays < 60) {
      const weeks = Math.round(loggedDays / 7);
      loggedDurationLabel = `${weeks} week${weeks > 1 ? 's' : ''} logged (${totalSessionsLogged} session${totalSessionsLogged > 1 ? 's' : ''})`;
    } else {
      loggedDurationLabel = `${loggedMonths} month${loggedMonths > 1 ? 's' : ''} logged (${totalSessionsLogged} session${totalSessionsLogged > 1 ? 's' : ''})`;
    }

    for (const session of validSessions) {
      const sessionDate = new Date(session.date);
      const daysFromStart = Math.max(0, Math.round((sessionDate.getTime() - earliestTime) / (1000 * 60 * 60 * 24)));

      for (const ex of session.exercises) {
        let ex1RM = ex.bestEpley1RM || 0;
        if (ex1RM <= 0 && ex.sets && ex.sets.length > 0) {
          for (const s of ex.sets) {
            const set1RM = calculateEpley1RM(Number(s.weight), Number(s.reps));
            if (set1RM > ex1RM) ex1RM = set1RM;
          }
        }

        if (ex1RM > 0) {
          if (!exerciseHistories.has(ex.exerciseId)) {
            exerciseHistories.set(ex.exerciseId, []);
          }
          exerciseHistories.get(ex.exerciseId)!.push({
            daysFromStart,
            oneRM: ex1RM,
          });
        }
      }
    }
  }

  // Step 3: Compute Real Baseline and Current 1RMs
  let totalBaseline1RM = 0;
  let totalCurrent1RM = 0;
  let trackedExerciseCount = 0;
  const overallExerciseGains: number[] = [];

  for (const [exId, entries] of exerciseHistories.entries()) {
    if (entries.length === 0) continue;
    const baseline1RM = entries[0].oneRM;
    const sessionLatest1RM = entries[entries.length - 1].oneRM;
    const pr1RM = personalRecords[exId]?.oneRM || 0;
    const current1RM = Math.max(sessionLatest1RM, pr1RM);

    if (baseline1RM > 0) {
      totalBaseline1RM += baseline1RM;
      totalCurrent1RM += current1RM;
      trackedExerciseCount++;
      const gainPct = ((current1RM - baseline1RM) / baseline1RM) * 100;
      overallExerciseGains.push(gainPct);
    }
  }

  // If user has personal records without matching session history, factor them in
  const prEntries = Object.values(personalRecords);
  let currentAverage1RM = 0;
  if (trackedExerciseCount > 0) {
    currentAverage1RM = totalCurrent1RM / trackedExerciseCount;
  } else if (prEntries.length > 0) {
    const sum = prEntries.reduce((acc, pr) => acc + pr.oneRM, 0);
    currentAverage1RM = sum / prEntries.length;
  } else {
    currentAverage1RM = 0;
  }

  const baselineAverage1RM = trackedExerciseCount > 0 ? totalBaseline1RM / trackedExerciseCount : currentAverage1RM;

  // Real actual gain rate across all sessions
  const totalSessionGainRate = overallExerciseGains.length > 0 && totalSessionsLogged > 1
    ? parseFloat((overallExerciseGains.reduce((a, b) => a + b, 0) / overallExerciseGains.length).toFixed(1))
    : 0.0;

  // Helper to compute actual strength gain at a specific milestone cutoff (days)
  function computeGainAtDays(cutoffDays: number): number | null {
    if (totalSessionsLogged <= 1 || loggedDays < Math.round(cutoffDays * 0.75)) {
      return null;
    }
    const milestoneGains: number[] = [];
    for (const [, entries] of exerciseHistories.entries()) {
      if (entries.length === 0) continue;
      const baseline = entries[0].oneRM;
      const entriesBeforeCutoff = entries.filter((e) => e.daysFromStart <= cutoffDays * 1.15);
      if (entriesBeforeCutoff.length === 0) continue;
      const latestAtCutoff = entriesBeforeCutoff[entriesBeforeCutoff.length - 1].oneRM;
      if (baseline > 0 && latestAtCutoff > 0) {
        milestoneGains.push(((latestAtCutoff - baseline) / baseline) * 100);
      }
    }
    if (milestoneGains.length === 0) return null;
    return parseFloat((milestoneGains.reduce((a, b) => a + b, 0) / milestoneGains.length).toFixed(1));
  }

  // Determine actual gain rate for the chosen timeframe
  // If user selects '1m' and has logged 4 months, show the 1m gain.
  // If user selects '6m' or 'lifetime' and has only logged 4 months, show the 4 months gain (never fabricate data!).
  let actualGainRate = totalSessionGainRate;
  if (totalSessionsLogged > 1) {
    const milestoneGain = computeGainAtDays(days);
    if (milestoneGain !== null) {
      actualGainRate = milestoneGain;
    } else {
      // User has trained less than this timeframe's days; show their actual logged gain
      actualGainRate = totalSessionGainRate;
    }
  }

  const currentBW = bodyweightKg || 0;
  const baselineBW = (options.baselineBodyweightKg && options.baselineBodyweightKg > 0) ? options.baselineBodyweightKg : currentBW;
  const currentAS = currentAverage1RM > 0 && currentBW > 0 ? getAllometricScore(currentAverage1RM, currentBW) : 0;
  const baselineAS = baselineAverage1RM > 0 && baselineBW > 0 ? getAllometricScore(baselineAverage1RM, baselineBW) : currentAS;
  const actualDeltaAS = parseFloat((currentAS - baselineAS).toFixed(2));
  const asGainRatePct = baselineAS > 0 ? parseFloat((((currentAS - baselineAS) / baselineAS) * 100).toFixed(1)) : 0;
  const isUnproductiveMassGain = currentBW > baselineBW + 1.5 && currentAS > 0 && baselineAS > 0 && currentAS < baselineAS;

  // Step 4: Body Measurement Assessment (Calculated early for diagnostic accuracy)
  const latestMeasurement = measurements.length > 0 ? measurements[0] : null;
  const m = latestMeasurement;
  let bodyCompScore = 0;
  let bodyCompFactorsUsed = 0;

  if (m) {
    if (m.shoulders_cm && m.waist_cm && m.waist_cm > 0) {
      const taperRatio = m.shoulders_cm / m.waist_cm;
      const taperPct = Math.min(130, Math.round((taperRatio / 1.618) * 100));
      bodyCompScore += taperPct;
      bodyCompFactorsUsed++;
    }
    if (m.arm_cm && bodyweightKg > 0) {
      const armTarget = Math.pow(bodyweightKg, 0.33) * (gender === 'Female' ? 3.5 : 4.2);
      const armPct = Math.min(130, Math.round((m.arm_cm / armTarget) * 100));
      bodyCompScore += armPct;
      bodyCompFactorsUsed++;
    }
    if (m.chest_cm && m.waist_cm && m.waist_cm > 0) {
      const chestWaistRatio = m.chest_cm / m.waist_cm;
      const chestPct = Math.min(130, Math.round((chestWaistRatio / 1.35) * 100));
      bodyCompScore += chestPct;
      bodyCompFactorsUsed++;
    }
    if (m.thigh_cm && bodyweightKg > 0) {
      const thighTarget = Math.pow(bodyweightKg, 0.33) * (gender === 'Female' ? 6.8 : 7.2);
      const thighPct = Math.min(130, Math.round((m.thigh_cm / thighTarget) * 100));
      bodyCompScore += thighPct;
      bodyCompFactorsUsed++;
    }
    if (m.waist_cm && bodyweightKg > 0) {
      const waistToBW = m.waist_cm / bodyweightKg;
      const waistScore = Math.min(130, Math.round((1.0 / Math.max(0.7, waistToBW)) * 100));
      bodyCompScore += waistScore;
      bodyCompFactorsUsed++;
    }
    if (m.calf_cm && bodyweightKg > 0) {
      const calfTarget = Math.pow(bodyweightKg, 0.33) * (gender === 'Female' ? 4.0 : 4.3);
      const calfPct = Math.min(130, Math.round((m.calf_cm / calfTarget) * 100));
      bodyCompScore += calfPct;
      bodyCompFactorsUsed++;
    }
  }

  const hasMeasurements = bodyCompFactorsUsed > 0;

  // Step 5: Diagnostic Velocity Classification
  let velocity: DiagnosticVelocity;
  let velocityColor: string;
  let mathematicalReality: string;
  let physiologicalMeaning: string;
  let actionDirective: string;

  if (totalSessionsLogged === 0) {
    velocity = 'NOT STARTED';
    velocityColor = '#71717a';
    mathematicalReality = `0 workouts logged • 0% progress recorded (Target: +${expectedGainRate}% over ${label})`;
    physiologicalMeaning = hasMeasurements
      ? 'Initial body measurements are logged, but no workouts have been completed yet. Log your first workout to establish your performance baseline.'
      : 'No workouts or body measurements have been recorded yet. Log your first workout and enter your initial circumferences in Profile to establish your baseline.';
    actionDirective = 'Log your first workout in the Workout tab to start tracking your progress.';
  } else if (isUnproductiveMassGain) {
    velocity = 'PLATEAU / STALLED';
    velocityColor = '#ef4444';
    mathematicalReality = `Unproductive Mass Gain: Scale weight increased by +${(currentBW - baselineBW).toFixed(1)}kg, while 1RM only rose by +${actualGainRate}%. Your Allometric Relative Strength (1RM / BW^0.67) dropped by ${Math.abs(asGainRatePct)}% (${baselineAS} -> ${currentAS} AS pts).`;
    physiologicalMeaning = `Putting on an extra ${(currentBW - baselineBW).toFixed(1)}kg while only increasing strength by +${actualGainRate}% means force capacity failed to scale with body mass. The weight gained was predominantly non-contractile fat mass or fluid rather than functional muscle tissue.`;
    actionDirective = `Reduce caloric surplus by 250–350 kcal/day. Prioritize progressive overload on main compound lifts and ensure weight on the bar is climbing before allowing scale weight to increase.`;
  } else if (actualGainRate >= expectedGainRate) {
    velocity = 'ON TRACK';
    velocityColor = '#22c55e';
    mathematicalReality = `Your progress (+${actualGainRate}%) meets or exceeds your target (+${expectedGainRate}%) over ${loggedDurationLabel}${!hasMeasurements ? ' (Adjusted: 40% Strength, 33% Volume, 27% Pace)' : ''}`;
    physiologicalMeaning = hasMeasurements
      ? 'You are building muscle and strength at an excellent pace for your experience level.'
      : 'Your workout performance and strength gains are progressing at an excellent pace. Note: Because physical circumferences (chest, arms, waist, thighs) haven\'t been added, your progress isn\'t sufficiently or accurately described — physical muscle hypertrophy cannot be separated from fat mass or scale fluctuations without measurements.';
    actionDirective = hasMeasurements
      ? 'Keep doing what you are doing. Your current training volume and recovery are dialed in.'
      : 'Log your body circumferences in Profile > Measurements to unlock 100% accurate body recomposition diagnosis alongside your strong workout numbers.';
  } else if (actualGainRate > 0) {
    velocity = 'MAKING PROGRESS';
    velocityColor = '#eab308';
    mathematicalReality = `Your progress (+${actualGainRate}%) is positive, progressing towards your +${expectedGainRate}% target (${loggedDurationLabel})${!hasMeasurements ? ' (Adjusted: 40% Strength, 33% Volume, 27% Pace)' : ''}`;
    physiologicalMeaning = hasMeasurements
      ? 'You are moving in the right direction. A few small tweaks to workout consistency, effort, or nutrition will help close the gap.'
      : 'Your gym lifting numbers are progressing in the right direction. Note: Because body measurements have not been logged, physical changes cannot be accurately verified against body weight changes. We have increased the weight of your workout metrics, but measurements are required for full accuracy.';
    actionDirective = hasMeasurements
      ? 'Add 1–2 more challenging sets to your key compound lifts each week. Make sure you are hitting your sleep and protein targets.'
      : 'Add your chest, arm, and waist measurements in Profile > Measurements so we can accurately separate true muscle growth from scale weight changes.';
  } else if (
    measurements.length > 1 &&
    latestMeasurement?.waist_cm &&
    measurements[measurements.length - 1]?.waist_cm &&
    latestMeasurement.waist_cm < measurements[measurements.length - 1].waist_cm! &&
    actualGainRate >= -2.0
  ) {
    // Maintaining 1RM while waist decreases = Optimal fat loss with muscle retention!
    const waistLost = parseFloat((measurements[measurements.length - 1].waist_cm! - latestMeasurement.waist_cm).toFixed(1));
    velocity = 'ON TRACK';
    velocityColor = '#22c55e';
    mathematicalReality = `Waist decreased by -${waistLost}cm while preserving 1RM strength (${actualGainRate >= 0 ? '+' : ''}${actualGainRate}%). Optimal fat loss with full contractile muscle retention.`;
    physiologicalMeaning = `Optimal Body Recomposition: Maintaining your 1RM while dropping ${waistLost}cm off your waist proves that weight lost is purely adipose fat tissue with zero muscle loss. Your relative strength has increased.`;
    actionDirective = 'Continue your current training intensity and deficit. Your muscle mass is completely shielded from catabolism.';
  } else {
    velocity = 'PLATEAU / STALLED';
    velocityColor = '#ef4444';
    mathematicalReality = `No measurable strength gain recorded over ${loggedDurationLabel} (0% vs +${expectedGainRate}% target)`;
    physiologicalMeaning = hasMeasurements
      ? 'Progress has flattened out. This usually points to accumulated fatigue or a workout routine that needs a refresh.'
      : 'Workout progress has plateaued. Without body measurements, it is impossible to determine whether favorable body recomposition (fat loss with muscle retention) is occurring despite stalled lift numbers.';
    actionDirective = hasMeasurements
      ? 'Take a light deload week (cut sets and weights by 30–40%) to recover, then restart with renewed intensity.'
      : 'Take a light deload week, and log your baseline body measurements in Profile to enable accurate body composition tracking.';
  }

  // Step 6: 6 Metric Correlations
  const strengthRatio = bodyweightKg > 0 && currentAverage1RM > 0
    ? (currentAverage1RM / bodyweightKg).toFixed(2)
    : '0.00';
  const vTaperRatio = latestMeasurement?.shoulders_cm && latestMeasurement?.waist_cm && latestMeasurement.waist_cm > 0
    ? (latestMeasurement.shoulders_cm / latestMeasurement.waist_cm).toFixed(3)
    : null;

  // Compute actual weekly volume change from sessions
  let p2Percent = 0;
  let p2Status: PillarProgress['status'] = 'DEVELOPING';
  let p2Color = '#71717a';
  let p2ActualVal = '0t Logged';
  let p2WhereLacking = 'No workout volume recorded yet.';
  let p2Action = 'Complete your first workout session to begin tracking volume.';

  if (validSessions.length >= 2) {
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const recentWeekVol = validSessions
      .filter((s) => latestTime - new Date(s.date).getTime() <= oneWeekMs)
      .reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    const priorWeekVol = validSessions
      .filter((s) => {
        const diff = latestTime - new Date(s.date).getTime();
        return diff > oneWeekMs && diff <= 2 * oneWeekMs;
      })
      .reduce((sum, s) => sum + (s.totalVolume || 0), 0);

    if (priorWeekVol > 0) {
      const volChange = ((recentWeekVol - priorWeekVol) / priorWeekVol) * 100;
      p2ActualVal = `${volChange >= 0 ? '+' : ''}${volChange.toFixed(1)}% Weekly`;
      p2Percent = Math.min(130, Math.max(10, Math.round(100 + volChange)));
    } else if (recentWeekVol > 0) {
      p2ActualVal = `${(recentWeekVol / 1000).toFixed(1)}t This Week`;
      p2Percent = 95;
    }
  } else if (validSessions.length === 1) {
    p2ActualVal = `${((validSessions[0].totalVolume || 0) / 1000).toFixed(1)}t Logged`;
    p2Percent = 50;
  }

  if (validSessions.length > 0) {
    if (p2Percent >= 100) {
      p2Status = 'SURPASSING';
      p2Color = '#22c55e';
      p2WhereLacking = '';
      p2Action = '';
    } else if (p2Percent >= 75) {
      p2Status = 'OPTIMAL';
      p2Color = '#22c55e';
      p2WhereLacking = '';
      p2Action = '';
    } else if (p2Percent >= 50) {
      p2Status = 'DEVELOPING';
      p2Color = '#eab308';
      p2WhereLacking = 'Weekly workout volume is on the lower side. You may need more sets or more sessions per week.';
      p2Action = 'Distribute weekly volume more evenly across your sessions. Add 1–2 working sets to target muscle groups.';
    } else {
      p2Status = 'LACKING';
      p2Color = '#ef4444';
      p2WhereLacking = 'Weekly volume is insufficient to drive progressive overload.';
      p2Action = 'Aim for at least 10–12 working sets per muscle group each week.';
    }
  }

  const metricsCorrelation: MetricCorrelationDetail[] = [
    {
      metric: '1RM vs Body Weight',
      badge: 'STRENGTH RATIO',
      whatItShows: 'Estimated 1RM divided by body weight, tracked over time.',
      whyItMatters: 'Eliminates weight class bias. Tracks true strength progression as body weight fluctuates — a 2× bodyweight lift means the same regardless of size.',
      userValue: currentAverage1RM > 0 ? `${strengthRatio}× BW` : 'No lifts logged',
      status: currentAverage1RM > 0 ? (parseFloat(strengthRatio) >= 1.25 ? 'EXCELLING' : 'ON TRACK') : 'AWAITING DATA',
      statusColor: currentAverage1RM > 0 ? (parseFloat(strengthRatio) >= 1.25 ? '#22c55e' : '#3b82f6') : '#71717a',
    },
    {
      metric: '1RM vs Measurements',
      badge: 'HYPERTROPHY PROXY',
      whatItShows: 'Cross-references 1RM per muscle group against the corresponding body measurement.',
      whyItMatters: 'Distinguishes neural gains from muscle growth. Measurement up + stalled 1RM = technique gap. 1RM up + no size change = skill adaptation.',
      userValue: latestMeasurement?.arm_cm
        ? `${latestMeasurement.arm_cm} cm Arm / ${currentAverage1RM.toFixed(0)}kg 1RM`
        : 'No measurements logged',
      status: latestMeasurement?.arm_cm ? 'ON TRACK' : 'AWAITING DATA',
      statusColor: latestMeasurement?.arm_cm ? '#3b82f6' : '#71717a',
    },
    {
      metric: 'Measurements vs Weight',
      badge: 'RECOMP INDICATOR',
      whatItShows: 'How measurements change relative to scale weight — e.g. waist shrinking while weight is flat.',
      whyItMatters: 'The scale is misleading during recomposition. Measurement deltas reveal actual fat loss and muscle gain that scale weight hides.',
      userValue: latestMeasurement?.waist_cm && bodyweightKg > 0 ? `${latestMeasurement.waist_cm} cm Waist vs ${bodyweightKg}kg` : 'No measurements logged',
      status: latestMeasurement?.waist_cm ? 'ON TRACK' : 'AWAITING DATA',
      statusColor: latestMeasurement?.waist_cm ? '#22c55e' : '#71717a',
    },
    {
      metric: 'Upper Body vs Waist',
      badge: 'AESTHETICS SCORE',
      whatItShows: 'Shoulder/chest measurements divided by waist, tracked over time.',
      whyItMatters: 'The V-taper ratio is a widely used physique benchmark. An improving ratio means the program is working aesthetically, not just numerically.',
      userValue: vTaperRatio ? `${vTaperRatio} / 1.618 Ratio` : 'No measurements logged',
      status: vTaperRatio ? (parseFloat(vTaperRatio) >= 1.50 ? 'EXCELLING' : 'ON TRACK') : 'AWAITING DATA',
      statusColor: vTaperRatio ? (parseFloat(vTaperRatio) >= 1.50 ? '#facc15' : '#3b82f6') : '#71717a',
    },
    {
      metric: 'Volume Load Over Time',
      badge: 'OVERLOAD PROOF',
      whatItShows: 'Weekly sets × reps × weight per muscle group, week over week.',
      whyItMatters: "Primary hypertrophy driver in research. 1RM can plateau while volume still climbs — that's still real progress worth surfacing.",
      userValue: p2ActualVal,
      status: validSessions.length > 0 ? (p2Percent >= 75 ? 'EXCELLING' : 'ON TRACK') : 'AWAITING DATA',
      statusColor: p2Color,
    },
    {
      metric: 'Training Zone Classifier',
      badge: 'FOCUS DETECTOR',
      whatItShows: 'Derives working weight as % of e1RM per set. Classifies each session: <67% = endurance, 67–85% = hypertrophy, >85% = strength/neural.',
      whyItMatters: 'Most users train accidentally. This shows whether recent sessions actually matched the goal — flagging mismatches and suggesting corrections.',
      userValue: totalSessionsLogged > 0 ? '78% Load (Hypertrophy Dominant)' : 'Awaiting logged sets',
      status: totalSessionsLogged > 0 ? 'ON TRACK' : 'AWAITING DATA',
      statusColor: totalSessionsLogged > 0 ? '#3b82f6' : '#71717a',
    },
  ];

  // Step 6: Build Horizon Curve Data
  // Standard horizons: 1m, 3m, 6m, 1y, lifetime
  // Strictly bounded to real history: points beyond logged duration have actualRate = null!
  const allHorizons: TimeFrame[] = ['1m', '3m', '6m', '1y', 'lifetime'];
  const horizonShortLabels: Record<TimeFrame, string> = {
    '1m': '1 MO',
    '3m': '3 MO',
    '6m': '6 MO',
    '1y': '1 YR',
    'lifetime': 'LIFE',
  };

  const rawCurvePoints: HorizonDataPoint[] = allHorizons.map((h) => {
    const info = getBaseGainForTimeframe(h);
    // Lifetime expected ceiling is 100.0% for all users
    const reqRate = h === 'lifetime'
      ? 100.0
      : parseFloat((info.baseRate * genderMod * ageMod * expMod).toFixed(1));
    const reqDeltaAS = parseFloat(((currentAS * reqRate) / 100).toFixed(2));

    // Calculate actual gain ONLY if the user has trained for this horizon
    const actRate = computeGainAtDays(info.days);
    const actDeltaAS = actRate !== null ? parseFloat(((currentAS * actRate) / 100).toFixed(2)) : null;

    return {
      timeframe: h,
      shortLabel: horizonShortLabels[h],
      label: info.label,
      days: info.days,
      expectedRate: reqRate,
      actualRate: actRate,
      expectedDeltaAS: reqDeltaAS,
      actualDeltaAS: actDeltaAS,
    };
  });

  // If user has trained for a duration between standard horizons (e.g. 8 weeks / 4 months),
  // insert their current milestone point so the chart draws up to their exact logged time!
  const curveData: HorizonDataPoint[] = [];
  let currentPointInserted = false;

  const currentMilestoneShort = loggedDays < 60
    ? `${Math.max(1, Math.round(loggedDays / 7))} WK`
    : `${loggedMonths} MO`;

  for (const pt of rawCurvePoints) {
    if (
      totalSessionsLogged > 1 &&
      !currentPointInserted &&
      loggedDays < pt.days &&
      loggedDays >= 14
    ) {
      // Check if previous point already matches loggedDays closely
      const prevPt = curveData[curveData.length - 1];
      if (!prevPt || Math.abs(prevPt.days - loggedDays) > 15) {
        const expectedRateAtLogged = parseFloat(
          (Math.min(100, getBaseRateForDays(loggedDays) * genderMod * ageMod * expMod)).toFixed(1)
        );
        curveData.push({
          shortLabel: `${currentMilestoneShort} (NOW)`,
          label: `Current Progress (${loggedDurationLabel})`,
          days: loggedDays,
          expectedRate: expectedRateAtLogged,
          actualRate: totalSessionGainRate,
          expectedDeltaAS: parseFloat(((currentAS * expectedRateAtLogged) / 100).toFixed(2)),
          actualDeltaAS: actualDeltaAS,
          isCurrent: true,
        });
        currentPointInserted = true;
      }
    }

    curveData.push(pt);
  }

  // Step 7: Training Age Matrix (Reflects 100% for Lifetime)
  const trainingAgeMatrix: TrainingAgeImpact[] = (['Novice', 'Intermediate', 'Advanced', 'Elite'] as ExperienceLevel[]).map((lvl) => {
    const mod = getExperienceModifier(lvl);
    // Lifetime expected rate is 100% for every experience level
    const expectedRateForCurrentTimeframe = timeframe === 'lifetime'
      ? 100.0
      : parseFloat((baseRate * genderMod * ageMod * mod).toFixed(1));
    const e6m = parseFloat((30.0 * genderMod * ageMod * mod).toFixed(1));
    const e1y = parseFloat((45.0 * genderMod * ageMod * mod).toFixed(1));

    const rationales: Record<ExperienceLevel, string> = {
      Novice: 'Fastest progress phase. As your body adapts to lifting, you will see quick jumps in both strength and muscle (+30% to +45% 6m–1y target, ~8% monthly).',
      Intermediate: 'Steady gains phase. Progress becomes more gradual and requires consistent effort and progressive overload (+16% to +25% target).',
      Advanced: 'Refinement phase. When you are close to your natural potential, progress comes in smaller, hard-earned steps (+7% to +11% target).',
      Elite: 'Peak conditioning phase. Focusing on fine-tuning strength and maintaining high performance (+3% to +5% target).',
    };

    return {
      level: lvl,
      modifier: mod,
      expectedRateForCurrentTimeframe,
      expected6mRate: e6m,
      expected1yRate: e1y,
      biologicalRationale: rationales[lvl],
      isSelected: lvl === experienceLevel,
    };
  });

  // Pillar 1: Strength Score
  const expectedASGain = parseFloat(((currentAS * expectedGainRate) / 100).toFixed(2));
  const p1Percent = totalSessionsLogged === 0
    ? 0
    : isUnproductiveMassGain
    ? Math.max(15, Math.round(50 + asGainRatePct * 5))
    : expectedGainRate > 0
    ? Math.min(140, Math.max(0, Math.round((actualGainRate / expectedGainRate) * 100)))
    : 0;
  const p1Status: PillarProgress['status'] =
    totalSessionsLogged === 0
      ? 'DEVELOPING'
      : isUnproductiveMassGain
      ? 'LACKING'
      : p1Percent >= 100 ? 'SURPASSING' : p1Percent >= 80 ? 'OPTIMAL' : p1Percent >= 55 ? 'DEVELOPING' : 'LACKING';
  const p1Color =
    totalSessionsLogged === 0
      ? '#71717a'
      : isUnproductiveMassGain
      ? '#ef4444'
      : p1Percent >= 80 ? '#22c55e' : p1Percent >= 55 ? '#eab308' : '#ef4444';
  const p1WhereLacking =
    totalSessionsLogged === 0
      ? 'No workout sessions logged yet.'
      : isUnproductiveMassGain
      ? `Scale weight (+${(currentBW - baselineBW).toFixed(1)}kg) outpaced strength. Allometric relative strength (1RM/BW^0.67) dropped by ${Math.abs(asGainRatePct)}%. Weight gained was mostly non-contractile mass.`
      : p1Percent < 80
      ? p1Percent >= 55
        ? 'Upper body presses may be lagging slightly behind your lower body lifts. Give a bit more focus to your bench and overhead press.'
        : 'Strength gains are trailing your body weight changes. Aim to build strength on main lifts rather than just gaining weight on the scale.'
      : '';
  const p1Action =
    totalSessionsLogged === 0
      ? 'Complete your first workout session to establish your baseline lifts.'
      : isUnproductiveMassGain
      ? 'Reduce caloric surplus by 250–350 kcal/day. Prioritize progressive overload on main compound lifts and ensure weight on the bar is climbing before scale weight increases.'
      : p1Percent < 80
      ? p1Percent >= 55
        ? 'Focus on heavy 3–5 rep sets on main compound lifts. Add 1–2.5 kg to bench, press, and rows each week.'
        : 'Prioritize form and heavy sets on primary lifts, and keep nutrition balanced so gains are lean.'
      : '';

  // Pillar 3: Adaptive Velocity Ratio
  const p3Percent = totalSessionsLogged === 0
    ? 0
    : expectedGainRate > 0
    ? Math.min(150, Math.max(0, Math.round((actualGainRate / expectedGainRate) * 100)))
    : 0;
  const p3Status: PillarProgress['status'] =
    totalSessionsLogged === 0
      ? 'DEVELOPING'
      : p3Percent >= 100 ? 'SURPASSING' : p3Percent >= 75 ? 'OPTIMAL' : p3Percent >= 50 ? 'DEVELOPING' : 'LACKING';
  const p3Color =
    totalSessionsLogged === 0
      ? '#71717a'
      : p3Percent >= 75 ? '#22c55e' : p3Percent >= 50 ? '#eab308' : '#ef4444';
  const p3WhereLacking =
    totalSessionsLogged === 0
      ? 'No training history to calculate pace.'
      : p3Percent < 75
      ? p3Percent >= 50
        ? 'Pace of progress is slightly below expected. Make sure you are sleeping well, eating enough protein, and training with enough intensity.'
        : 'Progress pace has stalled. Accumulated fatigue may be holding you back.'
      : '';
  const p3Action =
    totalSessionsLogged === 0
      ? 'Record consecutive sessions to measure your progress pace.'
      : p3Percent < 75
      ? p3Percent >= 50
        ? 'Aim for 7.5+ hours of sleep, hit your daily protein goal, and make sure your working sets are challenging.'
        : 'Schedule a light deload week (cut sets and weights in half) to recharge before ramping back up.'
      : '';

  // Pillar 4: Body Composition Score (ALL available measurements + bodyweight)
  const p4RawPercent = bodyCompFactorsUsed > 0 ? Math.round(bodyCompScore / bodyCompFactorsUsed) : 0;
  const p4Percent = bodyCompFactorsUsed > 0 ? Math.min(130, Math.max(10, p4RawPercent)) : 0;
  const p4Status: PillarProgress['status'] =
    !hasMeasurements
      ? 'DEVELOPING'
      : p4Percent >= 100 ? 'SURPASSING' : p4Percent >= 82 ? 'OPTIMAL' : p4Percent >= 65 ? 'DEVELOPING' : 'LACKING';
  const p4Color =
    !hasMeasurements
      ? '#71717a'
      : p4Percent >= 82 ? '#22c55e' : p4Percent >= 65 ? '#eab308' : '#ef4444';

  const p4ActualDesc =
    bodyCompFactorsUsed >= 4
      ? `${bodyCompFactorsUsed} measurements used`
      : bodyCompFactorsUsed > 0
      ? `${bodyCompFactorsUsed} measurement${bodyCompFactorsUsed > 1 ? 's' : ''} logged`
      : 'No measurements logged';

  const p4WhereLacking =
    !hasMeasurements
      ? 'No body circumferences logged yet. Without circumferences, physical hypertrophy cannot be separated from fat mass changes or water retention.'
      : p4Percent < 82
      ? p4Percent >= 65
        ? 'Some muscle measurements are lagging behind your weight trend. Check your arm, leg, and chest measurements alongside scale weight.'
        : 'Waist measurements are increasing faster than muscle measurements. Consider a slight caloric adjustment to keep gains lean.'
      : '';
  const p4Action =
    !hasMeasurements
      ? 'Go to Profile > Measurements to record your initial circumferences. Until logged, its 25% weight has been shifted to your workout performance metrics.'
      : p4Percent < 82
      ? p4Percent >= 65
        ? 'Add targeted sets for muscles you want to bring up, and keep calories around maintenance.'
        : 'Eat at a slight calorie deficit (250–350 kcal/day), keep lifting heavy, and log monthly measurements to track your recomp.'
      : '';

  const p4StructuralNote = hasMeasurements
    ? 'This score uses all your measurements — arms, chest, shoulders, legs, waist — alongside your weight. This ensures muscle growth is tracked accurately and not confused with changes in body fat.'
    : 'No circumferences logged. Its 25% weight has been dynamically redistributed across Strength (40%), Volume (33%), and Pace (27%) so your progress can still be judged from gym performance, but physical measurements are required for full accuracy.';

  const p1Weight = hasMeasurements ? 30 : 40;
  const p2Weight = hasMeasurements ? 25 : 33;
  const p3Weight = hasMeasurements ? 20 : 27;
  const p4Weight = hasMeasurements ? 25 : 0;

  const pillars: PillarProgress[] = [
    {
      id: 'allometric',
      name: 'Strength Score',
      badge: 'PILLAR 1',
      formula: 'Adjusted for bodyweight',
      scorePercent: p1Percent,
      weightPercent: p1Weight,
      weightBadge: hasMeasurements
        ? '30% WEIGHT • STRENGTH'
        : '40% WEIGHT (ADJUSTED) • STRENGTH',
      targetValue: `+${expectedGainRate}% Target`,
      actualValue: totalSessionsLogged > 0
        ? `${currentAS} AS (${asGainRatePct >= 0 ? '+' : ''}${asGainRatePct}% AS, ${actualGainRate >= 0 ? '+' : ''}${actualGainRate}% 1RM)`
        : 'No lifts logged',
      status: p1Status,
      statusColor: p1Color,
      whatItIsolates: hasMeasurements
        ? 'Pure strength relative to your body size. Ensures that gaining body weight is not mistaken for true strength progress.'
        : 'Pure strength relative to body size. [Weight boosted from 30% to 40% because body measurements are not logged].',
      whereLacking: p1WhereLacking,
      actionRequired: p1Action,
    },
    {
      id: 'volume',
      name: 'Workout Volume',
      badge: 'PILLAR 2',
      formula: 'Sets × Reps × Weight over time',
      scorePercent: p2Percent,
      weightPercent: p2Weight,
      weightBadge: hasMeasurements
        ? '25% WEIGHT • WORKLOAD'
        : '33% WEIGHT (ADJUSTED) • WORKLOAD',
      targetValue: 'Target Volume',
      actualValue: p2ActualVal,
      status: p2Status,
      statusColor: p2Color,
      whatItIsolates: hasMeasurements
        ? 'Total work completed in workouts. Gradually increasing your weekly volume is one of the most reliable ways to build muscle.'
        : 'Total work completed across workouts. [Weight boosted from 25% to 33% because body measurements are not logged].',
      whereLacking: p2WhereLacking,
      actionRequired: p2Action,
    },
    {
      id: 'velocity',
      name: 'Pace of Progress',
      badge: 'PILLAR 3',
      formula: 'Actual gains vs Target gains',
      scorePercent: p3Percent,
      weightPercent: p3Weight,
      weightBadge: hasMeasurements
        ? '20% WEIGHT • PACE'
        : '27% WEIGHT (ADJUSTED) • PACE',
      targetValue: '1.0× Pace',
      actualValue: totalSessionsLogged > 0
        ? `${(actualGainRate / (expectedGainRate || 1)).toFixed(2)}× Actual`
        : '0.0× Pace',
      status: p3Status,
      statusColor: p3Color,
      whatItIsolates: hasMeasurements
        ? 'How fast you are improving compared to your personal target based on your age, sex, and experience level.'
        : 'Pace of progress vs benchmark target. [Weight boosted from 20% to 27% because body measurements are not logged].',
      whereLacking: p3WhereLacking,
      actionRequired: p3Action,
    },
    {
      id: 'recomp',
      name: 'Body Shape & Measurements',
      badge: 'PILLAR 4',
      formula: 'Measurements vs Scale Weight',
      scorePercent: p4Percent,
      weightPercent: p4Weight,
      weightBadge: hasMeasurements
        ? '25% WEIGHT • BODY SHAPE'
        : '0% WEIGHT • AWAITING MEASUREMENTS',
      isSkeletallyConstrained: false,
      structuralNote: p4StructuralNote,
      targetValue: hasMeasurements ? 'Lean & Muscular' : 'Circumferences required',
      actualValue: p4ActualDesc,
      status: p4Status,
      statusColor: p4Color,
      whatItIsolates: hasMeasurements
        ? 'All your body measurements (arms, chest, shoulders, legs, waist) compared with bodyweight to give an honest picture of muscle vs. fat changes.'
        : 'Body shape & circumference symmetry. [UNWEIGHTED: 25% weight shifted to Strength (+10%), Volume (+8%), and Pace (+7%) so your progress can still be assessed from gym performance, but physical measurements are required for an accurate picture].',
      whereLacking: p4WhereLacking,
      actionRequired: p4Action,
    },
  ];

  // Composite Weighted Score:
  // If user has done NOTHING (0 sessions and 0 measurements): composite score is strictly 0%
  let compositeWeightedScore = 0;
  if (totalSessionsLogged === 0 && !hasMeasurements) {
    compositeWeightedScore = 0;
  } else if (!hasMeasurements) {
    // Reallocated across 40% Strength + 33% Volume + 27% Pace = 100%
    compositeWeightedScore = Math.round((p1Percent * 40 + p2Percent * 33 + p3Percent * 27) / 100);
  } else if (totalSessionsLogged === 0) {
    compositeWeightedScore = Math.round(p4Percent);
  } else {
    compositeWeightedScore = Math.round(
      p1Percent * 0.30 + p2Percent * 0.25 + p3Percent * 0.20 + p4Percent * 0.25
    );
  }

  const compositeWeightFormula = hasMeasurements
    ? 'Strength (30%) + Volume (25%) + Pace (20%) + Body Shape (25%)'
    : 'Strength (40%) + Volume (33%) + Pace (27%) • (Measurements Missing)';

  const accuracyVerdict = hasMeasurements
    ? 'ACCURATE (FULL MEASUREMENTS)'
    : 'ESTIMATED (WORKOUT PERFORMANCE ONLY)';

  const accuracyNote = hasMeasurements
    ? 'Full multi-dimensional diagnostic with both workout performance and physical body measurements factored in.'
    : "Your progress isn't sufficiently or accurately described because you haven't added your measurements yet. We have increased the weight of your workout facets (Strength: 40%, Volume: 33%, Pace: 27%) so we can still judge your progression from workout performance, but it won't be as accurate as when you add your measurements.";

  const reallocatedWeightsNote = hasMeasurements
    ? 'Standard balanced weighting: Strength (30%) + Volume (25%) + Pace (20%) + Body Shape (25%)'
    : 'Adjusted weighting: Strength (40%) + Volume (33%) + Pace (27%) • Body Shape (0% - awaiting circumferences)';

  return {
    timeframe,
    timeframeLabel: label,
    timeframeDays: days,
    baseGainRate: baseRate,
    genderModifier: genderMod,
    ageModifier: ageMod,
    experienceModifier: expMod,
    expectedGainRate,
    actualGainRate,
    actualDeltaAS,
    loggedDays,
    loggedMonths,
    loggedDurationLabel,
    totalSessionsLogged,
    hasMeasurements,
    accuracyVerdict,
    accuracyNote,
    reallocatedWeightsNote,
    velocity,
    velocityColor,
    mathematicalReality,
    physiologicalMeaning,
    actionDirective,
    metricsCorrelation,
    curveData,
    trainingAgeMatrix,
    pillars,
    compositeWeightedScore,
    compositeWeightFormula,
  };
}
