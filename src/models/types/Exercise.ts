export * from './Muscles';
import { EXERCISE_MEDIA_MAP } from './ExerciseMediaData';

// 1. Strict Exercise Keys
export const EXERCISES = {

  // --- CHEST ---
  BARBELL_BENCH_PRESS: 'barbell_bench_press',
  INCLINE_BARBELL_BENCH_PRESS: 'incline_barbell_bench_press',
  DUMBBELL_BENCH_PRESS: 'dumbbell_bench_press',
  INCLINE_DUMBBELL_BENCH_PRESS: 'incline_dumbbell_bench_press',
  CHEST_FLY_MACHINE: 'chest_fly_machine',
  CABLE_CROSSOVER: 'cable_crossover',
  DIPS: 'dips',

  // --- BACK ---
  DEADLIFT: 'deadlift',
  PULLUPS: 'pullups',
  BARBELL_ROW: 'barbell_row',
  SEATED_CABLE_ROW: 'seated_cable_row',
  LAT_PULLDOWN: 'lat_pulldown',
  T_BAR_ROW: 't_bar_row',
  DUMBBELL_ROW: 'dumbbell_row',
  HYPEREXTENSIONS: 'hyperextensions',

  // --- SHOULDERS ---
  OVERHEAD_PRESS: 'overhead_press',
  DUMBBELL_SHOULDER_PRESS: 'dumbbell_shoulder_press',
  DUMBBELL_LATERAL_RAISE: 'dumbbell_lateral_raise',
  CABLE_LATERAL_RAISE: 'cable_lateral_raise',
  REAR_DELT_FLY: 'rear_delt_fly',
  BARBELL_SHRUGS: 'barbell_shrugs',

  // --- BICEPS ---
  BARBELL_CURL: 'barbell_curl',
  DUMBBELL_BICEP_CURL: 'dumbbell_bicep_curl',
  INCLINE_DUMBBELL_CURL: 'incline_dumbbell_curl',
  HAMMER_CURL: 'hammer_curl',
  PREACHER_CURL: 'preacher_curl',
  CABLE_BICEP_CURL: 'cable_bicep_curl',

  // --- TRICEPS ---
  TRICEP_PUSH_DOWN: 'tricep_push_down',
  SKULL_CRUSHERS: 'skull_crushers',
  OVERHEAD_TRICEP_EXTENSION: 'overhead_tricep_extension',
  CLOSE_GRIP_BENCH_PRESS: 'close_grip_bench_press',

  // --- LEGS ---
  BARBELL_SQUAT: 'barbell_squat',
  LEG_PRESS: 'leg_press',
  HACK_SQUAT: 'hack_squat',
  LEG_EXTENSION: 'leg_extension',
  LEG_CURL: 'leg_curl',
  ROMANIAN_DEADLIFT: 'romanian_deadlift',
  BULGARIAN_SPLIT_SQUAT: 'bulgarian_split_squat',

  // --- ABS / CORE ---
  PLANK: 'plank',
  CRUNCHES: 'crunches',
  CABLE_CRUNCH: 'cable_crunch',
  HANGING_LEG_RAISE: 'hanging_leg_raise',

  // --- CALVES ---
  STANDING_CALF_RAISE: 'standing_calf_raise',
  SEATED_CALF_RAISE: 'seated_calf_raise',
} as const;

export type ExerciseId = typeof EXERCISES[keyof typeof EXERCISES];

/**
 * Multi-joint compound movements according to bodybuilding & kinesiology standards:
 * Exercises requiring coordinated action across 2 or more anatomical joints simultaneously,
 * recruiting primary movers alongside synergists and stabilizers.
 */
export const COMPOUND_EXERCISES = new Set<ExerciseId>([
  // Horizontal & Incline Push (Shoulder + Elbow)
  EXERCISES.BARBELL_BENCH_PRESS,
  EXERCISES.INCLINE_BARBELL_BENCH_PRESS,
  EXERCISES.DUMBBELL_BENCH_PRESS,
  EXERCISES.INCLINE_DUMBBELL_BENCH_PRESS,
  EXERCISES.CLOSE_GRIP_BENCH_PRESS,
  EXERCISES.DIPS,

  // Vertical Push (Shoulder + Elbow)
  EXERCISES.OVERHEAD_PRESS,
  EXERCISES.DUMBBELL_SHOULDER_PRESS,

  // Lower Body Knee & Hip Dominant (Hip + Knee + Ankle)
  EXERCISES.BARBELL_SQUAT,
  EXERCISES.HACK_SQUAT,
  EXERCISES.LEG_PRESS,
  EXERCISES.BULGARIAN_SPLIT_SQUAT,

  // Hip Hinge Posterior Chain (Hip + Knee + Spinal Stabilizers)
  EXERCISES.DEADLIFT,
  EXERCISES.ROMANIAN_DEADLIFT,

  // Horizontal & Vertical Pull (Shoulder + Elbow)
  EXERCISES.BARBELL_ROW,
  EXERCISES.T_BAR_ROW,
  EXERCISES.DUMBBELL_ROW,
  EXERCISES.SEATED_CABLE_ROW,
  EXERCISES.LAT_PULLDOWN,
  EXERCISES.PULLUPS,
]);

