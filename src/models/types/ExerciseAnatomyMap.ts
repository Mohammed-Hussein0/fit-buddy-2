import type { MuscleGroup, MuscleMapView } from '@musclemap/core';
import { EXERCISES, ExerciseId } from './Exercise';

export interface ExerciseAnatomyTarget {
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  view: MuscleMapView;
  label: string;
}

/**
 * Strict, kinesiology-accurate anatomical mapping for every exercise in Fit Buddy.
 * Ensures primary movers light up in crimson red, synergists/stabilizers in lighter red,
 * and always renders from the perspective where the target muscle is actually visible.
 */
export const EXERCISE_ANATOMY: Record<string, ExerciseAnatomyTarget> = {
  // ─── CHEST (Front View) ───────────────────────────────────────────────────
  [EXERCISES.BARBELL_BENCH_PRESS]: {
    primary: ['CHEST'],
    secondary: ['SHOULDERS_FRONT', 'TRICEPS'],
    view: 'FRONT',
    label: 'Chest · Shoulders & Triceps',
  },
  [EXERCISES.INCLINE_BARBELL_BENCH_PRESS]: {
    primary: ['CHEST', 'SHOULDERS_FRONT'],
    secondary: ['TRICEPS'],
    view: 'FRONT',
    label: 'Upper Chest & Front Shoulders · Triceps',
  },
  [EXERCISES.DUMBBELL_BENCH_PRESS]: {
    primary: ['CHEST'],
    secondary: ['SHOULDERS_FRONT', 'TRICEPS'],
    view: 'FRONT',
    label: 'Chest · Front Shoulders & Triceps',
  },
  [EXERCISES.INCLINE_DUMBBELL_BENCH_PRESS]: {
    primary: ['CHEST', 'SHOULDERS_FRONT'],
    secondary: ['TRICEPS'],
    view: 'FRONT',
    label: 'Upper Chest & Front Shoulders · Triceps',
  },
  [EXERCISES.CHEST_FLY_MACHINE]: {
    primary: ['CHEST'],
    secondary: ['SHOULDERS_FRONT'],
    view: 'FRONT',
    label: 'Chest (Isolation)',
  },
  [EXERCISES.CABLE_CROSSOVER]: {
    primary: ['CHEST'],
    secondary: ['SHOULDERS_FRONT'],
    view: 'FRONT',
    label: 'Chest (Middle & Lower)',
  },
  [EXERCISES.DIPS]: {
    primary: ['CHEST', 'TRICEPS'],
    secondary: ['SHOULDERS_FRONT'],
    view: 'FRONT',
    label: 'Lower Chest & Triceps',
  },

  // ─── SHOULDERS ───────────────────────────────────────────────────────────
  [EXERCISES.OVERHEAD_PRESS]: {
    primary: ['SHOULDERS_FRONT', 'SHOULDERS_SIDE'],
    secondary: ['TRICEPS', 'TRAPEZIUS'],
    view: 'FRONT',
    label: 'Front & Side Shoulders · Triceps & Traps',
  },
  [EXERCISES.DUMBBELL_SHOULDER_PRESS]: {
    primary: ['SHOULDERS_FRONT', 'SHOULDERS_SIDE'],
    secondary: ['TRICEPS'],
    view: 'FRONT',
    label: 'Front & Side Shoulders · Triceps',
  },
  [EXERCISES.DUMBBELL_LATERAL_RAISE]: {
    primary: ['SHOULDERS_SIDE'],
    secondary: ['TRAPEZIUS'],
    view: 'FRONT',
    label: 'Side Shoulders',
  },
  [EXERCISES.CABLE_LATERAL_RAISE]: {
    primary: ['SHOULDERS_SIDE'],
    secondary: ['TRAPEZIUS'],
    view: 'FRONT',
    label: 'Side Shoulders',
  },
  [EXERCISES.REAR_DELT_FLY]: {
    primary: ['SHOULDERS_REAR', 'RHOMBOIDS'],
    secondary: ['TRAPEZIUS'],
    view: 'BACK',
    label: 'Rear Shoulders & Upper Back',
  },
  [EXERCISES.BARBELL_SHRUGS]: {
    primary: ['TRAPEZIUS'],
    secondary: ['FOREARMS'],
    view: 'BACK',
    label: 'Traps & Forearms',
  },

  // ─── BACK & POSTERIOR CHAIN ──────────────────────────────────────────────
  [EXERCISES.DEADLIFT]: {
    primary: ['BACK_LOWER', 'HAMSTRINGS', 'GLUTES'],
    secondary: ['LATS', 'TRAPEZIUS', 'FOREARMS'],
    view: 'BACK',
    label: 'Lower Back, Glutes & Hamstrings · Lats & Traps',
  },
  [EXERCISES.PULLUPS]: {
    primary: ['LATS'],
    secondary: ['BICEPS', 'RHOMBOIDS', 'TRAPEZIUS'],
    view: 'BACK',
    label: 'Lats (Back Width) · Biceps & Upper Back',
  },
  [EXERCISES.LAT_PULLDOWN]: {
    primary: ['LATS'],
    secondary: ['BICEPS', 'RHOMBOIDS', 'TRAPEZIUS'],
    view: 'BACK',
    label: 'Lats (Back Width) · Biceps & Upper Back',
  },
  [EXERCISES.BARBELL_ROW]: {
    primary: ['LATS', 'RHOMBOIDS'],
    secondary: ['BACK_LOWER', 'BICEPS', 'SHOULDERS_REAR', 'TRAPEZIUS'],
    view: 'BACK',
    label: 'Lats & Upper Back · Lower Back & Biceps',
  },
  [EXERCISES.SEATED_CABLE_ROW]: {
    primary: ['RHOMBOIDS', 'TRAPEZIUS'],
    secondary: ['LATS', 'BICEPS', 'SHOULDERS_REAR'],
    view: 'BACK',
    label: 'Mid-Back & Traps · Lats & Biceps',
  },
  [EXERCISES.T_BAR_ROW]: {
    primary: ['LATS', 'RHOMBOIDS'],
    secondary: ['TRAPEZIUS', 'BICEPS', 'BACK_LOWER'],
    view: 'BACK',
    label: 'Lats & Mid-Back · Biceps',
  },
  [EXERCISES.DUMBBELL_ROW]: {
    primary: ['LATS'],
    secondary: ['RHOMBOIDS', 'BICEPS', 'SHOULDERS_REAR'],
    view: 'BACK',
    label: 'Lats · Biceps & Upper Back',
  },
  [EXERCISES.HYPEREXTENSIONS]: {
    primary: ['BACK_LOWER'],
    secondary: ['GLUTES', 'HAMSTRINGS'],
    view: 'BACK',
    label: 'Lower Back & Glutes',
  },

  // ─── BICEPS ──────────────────────────────────────────────────────────────
  [EXERCISES.BARBELL_CURL]: {
    primary: ['BICEPS'],
    secondary: ['FOREARMS'],
    view: 'FRONT',
    label: 'Biceps · Forearms',
  },
  [EXERCISES.DUMBBELL_BICEP_CURL]: {
    primary: ['BICEPS'],
    secondary: ['FOREARMS'],
    view: 'FRONT',
    label: 'Biceps · Forearms',
  },
  [EXERCISES.INCLINE_DUMBBELL_CURL]: {
    primary: ['BICEPS'],
    secondary: ['FOREARMS'],
    view: 'FRONT',
    label: 'Biceps (Full Stretch)',
  },
  [EXERCISES.HAMMER_CURL]: {
    primary: ['BICEPS', 'FOREARMS'],
    secondary: [],
    view: 'FRONT',
    label: 'Outer Biceps & Forearms',
  },
  [EXERCISES.PREACHER_CURL]: {
    primary: ['BICEPS'],
    secondary: ['FOREARMS'],
    view: 'FRONT',
    label: 'Biceps (Peak Isolation)',
  },
  [EXERCISES.CABLE_BICEP_CURL]: {
    primary: ['BICEPS'],
    secondary: ['FOREARMS'],
    view: 'FRONT',
    label: 'Biceps (Constant Tension)',
  },

  // ─── TRICEPS ────────────────────────────────────────────────────────────
  [EXERCISES.TRICEP_PUSH_DOWN]: {
    primary: ['TRICEPS'],
    secondary: [],
    view: 'BACK',
    label: 'Triceps',
  },
  [EXERCISES.SKULL_CRUSHERS]: {
    primary: ['TRICEPS'],
    secondary: [],
    view: 'BACK',
    label: 'Triceps',
  },
  [EXERCISES.OVERHEAD_TRICEP_EXTENSION]: {
    primary: ['TRICEPS'],
    secondary: [],
    view: 'BACK',
    label: 'Triceps (Full Stretch)',
  },
  [EXERCISES.CLOSE_GRIP_BENCH_PRESS]: {
    primary: ['TRICEPS', 'CHEST'],
    secondary: ['SHOULDERS_FRONT'],
    view: 'FRONT',
    label: 'Triceps & Inner Chest',
  },

  // ─── LEGS: QUADS & SQUATS ────────────────────────────────────────────────
  [EXERCISES.BARBELL_SQUAT]: {
    primary: ['QUADS', 'GLUTES'],
    secondary: ['HAMSTRINGS', 'CALVES', 'CORE'],
    view: 'FRONT',
    label: 'Quads & Glutes · Hamstrings & Core',
  },
  [EXERCISES.LEG_PRESS]: {
    primary: ['QUADS', 'GLUTES'],
    secondary: ['CALVES'],
    view: 'FRONT',
    label: 'Quads & Glutes',
  },
  [EXERCISES.HACK_SQUAT]: {
    primary: ['QUADS'],
    secondary: ['GLUTES', 'CALVES'],
    view: 'FRONT',
    label: 'Quads & Glutes',
  },
  [EXERCISES.LEG_EXTENSION]: {
    primary: ['QUADS'],
    secondary: [],
    view: 'FRONT',
    label: 'Quads (Front Thighs)',
  },
  [EXERCISES.BULGARIAN_SPLIT_SQUAT]: {
    primary: ['QUADS', 'GLUTES'],
    secondary: ['HAMSTRINGS', 'CALVES'],
    view: 'FRONT',
    label: 'Quads & Glutes',
  },

  // ─── LEGS: HAMSTRINGS & POSTERIOR ────────────────────────────────────────
  [EXERCISES.ROMANIAN_DEADLIFT]: {
    primary: ['HAMSTRINGS', 'GLUTES'],
    secondary: ['BACK_LOWER'],
    view: 'BACK',
    label: 'Hamstrings & Glutes · Lower Back',
  },
  [EXERCISES.LEG_CURL]: {
    primary: ['HAMSTRINGS'],
    secondary: ['CALVES'],
    view: 'BACK',
    label: 'Hamstrings (Back of Thighs)',
  },

  // ─── CALVES ──────────────────────────────────────────────────────────────
  [EXERCISES.STANDING_CALF_RAISE]: {
    primary: ['CALVES'],
    secondary: [],
    view: 'BACK',
    label: 'Calves',
  },
  [EXERCISES.SEATED_CALF_RAISE]: {
    primary: ['CALVES'],
    secondary: [],
    view: 'BACK',
    label: 'Calves',
  },

  // ─── ABS & CORE ──────────────────────────────────────────────────────────
  [EXERCISES.PLANK]: {
    primary: ['CORE'],
    secondary: ['OBLIQUES', 'SHOULDERS_FRONT'],
    view: 'FRONT',
    label: 'Abs & Core',
  },
  [EXERCISES.CRUNCHES]: {
    primary: ['CORE'],
    secondary: ['OBLIQUES'],
    view: 'FRONT',
    label: 'Abs',
  },
  [EXERCISES.CABLE_CRUNCH]: {
    primary: ['CORE'],
    secondary: ['OBLIQUES'],
    view: 'FRONT',
    label: 'Abs',
  },
  [EXERCISES.HANGING_LEG_RAISE]: {
    primary: ['CORE'],
    secondary: ['FOREARMS'],
    view: 'FRONT',
    label: 'Lower Abs',
  },
};