/**
 * The 5 canonical compound movement patterns (Bench, OHP, Squat, Deadlift, Pull)
 */
export const MOVEMENT_PATTERNS = {
  bench: [
    EXERCISES.BARBELL_BENCH_PRESS,
    EXERCISES.INCLINE_BARBELL_BENCH_PRESS,
    EXERCISES.DUMBBELL_BENCH_PRESS,
    EXERCISES.INCLINE_DUMBBELL_BENCH_PRESS,
    EXERCISES.CLOSE_GRIP_BENCH_PRESS,
    EXERCISES.DIPS,
  ] as ExerciseId[],

  ohp: [
    EXERCISES.OVERHEAD_PRESS,
    EXERCISES.DUMBBELL_SHOULDER_PRESS,
  ] as ExerciseId[],

  squat: [
    EXERCISES.BARBELL_SQUAT,
    EXERCISES.HACK_SQUAT,
    EXERCISES.LEG_PRESS,
    EXERCISES.BULGARIAN_SPLIT_SQUAT,
  ] as ExerciseId[],

  deadlift: [
    EXERCISES.DEADLIFT,
    EXERCISES.ROMANIAN_DEADLIFT,
  ] as ExerciseId[],

  pull: [
    EXERCISES.BARBELL_ROW,
    EXERCISES.T_BAR_ROW,
    EXERCISES.SEATED_CABLE_ROW,
    EXERCISES.DUMBBELL_ROW,
    EXERCISES.PULLUPS,
    EXERCISES.LAT_PULLDOWN,
  ] as ExerciseId[],
} as const;

// Clean UI Screen Labels — Single Standardized Name for Every Movement
export const EXERCISE_LABELS: Record<ExerciseId, string> = {
  [EXERCISES.BARBELL_BENCH_PRESS]: 'Barbell Bench Press',
  [EXERCISES.INCLINE_BARBELL_BENCH_PRESS]: 'Incline Barbell Bench Press',
  [EXERCISES.DUMBBELL_BENCH_PRESS]: 'Dumbbell Bench Press',
  [EXERCISES.INCLINE_DUMBBELL_BENCH_PRESS]: 'Incline Dumbbell Bench Press',
  [EXERCISES.CHEST_FLY_MACHINE]: 'Machine Chest Fly',
  [EXERCISES.CABLE_CROSSOVER]: 'Cable Crossover',
  [EXERCISES.DIPS]: 'Dips',
  [EXERCISES.DEADLIFT]: 'Deadlift',
  [EXERCISES.PULLUPS]: 'Pull-Up',
  [EXERCISES.BARBELL_ROW]: 'Barbell Row',
  [EXERCISES.SEATED_CABLE_ROW]: 'Seated Cable Row',
  [EXERCISES.LAT_PULLDOWN]: 'Lat Pulldown',
  [EXERCISES.T_BAR_ROW]: 'T-Bar Row',
  [EXERCISES.DUMBBELL_ROW]: 'Dumbbell Row',
  [EXERCISES.HYPEREXTENSIONS]: 'Hyperextension',
  [EXERCISES.OVERHEAD_PRESS]: 'Overhead Press',
  [EXERCISES.DUMBBELL_SHOULDER_PRESS]: 'Dumbbell Shoulder Press',
  [EXERCISES.DUMBBELL_LATERAL_RAISE]: 'Dumbbell Lateral Raise',
  [EXERCISES.CABLE_LATERAL_RAISE]: 'Cable Lateral Raise',
  [EXERCISES.REAR_DELT_FLY]: 'Rear Delt Fly',
  [EXERCISES.BARBELL_SHRUGS]: 'Barbell Shrug',
  [EXERCISES.BARBELL_CURL]: 'Barbell Curl',
  [EXERCISES.DUMBBELL_BICEP_CURL]: 'Dumbbell Curl',
  [EXERCISES.INCLINE_DUMBBELL_CURL]: 'Incline Dumbbell Curl',
  [EXERCISES.HAMMER_CURL]: 'Hammer Curl',
  [EXERCISES.PREACHER_CURL]: 'Preacher Curl',
  [EXERCISES.CABLE_BICEP_CURL]: 'Cable Curl',
  [EXERCISES.TRICEP_PUSH_DOWN]: 'Tricep Pushdown',
  [EXERCISES.SKULL_CRUSHERS]: 'Skull Crusher',
  [EXERCISES.OVERHEAD_TRICEP_EXTENSION]: 'Overhead Tricep Extension',
  [EXERCISES.CLOSE_GRIP_BENCH_PRESS]: 'Close-Grip Bench Press',
  [EXERCISES.BARBELL_SQUAT]: 'Barbell Squat',
  [EXERCISES.LEG_PRESS]: 'Leg Press',
  [EXERCISES.HACK_SQUAT]: 'Hack Squat',
  [EXERCISES.LEG_EXTENSION]: 'Leg Extension',
  [EXERCISES.LEG_CURL]: 'Leg Curl',
  [EXERCISES.ROMANIAN_DEADLIFT]: 'Romanian Deadlift',
  [EXERCISES.BULGARIAN_SPLIT_SQUAT]: 'Bulgarian Split Squat',
  [EXERCISES.PLANK]: 'Plank',
  [EXERCISES.CRUNCHES]: 'Crunch',
  [EXERCISES.CABLE_CRUNCH]: 'Cable Crunch',
  [EXERCISES.HANGING_LEG_RAISE]: 'Hanging Leg Raise',
  [EXERCISES.STANDING_CALF_RAISE]: 'Standing Calf Raise',
  [EXERCISES.SEATED_CALF_RAISE]: 'Seated Calf Raise',
};

function slugifyKey(s: string): string {
  return s.trim().toLowerCase().replace(/[\s\-_/()]+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/^_+|_+$/g, '');
}

const EXERCISE_KEY_MAP: Record<string, ExerciseId> = {};
for (const val of Object.values(EXERCISES)) {
  EXERCISE_KEY_MAP[val] = val;
  EXERCISE_KEY_MAP[slugifyKey(val)] = val;
}
for (const [id, label] of Object.entries(EXERCISE_LABELS)) {
  EXERCISE_KEY_MAP[slugifyKey(label)] = id as ExerciseId;
}
const EXTRA_SYNONYMS: Record<string, ExerciseId> = {
  bench_press: EXERCISES.BARBELL_BENCH_PRESS,
  flat_bench: EXERCISES.BARBELL_BENCH_PRESS,
  flat_bench_press: EXERCISES.BARBELL_BENCH_PRESS,
  flat_barbell_bench_press: EXERCISES.BARBELL_BENCH_PRESS,
  bench: EXERCISES.BARBELL_BENCH_PRESS,
  barbell_bench: EXERCISES.BARBELL_BENCH_PRESS,
  incline_bench: EXERCISES.INCLINE_BARBELL_BENCH_PRESS,
  db_bench: EXERCISES.DUMBBELL_BENCH_PRESS,
  db_bench_press: EXERCISES.DUMBBELL_BENCH_PRESS,
  incline_db_bench: EXERCISES.INCLINE_DUMBBELL_BENCH_PRESS,
  ohp: EXERCISES.OVERHEAD_PRESS,
  military_press: EXERCISES.OVERHEAD_PRESS,
  db_shoulder_press: EXERCISES.DUMBBELL_SHOULDER_PRESS,
  lateral_raise: EXERCISES.DUMBBELL_LATERAL_RAISE,
  db_lateral_raise: EXERCISES.DUMBBELL_LATERAL_RAISE,
  pullup: EXERCISES.PULLUPS,
  pull_ups: EXERCISES.PULLUPS,
  chin_up: EXERCISES.PULLUPS,
  chin_ups: EXERCISES.PULLUPS,
  squat: EXERCISES.BARBELL_SQUAT,
  back_squat: EXERCISES.BARBELL_SQUAT,
  rdl: EXERCISES.ROMANIAN_DEADLIFT,
  bicep_curl: EXERCISES.BARBELL_CURL,
  db_curl: EXERCISES.DUMBBELL_BICEP_CURL,
  tricep_pushdown: EXERCISES.TRICEP_PUSH_DOWN,
  skull_crusher: EXERCISES.SKULL_CRUSHERS,
  calf_raise: EXERCISES.STANDING_CALF_RAISE,
  chest_supported_t_bar_row: EXERCISES.T_BAR_ROW,
  chest_supported_tbar_row: EXERCISES.T_BAR_ROW,
  chest_supported_row: EXERCISES.T_BAR_ROW,
  tbar_row: EXERCISES.T_BAR_ROW,
  incline_dumbbell_press: EXERCISES.INCLINE_DUMBBELL_BENCH_PRESS,
  incline_db_press: EXERCISES.INCLINE_DUMBBELL_BENCH_PRESS,
};
for (const [alias, target] of Object.entries(EXTRA_SYNONYMS)) {
  EXERCISE_KEY_MAP[slugifyKey(alias)] = target;
}