/**
 * Fallback anatomy target by generic muscle group name
 */
export const GENERIC_MUSCLE_ANATOMY: Record<string, ExerciseAnatomyTarget> = {
  chest: {
    primary: ['CHEST'],
    secondary: ['SHOULDERS_FRONT', 'TRICEPS'],
    view: 'FRONT',
    label: 'Chest',
  },
  shoulders: {
    primary: ['SHOULDERS_FRONT', 'SHOULDERS_SIDE'],
    secondary: ['TRAPEZIUS'],
    view: 'FRONT',
    label: 'Deltoids (Shoulders)',
  },
  delts: {
    primary: ['SHOULDERS_FRONT', 'SHOULDERS_SIDE'],
    secondary: ['TRAPEZIUS'],
    view: 'FRONT',
    label: 'Deltoids',
  },
  back: {
    primary: ['LATS', 'RHOMBOIDS'],
    secondary: ['BACK_LOWER', 'TRAPEZIUS'],
    view: 'BACK',
    label: 'Back (Lats & Rhomboids)',
  },
  lats: {
    primary: ['LATS'],
    secondary: ['RHOMBOIDS', 'BICEPS'],
    view: 'BACK',
    label: 'Latissimus Dorsi',
  },
  traps: {
    primary: ['TRAPEZIUS'],
    secondary: [],
    view: 'BACK',
    label: 'Trapezius',
  },
  biceps: {
    primary: ['BICEPS'],
    secondary: ['FOREARMS'],
    view: 'FRONT',
    label: 'Biceps',
  },
  arms: {
    primary: ['BICEPS'],
    secondary: ['TRICEPS', 'FOREARMS'],
    view: 'FRONT',
    label: 'Arms',
  },
  triceps: {
    primary: ['TRICEPS'],
    secondary: [],
    view: 'BACK',
    label: 'Triceps',
  },
  legs: {
    primary: ['QUADS'],
    secondary: ['GLUTES', 'HAMSTRINGS', 'CALVES'],
    view: 'FRONT',
    label: 'Legs',
  },
  quads: {
    primary: ['QUADS'],
    secondary: ['GLUTES'],
    view: 'FRONT',
    label: 'Quadriceps',
  },
  hamstrings: {
    primary: ['HAMSTRINGS'],
    secondary: ['GLUTES'],
    view: 'BACK',
    label: 'Hamstrings',
  },
  glutes: {
    primary: ['GLUTES'],
    secondary: ['HAMSTRINGS', 'BACK_LOWER'],
    view: 'BACK',
    label: 'Glutes',
  },
  calves: {
    primary: ['CALVES'],
    secondary: [],
    view: 'BACK',
    label: 'Calves',
  },
  abs: {
    primary: ['CORE'],
    secondary: ['OBLIQUES'],
    view: 'FRONT',
    label: 'Abs & Core',
  },
  core: {
    primary: ['CORE'],
    secondary: ['OBLIQUES'],
    view: 'FRONT',
    label: 'Core',
  },
};

/**
 * Resolves an exercise identifier or muscle string into a strict anatomical target.
 */
export function resolveExerciseAnatomy(identifier?: string | null): ExerciseAnatomyTarget {
  if (!identifier) {
    return GENERIC_MUSCLE_ANATOMY.chest;
  }

  // 1. Direct match in EXERCISE_ANATOMY by ID
  if (EXERCISE_ANATOMY[identifier]) {
    return EXERCISE_ANATOMY[identifier];
  }

  const raw = identifier.toLowerCase().trim();

  // 2. Search by key in EXERCISE_ANATOMY (e.g. 'overhead_press' in 'barbell overhead press')
  for (const [key, target] of Object.entries(EXERCISE_ANATOMY)) {
    if (raw === key || raw.includes(key) || key.includes(raw)) {
      return target;
    }
  }

  // 3. Search in GENERIC_MUSCLE_ANATOMY
  for (const [key, target] of Object.entries(GENERIC_MUSCLE_ANATOMY)) {
    if (raw.includes(key)) {
      return target;
    }
  }

  // Fallback default
  return {
    primary: ['CHEST'],
    secondary: [],
    view: 'FRONT',
    label: identifier,
  };
}