export function normalizeExerciseKey(nameOrKey: string): ExerciseId {
  if (!nameOrKey) return EXERCISES.BARBELL_BENCH_PRESS;
  const slug = slugifyKey(nameOrKey);
  return EXERCISE_KEY_MAP[slug] || (Object.values(EXERCISES).includes(nameOrKey as any) ? (nameOrKey as ExerciseId) : EXERCISES.BARBELL_BENCH_PRESS);
}


export const EXERCISE_IMAGES: Record<ExerciseId, string> = Object.values(EXERCISES).reduce(
  (acc, id) => {
    acc[id as ExerciseId] =
      EXERCISE_MEDIA_MAP[id]?.images[0] ||
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80';
    return acc;
  },
  {} as Record<ExerciseId, string>
);

export const MUSCLE_GROUPS = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Calves',
] as const;

export const MOVEMENT_PATTERN_CATEGORIES = [
  'All Patterns',
  'Horizontal Push',
  'Incline Push',
  'Vertical Push',
  'Horizontal Pull',
  'Vertical Pull',
  'Squat / Knee Dominant',
  'Hinge / Posterior Chain',
  'Arm Isolation',
  'Core Stability',
  'Calf Raise',
] as const;

export interface LibraryExercise {
  idKey: ExerciseId;
  muscleGroup: string;
  movementPattern: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  mechanics: 'Compound' | 'Isolation';
  equipment: 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight';
  forceType: 'Push' | 'Pull' | 'Static';
  description?: string;
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // --- CHEST ---
  {
    idKey: EXERCISES.BARBELL_BENCH_PRESS,
    muscleGroup: 'Chest',
    movementPattern: 'Horizontal Push',
    primaryMuscle: 'Pectoralis Major (Sternal & Clavicular)',
    secondaryMuscles: ['Triceps Brachii', 'Anterior Deltoids', 'Serratus Anterior'],
    mechanics: 'Compound',
    equipment: 'Barbell',
    forceType: 'Push',
    description: 'Foundational bilateral horizontal press. Retract scapulae, maintain arch and leg drive.',
  },
  {
    idKey: EXERCISES.INCLINE_BARBELL_BENCH_PRESS,
    muscleGroup: 'Chest',
    movementPattern: 'Incline Push',
    primaryMuscle: 'Pectoralis Major (Clavicular Head)',
    secondaryMuscles: ['Anterior Deltoids', 'Triceps Brachii', 'Serratus Anterior'],
    mechanics: 'Compound',
    equipment: 'Barbell',
    forceType: 'Push',
    description: '30-45 degree angle press emphasizing upper clavicular fibers and front delts.',
  },
  {
    idKey: EXERCISES.DUMBBELL_BENCH_PRESS,
    muscleGroup: 'Chest',
    movementPattern: 'Horizontal Push',
    primaryMuscle: 'Pectoralis Major (Mid & Lower)',
    secondaryMuscles: ['Anterior Deltoids', 'Triceps Brachii', 'Rotator Cuff (Stabilizers)'],
    mechanics: 'Compound',
    equipment: 'Dumbbell',
    forceType: 'Push',
    description: 'Allows deep convergent stretch at the bottom and greater range of motion than barbell.',
  },
  {
    idKey: EXERCISES.INCLINE_DUMBBELL_BENCH_PRESS,
    muscleGroup: 'Chest',
    movementPattern: 'Incline Push',
    primaryMuscle: 'Pectoralis Major (Clavicular Head)',
    secondaryMuscles: ['Anterior Deltoids', 'Triceps Brachii'],
    mechanics: 'Compound',
    equipment: 'Dumbbell',
    forceType: 'Push',
    description: 'Unilateral stability challenge targeting clavicular pec fibers with neutral/convergent arc.',
  },
  {
    idKey: EXERCISES.CHEST_FLY_MACHINE,
    muscleGroup: 'Chest',
    movementPattern: 'Horizontal Push',
    primaryMuscle: 'Pectoralis Major (Sternal Squeeze)',
    secondaryMuscles: ['Anterior Deltoid', 'Coracobrachialis'],
    mechanics: 'Isolation',
    equipment: 'Machine',
    forceType: 'Push',
    description: 'Continuous horizontal adduction tension without triceps fatigue bottleneck.',
  },
  {
    idKey: EXERCISES.CABLE_CROSSOVER,
    muscleGroup: 'Chest',
    movementPattern: 'Horizontal Push',
    primaryMuscle: 'Pectoralis Major (Lower/Inner Sternal)',
    secondaryMuscles: ['Anterior Deltoid', 'Biceps Short Head (Stabilizer)'],
    mechanics: 'Isolation',
    equipment: 'Cable',
    forceType: 'Push',
    description: 'High-to-low or mid-cable fly delivering peak contraction at full shoulder adduction.',
  },
  {
    idKey: EXERCISES.DIPS,
    muscleGroup: 'Chest',
    movementPattern: 'Horizontal Push',
    primaryMuscle: 'Pectoralis Major (Costal/Lower) & Triceps',
    secondaryMuscles: ['Anterior Deltoids', 'Rhomboids', 'Latissimus Dorsi (Stabilizer)'],
    mechanics: 'Compound',
    equipment: 'Bodyweight',
    forceType: 'Push',
    description: 'Bodyweight compound press. Lean forward for chest bias or stay upright for triceps.',
  },

  // --- BACK ---
  {
    idKey: EXERCISES.DEADLIFT,
    muscleGroup: 'Back',
    movementPattern: 'Hinge / Posterior Chain',
    primaryMuscle: 'Erector Spinae & Gluteus Maximus',
    secondaryMuscles: ['Hamstrings', 'Quadriceps', 'Latissimus Dorsi', 'Trapezius', 'Forearms'],
    mechanics: 'Compound',
    equipment: 'Barbell',
    forceType: 'Pull',
    description: 'Full-body kinetic chain pulling benchmark. Maximizes overall posterior chain recruitment.',
  },
  {
    idKey: EXERCISES.PULLUPS,
    muscleGroup: 'Back',
    movementPattern: 'Vertical Pull',
    primaryMuscle: 'Latissimus Dorsi',
    secondaryMuscles: ['Biceps Brachii', 'Brachialis', 'Teres Major', 'Rhomboids', 'Lower Trapezius'],
    mechanics: 'Compound',
    equipment: 'Bodyweight',
    forceType: 'Pull',
    description: 'Premier closed-chain vertical pulling movement for upper lat width and back V-taper.',
  },
  {
    idKey: EXERCISES.BARBELL_ROW,
    muscleGroup: 'Back',
    movementPattern: 'Horizontal Pull',
    primaryMuscle: 'Latissimus Dorsi & Rhomboids',
    secondaryMuscles: ['Middle/Lower Trapezius', 'Rear Deltoid', 'Biceps Brachii', 'Spinal Erectors'],
    mechanics: 'Compound',
    equipment: 'Barbell',
    forceType: 'Pull',
    description: 'Bent-over horizontal pull building back thickness, scapular retractors, and isometric core.',
  },
  {
    idKey: EXERCISES.SEATED_CABLE_ROW,
    muscleGroup: 'Back',
    movementPattern: 'Horizontal Pull',
    primaryMuscle: 'Middle Trapezius & Rhomboids',
    secondaryMuscles: ['Latissimus Dorsi', 'Rear Deltoid', 'Biceps Brachii', 'Erector Spinae'],
    mechanics: 'Compound',
    equipment: 'Cable',
    forceType: 'Pull',
    description: 'Strict horizontal pull allowing full protraction-retraction scapular excursion under tension.',
  },
  {
    idKey: EXERCISES.LAT_PULLDOWN,
    muscleGroup: 'Back',
    movementPattern: 'Vertical Pull',
    primaryMuscle: 'Latissimus Dorsi',
    secondaryMuscles: ['Biceps Brachii', 'Teres Major', 'Brachialis', 'Rhomboids'],
    mechanics: 'Compound',
    equipment: 'Cable',
    forceType: 'Pull',
    description: 'Open-chain vertical pull allowing controlled progressive overload without bodyweight limits.',
  },
  {
    idKey: EXERCISES.T_BAR_ROW,
    muscleGroup: 'Back',
    movementPattern: 'Horizontal Pull',
    primaryMuscle: 'Latissimus Dorsi & Rhomboids',
    secondaryMuscles: ['Middle/Lower Trapezius', 'Teres Major', 'Rear Deltoid', 'Biceps'],
    mechanics: 'Compound',
    equipment: 'Barbell',
    forceType: 'Pull',
    description: 'Heavy neutral-grip rowing pattern targeting mid-back density and lat thickness.',
  },
  {
    idKey: EXERCISES.DUMBBELL_ROW,
    muscleGroup: 'Back',
    movementPattern: 'Horizontal Pull',
    primaryMuscle: 'Latissimus Dorsi',
    secondaryMuscles: ['Rhomboids', 'Rear Deltoid', 'Biceps Brachii', 'Core Rotators'],
    mechanics: 'Compound',
    equipment: 'Dumbbell',
    forceType: 'Pull',
    description: 'Unilateral row resolving bilateral asymmetries with greater lat stretch at elbow extension.',
  },
  {
    idKey: EXERCISES.HYPEREXTENSIONS,
    muscleGroup: 'Back',
    movementPattern: 'Hinge / Posterior Chain',
    primaryMuscle: 'Erector Spinae',
    secondaryMuscles: ['Gluteus Maximus', 'Hamstrings'],
    mechanics: 'Isolation',
    equipment: 'Bodyweight',
    forceType: 'Pull',
    description: '45-degree posterior chain extension reinforcing lumbar durability and spinal endurance.',
  },

  // --- SHOULDERS ---
  {
    idKey: EXERCISES.OVERHEAD_PRESS,
    muscleGroup: 'Shoulders',
    movementPattern: 'Vertical Push',
    primaryMuscle: 'Anterior & Lateral Deltoids',
    secondaryMuscles: ['Triceps Brachii', 'Upper Trapezius', 'Serratus Anterior', 'Core Stabilizers'],
    mechanics: 'Compound',
    equipment: 'Barbell',
    forceType: 'Push',
    description: 'Standing strict military press. Demands whole-body bracing and overhead stability.',
  },
  {
    idKey: EXERCISES.DUMBBELL_SHOULDER_PRESS,
    muscleGroup: 'Shoulders',
    movementPattern: 'Vertical Push',
    primaryMuscle: 'Anterior & Lateral Deltoids',
    secondaryMuscles: ['Triceps Brachii', 'Upper Trapezius'],
    mechanics: 'Compound',
    equipment: 'Dumbbell',
    forceType: 'Push',
    description: 'Seated vertical press providing joint-friendly arc and independent arm stabilization.',
  },
  {
    idKey: EXERCISES.DUMBBELL_LATERAL_RAISE,
    muscleGroup: 'Shoulders',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Lateral Deltoid',
    secondaryMuscles: ['Anterior Deltoid', 'Upper Trapezius', 'Supraspinatus'],
    mechanics: 'Isolation',
    equipment: 'Dumbbell',
    forceType: 'Push',
    description: 'Direct lateral head abduction creating shoulder width and clavicle-to-waist taper.',
  },
  {
    idKey: EXERCISES.CABLE_LATERAL_RAISE,
    muscleGroup: 'Shoulders',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Lateral Deltoid',
    secondaryMuscles: ['Supraspinatus', 'Upper Trapezius'],
    mechanics: 'Isolation',
    equipment: 'Cable',
    forceType: 'Push',
    description: 'Continuous resistance curve across entire range, especially in bottom stretched position.',
  },
  {
    idKey: EXERCISES.REAR_DELT_FLY,
    muscleGroup: 'Shoulders',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Posterior (Rear) Deltoid',
    secondaryMuscles: ['Infraspinatus', 'Teres Minor', 'Rhomboids', 'Middle Trapezius'],
    mechanics: 'Isolation',
    equipment: 'Dumbbell',
    forceType: 'Pull',
    description: 'Strengthens the rear delts and helps keep your shoulders healthy and balanced.',
  },
  {
    idKey: EXERCISES.BARBELL_SHRUGS,
    muscleGroup: 'Shoulders',
    movementPattern: 'Hinge / Posterior Chain',
    primaryMuscle: 'Upper Trapezius',
    secondaryMuscles: ['Levator Scapulae', 'Middle Trapezius', 'Forearms'],
    mechanics: 'Isolation',
    equipment: 'Barbell',
    forceType: 'Pull',
    description: 'Heavy shrugs directly target and build the upper traps and neck.',
  },

  // --- BICEPS ---
  {
    idKey: EXERCISES.BARBELL_CURL,
    muscleGroup: 'Biceps',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Biceps Brachii (Short & Long Heads)',
    secondaryMuscles: ['Brachialis', 'Brachioradialis', 'Forearm Flexors'],
    mechanics: 'Isolation',
    equipment: 'Barbell',
    forceType: 'Pull',
    description: 'Classic barbell curl that lets you lift heavy to build biceps size.',
  },
  {
    idKey: EXERCISES.DUMBBELL_BICEP_CURL,
    muscleGroup: 'Biceps',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Biceps Brachii',
    secondaryMuscles: ['Brachialis', 'Brachioradialis', 'Pronator Teres'],
    mechanics: 'Isolation',
    equipment: 'Dumbbell',
    forceType: 'Pull',
    description: 'Rotating your palm up as you curl squeezes the bicep for a peak contraction.',
  },
  {
    idKey: EXERCISES.INCLINE_DUMBBELL_CURL,
    muscleGroup: 'Biceps',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Biceps Brachii (Long Head Stretch)',
    secondaryMuscles: ['Brachialis', 'Anterior Deltoid (Stabilizer)'],
    mechanics: 'Isolation',
    equipment: 'Dumbbell',
    forceType: 'Pull',
    description: 'Shoulder hyperextension on incline bench stretches the long head for peak development.',
  },
  {
    idKey: EXERCISES.HAMMER_CURL,
    muscleGroup: 'Biceps',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Brachioradialis & Brachialis',
    secondaryMuscles: ['Biceps Brachii', 'Forearm Extensors'],
    mechanics: 'Isolation',
    equipment: 'Dumbbell',
    forceType: 'Pull',
    description: 'Neutral wrist grip shifts peak leverage to the brachialis, pushing biceps up.',
  },
  {
    idKey: EXERCISES.PREACHER_CURL,
    muscleGroup: 'Biceps',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Biceps Brachii (Short Head)',
    secondaryMuscles: ['Brachialis'],
    mechanics: 'Isolation',
    equipment: 'Barbell',
    forceType: 'Pull',
    description: 'Eliminates shoulder swing momentum and provides extreme tension at bottom extension.',
  },
  {
    idKey: EXERCISES.CABLE_BICEP_CURL,
    muscleGroup: 'Biceps',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Biceps Brachii',
    secondaryMuscles: ['Brachialis', 'Brachioradialis'],
    mechanics: 'Isolation',
    equipment: 'Cable',
    forceType: 'Pull',
    description: 'Smooth continuous line of pull maintaining tension even at peak elbow flexion.',
  },

  // --- TRICEPS ---
  {
    idKey: EXERCISES.TRICEP_PUSH_DOWN,
    muscleGroup: 'Triceps',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Triceps Brachii (Lateral & Medial Heads)',
    secondaryMuscles: ['Triceps Long Head', 'Anconeus'],
    mechanics: 'Isolation',
    equipment: 'Cable',
    forceType: 'Push',
    description: 'High pulley extension locking out elbows to target horseshoe outer triceps.',
  },
  {
    idKey: EXERCISES.SKULL_CRUSHERS,
    muscleGroup: 'Triceps',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Triceps Brachii (Medial & Long Heads)',
    secondaryMuscles: ['Triceps Lateral Head', 'Anconeus'],
    mechanics: 'Isolation',
    equipment: 'Barbell',
    forceType: 'Push',
    description: 'Lying tricep extension behind head for deep stretch on long triceps head.',
  },
  {
    idKey: EXERCISES.OVERHEAD_TRICEP_EXTENSION,
    muscleGroup: 'Triceps',
    movementPattern: 'Arm Isolation',
    primaryMuscle: 'Triceps Brachii (Long Head)',
    secondaryMuscles: ['Triceps Lateral Head', 'Anconeus'],
    mechanics: 'Isolation',
    equipment: 'Dumbbell',
    forceType: 'Push',
    description: 'Full overhead shoulder flexion places the long head in maximum stretch position.',
  },
  {
    idKey: EXERCISES.CLOSE_GRIP_BENCH_PRESS,
    muscleGroup: 'Triceps',
    movementPattern: 'Horizontal Push',
    primaryMuscle: 'Triceps Brachii',
    secondaryMuscles: ['Pectoralis Major (Clavicular)', 'Anterior Deltoid'],
    mechanics: 'Compound',
    equipment: 'Barbell',
    forceType: 'Push',
    description: 'Heavy compound pressing variant focusing mechanical load on elbow lockouts.',
  },

  // --- LEGS ---
  {
    idKey: EXERCISES.BARBELL_SQUAT,
    muscleGroup: 'Legs',
    movementPattern: 'Squat / Knee Dominant',
    primaryMuscle: 'Quadriceps Femoris',
    secondaryMuscles: ['Gluteus Maximus', 'Adductor Magnus', 'Hamstrings', 'Erector Spinae', 'Core'],
    mechanics: 'Compound',
    equipment: 'Barbell',
    forceType: 'Push',
    description: 'King of lower body exercises. Builds massive quad, glute, and overall leg strength.',
  },
  {
    idKey: EXERCISES.LEG_PRESS,
    muscleGroup: 'Legs',
    movementPattern: 'Squat / Knee Dominant',
    primaryMuscle: 'Quadriceps Femoris',
    secondaryMuscles: ['Gluteus Maximus', 'Hamstrings', 'Calves'],
    mechanics: 'Compound',
    equipment: 'Machine',
    forceType: 'Push',
    description: 'A machine compound that lets you load your legs heavily with solid back support.',
  },
  {
    idKey: EXERCISES.HACK_SQUAT,
    muscleGroup: 'Legs',
    movementPattern: 'Squat / Knee Dominant',
    primaryMuscle: 'Quadriceps (Vastus Lateralis/Medialis)',
    secondaryMuscles: ['Gluteus Maximus', 'Adductor Magnus'],
    mechanics: 'Compound',
    equipment: 'Machine',
    forceType: 'Push',
    description: 'Deep squat machine with great stability that directly loads the quads.',
  },
  {
    idKey: EXERCISES.LEG_EXTENSION,
    muscleGroup: 'Legs',
    movementPattern: 'Squat / Knee Dominant',
    primaryMuscle: 'Quadriceps (Rectus Femoris & Vastus)',
    secondaryMuscles: ['None (Pure Knee Extensor)'],
    mechanics: 'Isolation',
    equipment: 'Machine',
    forceType: 'Push',
    description: 'Isolates the quads and delivers an intense contraction at the top of the lift.',
  },
  {
    idKey: EXERCISES.LEG_CURL,
    muscleGroup: 'Legs',
    movementPattern: 'Hinge / Posterior Chain',
    primaryMuscle: 'Hamstrings (Biceps Femoris, Semitendinosus)',
    secondaryMuscles: ['Gastrocnemius', 'Gracilis', 'Sartorius'],
    mechanics: 'Isolation',
    equipment: 'Machine',
    forceType: 'Pull',
    description: 'Directly targets and builds the hamstrings with smooth machine tension.',
  },
  {
    idKey: EXERCISES.ROMANIAN_DEADLIFT,
    muscleGroup: 'Legs',
    movementPattern: 'Hinge / Posterior Chain',
    primaryMuscle: 'Hamstrings & Gluteus Maximus',
    secondaryMuscles: ['Erector Spinae', 'Adductor Magnus', 'Latissimus Dorsi', 'Forearms'],
    mechanics: 'Compound',
    equipment: 'Barbell',
    forceType: 'Pull',
    description: 'Eccentric hamstring loading under high mechanical tension via pure hip hinge.',
  },
  {
    idKey: EXERCISES.BULGARIAN_SPLIT_SQUAT,
    muscleGroup: 'Legs',
    movementPattern: 'Squat / Knee Dominant',
    primaryMuscle: 'Quadriceps & Gluteus Maximus',
    secondaryMuscles: ['Adductors', 'Hamstrings', 'Calves', 'Core Stabilizers'],
    mechanics: 'Compound',
    equipment: 'Dumbbell',
    forceType: 'Push',
    description: 'Unilateral rear-foot elevated split squat fixing leg imbalances and hip stability.',
  },

  // --- ABS / CORE ---
  {
    idKey: EXERCISES.PLANK,
    muscleGroup: 'Core',
    movementPattern: 'Core Stability',
    primaryMuscle: 'Rectus Abdominis & Transverse Abdominis',
    secondaryMuscles: ['Internal/External Obliques', 'Gluteus Maximus', 'Serratus Anterior'],
    mechanics: 'Isolation',
    equipment: 'Bodyweight',
    forceType: 'Static',
    description: 'Anti-extension isometric core brace training intra-abdominal stability.',
  },
  {
    idKey: EXERCISES.CRUNCHES,
    muscleGroup: 'Core',
    movementPattern: 'Core Stability',
    primaryMuscle: 'Rectus Abdominis (Upper Segments)',
    secondaryMuscles: ['Internal and External Obliques'],
    mechanics: 'Isolation',
    equipment: 'Bodyweight',
    forceType: 'Pull',
    description: 'Controlled spinal flexion bringing sternum toward pelvis without hip flexor pull.',
  },
  {
    idKey: EXERCISES.CABLE_CRUNCH,
    muscleGroup: 'Core',
    movementPattern: 'Core Stability',
    primaryMuscle: 'Rectus Abdominis',
    secondaryMuscles: ['External Obliques', 'Serratus Anterior'],
    mechanics: 'Isolation',
    equipment: 'Cable',
    forceType: 'Pull',
    description: 'Kneeling progressive resistance crunch allowing heavy direct overload of abs.',
  },
  {
    idKey: EXERCISES.HANGING_LEG_RAISE,
    muscleGroup: 'Core',
    movementPattern: 'Core Stability',
    primaryMuscle: 'Rectus Abdominis (Lower) & Iliopsoas',
    secondaryMuscles: ['External Obliques', 'Forearm Grip', 'Latissimus Dorsi (Stabilizer)'],
    mechanics: 'Isolation',
    equipment: 'Bodyweight',
    forceType: 'Pull',
    description: 'Posterior pelvic tilt with hanging grip challenge targeting lower abdominal wall.',
  },

  // --- CALVES ---
  {
    idKey: EXERCISES.STANDING_CALF_RAISE,
    muscleGroup: 'Calves',
    movementPattern: 'Calf Raise',
    primaryMuscle: 'Gastrocnemius (Calves)',
    secondaryMuscles: ['Soleus', 'Plantaris', 'Tibialis Posterior'],
    mechanics: 'Isolation',
    equipment: 'Machine',
    forceType: 'Push',
    description: 'Knees locked out straight to place maximum stretch and torque on gastrocnemius.',
  },
  {
    idKey: EXERCISES.SEATED_CALF_RAISE,
    muscleGroup: 'Calves',
    movementPattern: 'Calf Raise',
    primaryMuscle: 'Soleus (Deep Calves)',
    secondaryMuscles: ['Gastrocnemius', 'Peroneus Longus'],
    mechanics: 'Isolation',
    equipment: 'Machine',
    forceType: 'Push',
    description: '90-degree bent knee slackens gastrocnemius, isolating the deep endurance soleus muscle.',
  },
];
