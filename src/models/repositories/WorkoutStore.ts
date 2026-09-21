import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Program, Workout, WorkoutExercise } from '../types/Workout';
import { WorkoutSession, SessionExercise } from '../types/WorkoutHistory';
import { calculateEpley1RM } from '../services/StrengthEngine';
import { EXERCISES, EXERCISE_LABELS, EXERCISE_IMAGES, ExerciseId, normalizeExerciseKey } from '../types/Exercise';
import { EXERCISE_ANATOMY } from '../types/ExerciseAnatomyMap';
import { apiClient } from '../services/ApiClient';


export type LastSessionMap = Record<string, WorkoutExercise[]>;

interface WorkoutStoreState {
  programs: Program[];
  activeProgramId: string;
  allWorkouts: Workout[];
  activeExerciseMap: Record<string, WorkoutExercise[]>;
  lastSession: LastSessionMap;
  workoutHistory: WorkoutSession[];

  // Selectors / Getters
  getActiveProgram: () => Program;
  getActiveWorkouts: () => Workout[];

  // Actions
  switchProgram: (programId: string) => void;
  createProgram: (title: string, workoutDays: { title: string; note?: string; dayOfWeek?: number; defaultExercises?: ExerciseId[] }[]) => void;
  deleteProgram: (programId: string) => void;
  updateWorkoutSchedule: (workoutId: string, dayOfWeek: number) => void;
  updateProgramSchedule: (programId: string, dayMappings: { workoutId: string; dayOfWeek: number }[]) => void;
  updateWorkoutExercises: (workoutId: string, exercises: WorkoutExercise[]) => void;
  recordSession: (workoutId: string, workoutTitle: string, exercises: WorkoutExercise[]) => WorkoutSession | null;
  recordBenchmarkSession: (exerciseId: string, oneRM: number, rpe?: number) => void;
  clearAll: () => void;
}

// ─── Default Programs ─────────────────────────────────────────────────────────

const PREBUILT_PROGRAMS: Program[] = [
  {
    id: 'ppl-classic',
    title: 'Push Pull Legs (5-Day Hypertrophy)',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'upper-lower',
    title: 'Upper / Lower Split (4-Day Strength)',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'full-body',
    title: 'Full Body Compound Frequency (3-Day)',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'arnold-split',
    title: 'Arnold Split (Opposing Muscles)',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
  },
];

const PREBUILT_WORKOUTS: Workout[] = [
  // PPL
  { id: 'ppl-push1', title: 'Push A (Heavy Bench Focus)', dayOfWeek: 1, note: 'Heavy barbell pressing + overhead work', programId: 'ppl-classic' },
  { id: 'ppl-pull1', title: 'Pull A (Deadlift & Thickness)', dayOfWeek: 2, note: 'Deadlifts + heavy barbell rows', programId: 'ppl-classic' },
  { id: 'ppl-legs1', title: 'Legs A (Squat Dominant)', dayOfWeek: 3, note: 'Back squats + Romanian deadlifts', programId: 'ppl-classic' },
  { id: 'ppl-push2', title: 'Push B (Incline & Delts)', dayOfWeek: 4, note: 'Incline pressing + lateral raises', programId: 'ppl-classic' },
  { id: 'ppl-pull2', title: 'Pull B (Lat Width & Biceps)', dayOfWeek: 5, note: 'Pull-ups + cable rows + curls', programId: 'ppl-classic' },

  // Upper / Lower
  { id: 'ul-upper1', title: 'Upper Heavy', dayOfWeek: 1, note: 'Horizontal press + horizontal row focus', programId: 'upper-lower' },
  { id: 'ul-lower1', title: 'Lower Heavy', dayOfWeek: 2, note: 'Squat + RDL + quad isolation', programId: 'upper-lower' },
  { id: 'ul-upper2', title: 'Upper Hypertrophy', dayOfWeek: 3, note: 'Vertical press + vertical pull focus', programId: 'upper-lower' },
  { id: 'ul-lower2', title: 'Lower Volume', dayOfWeek: 4, note: 'Deadlift + Hack squat + calves', programId: 'upper-lower' },

  // Full Body
  { id: 'fb-day1', title: 'Full Body A (Squat & Press)', dayOfWeek: 1, note: 'Squat, Bench Press, Barbell Row', programId: 'full-body' },
  { id: 'fb-day2', title: 'Full Body B (Deadlift & OHP)', dayOfWeek: 2, note: 'Deadlift, Overhead Press, Pullups', programId: 'full-body' },
  { id: 'fb-day3', title: 'Full Body C (Leg Press & Incline)', dayOfWeek: 3, note: 'Leg Press, Incline Press, T-Bar Row', programId: 'full-body' },

  // Arnold Split
  { id: 'arn-cb', title: 'Chest & Back', dayOfWeek: 1, note: 'Chest press & back row supersets', programId: 'arnold-split' },
  { id: 'arn-sa', title: 'Shoulders & Arms', dayOfWeek: 2, note: 'Overhead press, bicep curls & tricep extensions', programId: 'arnold-split' },
  { id: 'arn-legs', title: 'Legs & Core', dayOfWeek: 3, note: 'Squats, RDLs, calves, and hanging leg raises', programId: 'arnold-split' },
];

function makeInitialSets() {
  return [
    { id: `s-${Date.now()}-1`, weight: '80', reps: '5', rpe: 7 },
    { id: `s-${Date.now()}-2`, weight: '85', reps: '5', rpe: 8 },
    { id: `s-${Date.now()}-3`, weight: '85', reps: '5', rpe: 8 },
  ];
}

const PREBUILT_EXERCISES_MAP: Record<string, WorkoutExercise[]> = {
  'ppl-push1': [
    { id: 'ex-p1', name: EXERCISES.BARBELL_BENCH_PRESS, muscleGroup: 'Chest', imageUrl: EXERCISE_IMAGES[EXERCISES.BARBELL_BENCH_PRESS], sets: makeInitialSets() },
    { id: 'ex-p2', name: EXERCISES.OVERHEAD_PRESS, muscleGroup: 'Shoulders', imageUrl: EXERCISE_IMAGES[EXERCISES.OVERHEAD_PRESS], sets: makeInitialSets() },
    { id: 'ex-p3', name: EXERCISES.DIPS, muscleGroup: 'Chest', imageUrl: EXERCISE_IMAGES[EXERCISES.DIPS], sets: makeInitialSets() },
    { id: 'ex-p4', name: EXERCISES.TRICEP_PUSH_DOWN, muscleGroup: 'Triceps', imageUrl: EXERCISE_IMAGES[EXERCISES.TRICEP_PUSH_DOWN], sets: makeInitialSets() },
  ],
  'ppl-pull1': [
    { id: 'ex-pl1', name: EXERCISES.DEADLIFT, muscleGroup: 'Back', imageUrl: EXERCISE_IMAGES[EXERCISES.DEADLIFT], sets: makeInitialSets() },
    { id: 'ex-pl2', name: EXERCISES.BARBELL_ROW, muscleGroup: 'Back', imageUrl: EXERCISE_IMAGES[EXERCISES.BARBELL_ROW], sets: makeInitialSets() },
    { id: 'ex-pl3', name: EXERCISES.PULLUPS, muscleGroup: 'Back', imageUrl: EXERCISE_IMAGES[EXERCISES.PULLUPS], sets: makeInitialSets() },
    { id: 'ex-pl4', name: EXERCISES.BARBELL_CURL, muscleGroup: 'Biceps', imageUrl: EXERCISE_IMAGES[EXERCISES.BARBELL_CURL], sets: makeInitialSets() },
  ],
  'ppl-legs1': [
    { id: 'ex-l1', name: EXERCISES.BARBELL_SQUAT, muscleGroup: 'Legs', imageUrl: EXERCISE_IMAGES[EXERCISES.BARBELL_SQUAT], sets: makeInitialSets() },
    { id: 'ex-l2', name: EXERCISES.ROMANIAN_DEADLIFT, muscleGroup: 'Legs', imageUrl: EXERCISE_IMAGES[EXERCISES.ROMANIAN_DEADLIFT], sets: makeInitialSets() },
    { id: 'ex-l3', name: EXERCISES.LEG_PRESS, muscleGroup: 'Legs', imageUrl: EXERCISE_IMAGES[EXERCISES.LEG_PRESS], sets: makeInitialSets() },
  ],
  'ul-upper1': [
    { id: 'ex-u1', name: EXERCISES.BARBELL_BENCH_PRESS, muscleGroup: 'Chest', imageUrl: EXERCISE_IMAGES[EXERCISES.BARBELL_BENCH_PRESS], sets: makeInitialSets() },
    { id: 'ex-u2', name: EXERCISES.BARBELL_ROW, muscleGroup: 'Back', imageUrl: EXERCISE_IMAGES[EXERCISES.BARBELL_ROW], sets: makeInitialSets() },
    { id: 'ex-u3', name: EXERCISES.DUMBBELL_SHOULDER_PRESS, muscleGroup: 'Shoulders', imageUrl: EXERCISE_IMAGES[EXERCISES.DUMBBELL_SHOULDER_PRESS], sets: makeInitialSets() },
  ],
  'fb-day1': [
    { id: 'ex-fb1', name: EXERCISES.BARBELL_SQUAT, muscleGroup: 'Legs', imageUrl: EXERCISE_IMAGES[EXERCISES.BARBELL_SQUAT], sets: makeInitialSets() },
    { id: 'ex-fb2', name: EXERCISES.BARBELL_BENCH_PRESS, muscleGroup: 'Chest', imageUrl: EXERCISE_IMAGES[EXERCISES.BARBELL_BENCH_PRESS], sets: makeInitialSets() },
    { id: 'ex-fb3', name: EXERCISES.BARBELL_ROW, muscleGroup: 'Back', imageUrl: EXERCISE_IMAGES[EXERCISES.BARBELL_ROW], sets: makeInitialSets() },
  ],
};

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const DEFAULT_HISTORY: WorkoutSession[] = [
  {
    id: 's-1',
    workoutId: 'ppl-push1',
    workoutTitle: 'Push A',
    date: daysAgo(52),
    exercises: [
      {
        exerciseId: EXERCISES.BARBELL_BENCH_PRESS,
        exerciseName: EXERCISE_LABELS[EXERCISES.BARBELL_BENCH_PRESS],
        bestEpley1RM: 93.3,
        totalVolume: 1200,
        sets: [{ weight: 80, reps: 5, rpe: 7 }, { weight: 80, reps: 5, rpe: 8 }, { weight: 80, reps: 5, rpe: 8 }],
      },
      {
        exerciseId: EXERCISES.OVERHEAD_PRESS,
        exerciseName: EXERCISE_LABELS[EXERCISES.OVERHEAD_PRESS],
        bestEpley1RM: 64.2,
        totalVolume: 825,
        sets: [{ weight: 55, reps: 5, rpe: 7 }, { weight: 55, reps: 5, rpe: 8 }, { weight: 55, reps: 5, rpe: 8 }],
      },
    ],
    totalVolume: 2025,
  },
  {
    id: 's-2',
    workoutId: 'ppl-pull1',
    workoutTitle: 'Pull A',
    date: daysAgo(48),
    exercises: [
      {
        exerciseId: EXERCISES.DEADLIFT,
        exerciseName: EXERCISE_LABELS[EXERCISES.DEADLIFT],
        bestEpley1RM: 140.0,
        totalVolume: 1800,
        sets: [{ weight: 120, reps: 5, rpe: 8 }, { weight: 120, reps: 5, rpe: 8 }, { weight: 120, reps: 5, rpe: 9 }],
      },
      {
        exerciseId: EXERCISES.BARBELL_ROW,
        exerciseName: EXERCISE_LABELS[EXERCISES.BARBELL_ROW],
        bestEpley1RM: 90.0,
        totalVolume: 1350,
        sets: [{ weight: 75, reps: 6, rpe: 7 }, { weight: 75, reps: 6, rpe: 8 }, { weight: 75, reps: 6, rpe: 8 }],
      },
    ],
    totalVolume: 3150,
  },
  {
    id: 's-3',
    workoutId: 'ppl-legs1',
    workoutTitle: 'Legs A',
    date: daysAgo(44),
    exercises: [
      {
        exerciseId: EXERCISES.BARBELL_SQUAT,
        exerciseName: EXERCISE_LABELS[EXERCISES.BARBELL_SQUAT],
        bestEpley1RM: 116.7,
        totalVolume: 1500,
        sets: [{ weight: 100, reps: 5, rpe: 8 }, { weight: 100, reps: 5, rpe: 8 }, { weight: 100, reps: 5, rpe: 9 }],
      },
    ],
    totalVolume: 1500,
  },
  {
    id: 's-4',
    workoutId: 'ppl-push1',
    workoutTitle: 'Push A',
    date: daysAgo(21),
    exercises: [
      {
        exerciseId: EXERCISES.BARBELL_BENCH_PRESS,
        exerciseName: EXERCISE_LABELS[EXERCISES.BARBELL_BENCH_PRESS],
        bestEpley1RM: 99.2,
        totalVolume: 1275,
        sets: [{ weight: 85, reps: 5, rpe: 7 }, { weight: 85, reps: 5, rpe: 8 }, { weight: 85, reps: 5, rpe: 8 }],
      },
      {
        exerciseId: EXERCISES.OVERHEAD_PRESS,
        exerciseName: EXERCISE_LABELS[EXERCISES.OVERHEAD_PRESS],
        bestEpley1RM: 70.0,
        totalVolume: 900,
        sets: [{ weight: 60, reps: 5, rpe: 8 }, { weight: 60, reps: 5, rpe: 8 }, { weight: 60, reps: 5, rpe: 9 }],
      },
    ],
    totalVolume: 2175,
  },
  {
    id: 's-5',
    workoutId: 'ppl-pull1',
    workoutTitle: 'Pull A',
    date: daysAgo(14),
    exercises: [
      {
        exerciseId: EXERCISES.DEADLIFT,
        exerciseName: EXERCISE_LABELS[EXERCISES.DEADLIFT],
        bestEpley1RM: 151.7,
        totalVolume: 1950,
        sets: [{ weight: 130, reps: 5, rpe: 8 }, { weight: 130, reps: 5, rpe: 8 }, { weight: 130, reps: 5, rpe: 9 }],
      },
      {
        exerciseId: EXERCISES.BARBELL_ROW,
        exerciseName: EXERCISE_LABELS[EXERCISES.BARBELL_ROW],
        bestEpley1RM: 96.0,
        totalVolume: 1440,
        sets: [{ weight: 80, reps: 6, rpe: 7 }, { weight: 80, reps: 6, rpe: 8 }, { weight: 80, reps: 6, rpe: 8 }],
      },
    ],
    totalVolume: 3390,
  },
  {
    id: 's-6',
    workoutId: 'ppl-legs1',
    workoutTitle: 'Legs A',
    date: daysAgo(7),
    exercises: [
      {
        exerciseId: EXERCISES.BARBELL_SQUAT,
        exerciseName: EXERCISE_LABELS[EXERCISES.BARBELL_SQUAT],
        bestEpley1RM: 128.3,
        totalVolume: 1650,
        sets: [{ weight: 110, reps: 5, rpe: 8 }, { weight: 110, reps: 5, rpe: 8 }, { weight: 110, reps: 5, rpe: 9 }],
      },
    ],
    totalVolume: 1650,
  },
  {
    id: 's-7',
    workoutId: 'ppl-push1',
    workoutTitle: 'Push A',
    date: daysAgo(2),
    exercises: [
      {
        exerciseId: EXERCISES.BARBELL_BENCH_PRESS,
        exerciseName: EXERCISE_LABELS[EXERCISES.BARBELL_BENCH_PRESS],
        bestEpley1RM: 102.1,
        totalVolume: 1315,
        sets: [{ weight: 87.5, reps: 5, rpe: 7 }, { weight: 87.5, reps: 5, rpe: 8 }, { weight: 90, reps: 4, rpe: 9 }],
      },
      {
        exerciseId: EXERCISES.OVERHEAD_PRESS,
        exerciseName: EXERCISE_LABELS[EXERCISES.OVERHEAD_PRESS],
        bestEpley1RM: 72.9,
        totalVolume: 938,
        sets: [{ weight: 62.5, reps: 5, rpe: 8 }, { weight: 62.5, reps: 5, rpe: 8 }, { weight: 62.5, reps: 5, rpe: 9 }],
      },
    ],
    totalVolume: 2253,
  },
];

const sanitizeExerciseMap = (map: Record<string, WorkoutExercise[]>): Record<string, WorkoutExercise[]> => {
  if (!map) return {};
  const sanitized: Record<string, WorkoutExercise[]> = {};
  for (const [wId, exercises] of Object.entries(map)) {
    sanitized[wId] = (exercises || []).map((ex) => {
      const key = normalizeExerciseKey(ex.name);
      return {
        ...ex,
        imageUrl: EXERCISE_IMAGES[key] || ex.imageUrl,
      };
    });
  }
  return sanitized;
};

const getDefaultExercisesForTitle = (title: string): ExerciseId[] => {
  const t = title.toLowerCase();
  if (t.includes('push') || t.includes('chest')) {
    return [EXERCISES.BARBELL_BENCH_PRESS, EXERCISES.OVERHEAD_PRESS, EXERCISES.DIPS, EXERCISES.TRICEP_PUSH_DOWN];
  }
  if (t.includes('pull') || t.includes('back')) {
    return [EXERCISES.DEADLIFT, EXERCISES.BARBELL_ROW, EXERCISES.PULLUPS, EXERCISES.BARBELL_CURL];
  }
  if (t.includes('leg') || t.includes('lower') || t.includes('squat')) {
    return [EXERCISES.BARBELL_SQUAT, EXERCISES.ROMANIAN_DEADLIFT, EXERCISES.LEG_PRESS];
  }
  if (t.includes('upper')) {
    return [EXERCISES.BARBELL_BENCH_PRESS, EXERCISES.BARBELL_ROW, EXERCISES.DUMBBELL_SHOULDER_PRESS];
  }
  if (t.includes('arm') || t.includes('shoulder')) {
    return [EXERCISES.DUMBBELL_SHOULDER_PRESS, EXERCISES.BARBELL_CURL, EXERCISES.TRICEP_PUSH_DOWN, EXERCISES.DUMBBELL_LATERAL_RAISE];
  }
  if (t.includes('full') || t.includes('body')) {
    return [EXERCISES.BARBELL_SQUAT, EXERCISES.BARBELL_BENCH_PRESS, EXERCISES.BARBELL_ROW];
  }
  return [EXERCISES.BARBELL_BENCH_PRESS, EXERCISES.BARBELL_ROW, EXERCISES.BARBELL_SQUAT];
};

export const useWorkoutStore = create<WorkoutStoreState>()(
  persist(
    (set, get) => ({
      programs: PREBUILT_PROGRAMS,
      activeProgramId: 'ppl-classic',
      allWorkouts: PREBUILT_WORKOUTS,
      activeExerciseMap: PREBUILT_EXERCISES_MAP,
      lastSession: PREBUILT_EXERCISES_MAP,
      workoutHistory: DEFAULT_HISTORY,

      getActiveProgram: () => {
        const { programs, activeProgramId } = get();
        return programs.find((p) => p.id === activeProgramId) || programs[0] || PREBUILT_PROGRAMS[0];
      },

      getActiveWorkouts: () => {
        const { allWorkouts, activeProgramId, activeExerciseMap } = get();
        const matches = allWorkouts.filter((w) => w.programId === activeProgramId);
        // If a certain day has 0 exercises do not count it as a day
        return matches.filter((w) => (activeExerciseMap[w.id] || []).length > 0);
      },

      switchProgram: (programId: string) => {
        const { programs } = get();
        const found = programs.find((p) => p.id === programId);
        if (found) {
          set({ activeProgramId: programId });
        }
      },

      createProgram: (title: string, workoutDays) => {
        const newProgramId = `custom-${Date.now()}`;
        const newProgram: Program = {
          id: newProgramId,
          title: title.trim(),
          image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
        };

        // Filter out any day that has 0 exercises
        const daysWithExercises = workoutDays.filter((day) => {
          if (day.defaultExercises !== undefined) {
            return day.defaultExercises.length > 0;
          }
          return true;
        });

        if (daysWithExercises.length === 0) return;

        const newWorkouts: Workout[] = daysWithExercises.map((day, idx) => ({
          id: `w-${newProgramId}-${idx + 1}`,
          title: day.title.trim() || `Day ${idx + 1}`,
          dayOfWeek: day.dayOfWeek !== undefined ? day.dayOfWeek : (idx + 1),
          note: day.note || 'Custom routine session',
          programId: newProgramId,
        }));

        const newExerciseMap: Record<string, WorkoutExercise[]> = {};
        newWorkouts.forEach((w, i) => {
          const customDefaults = daysWithExercises[i]?.defaultExercises;
          const defaultEx = (customDefaults && customDefaults.length > 0)
            ? customDefaults
            : getDefaultExercisesForTitle(w.title);

          if (defaultEx.length === 0) return; // Do not save day with 0 exercises

          newExerciseMap[w.id] = defaultEx.map((exId, exIdx) => ({
            id: `ex-${w.id}-${exIdx}`,
            name: exId,
            muscleGroup: 'Compound',
            imageUrl: EXERCISE_IMAGES[exId] || '',
            sets: [
              { id: `s-${w.id}-${exIdx}-1`, weight: '70', reps: '5', rpe: 7 },
              { id: `s-${w.id}-${exIdx}-2`, weight: '75', reps: '5', rpe: 8 },
              { id: `s-${w.id}-${exIdx}-3`, weight: '75', reps: '5', rpe: 8 },
            ],
          }));
        });

        // A day that has no exercises should not be saved
        const finalWorkouts = newWorkouts.filter((w) => (newExerciseMap[w.id] || []).length > 0);
        if (finalWorkouts.length === 0) return;

        set((state) => ({
          programs: [newProgram, ...state.programs],
          activeProgramId: newProgramId,
          allWorkouts: [...finalWorkouts, ...state.allWorkouts],
          activeExerciseMap: { ...state.activeExerciseMap, ...newExerciseMap },
          lastSession: { ...state.lastSession, ...newExerciseMap },
        }));
      },

      deleteProgram: (programId: string) => {
        set((state) => {
          if (state.programs.length <= 1) return state;
          const filtered = state.programs.filter((p) => p.id !== programId);
          const nextActiveId = state.activeProgramId === programId ? filtered[0].id : state.activeProgramId;
          return {
            programs: filtered,
            activeProgramId: nextActiveId,
          };
        });
      },

      updateWorkoutSchedule: (workoutId: string, dayOfWeek: number) => {
        set((state) => ({
          allWorkouts: state.allWorkouts.map((w) =>
            w.id === workoutId ? { ...w, dayOfWeek } : w
          ),
        }));
      },

      updateProgramSchedule: (programId: string, dayMappings: { workoutId: string; dayOfWeek: number }[]) => {
        const map = new Map(dayMappings.map((m) => [m.workoutId, m.dayOfWeek]));
        set((state) => ({
          allWorkouts: state.allWorkouts.map((w) => {
            if (w.programId === programId && map.has(w.id)) {
              return { ...w, dayOfWeek: map.get(w.id)! };
            }
            return w;
          }),
        }));
      },

      updateWorkoutExercises: (workoutId, exercises) =>
        set((state) => {
          // A day that has no exercises should not be saved
          if (exercises.length === 0) {
            const remainingWorkouts = state.allWorkouts.filter((w) => w.id !== workoutId);
            const { [workoutId]: _, ...remainingExerciseMap } = state.activeExerciseMap;
            const { [workoutId]: __, ...remainingLastSession } = state.lastSession;
            return {
              allWorkouts: remainingWorkouts,
              activeExerciseMap: remainingExerciseMap,
              lastSession: remainingLastSession,
            };
          }
          return {
            activeExerciseMap: {
              ...state.activeExerciseMap,
              [workoutId]: exercises,
            },
            lastSession: {
              ...state.lastSession,
              [workoutId]: exercises,
            },
          };
        }),

      recordSession: (workoutId, workoutTitle, exercises) => {
        const sessionExercises: SessionExercise[] = exercises
          .map((ex) => {
            const validSets = ex.sets
              .filter((s) => s.weight && s.reps)
              .map((s) => ({
                reps: parseInt(s.reps, 10) || 0,
                weight: parseFloat(s.weight) || 0,
                rpe: s.rpe,
              }));

            if (validSets.length === 0) return null;

            const bestEpley = validSets.reduce((best, s) => {
              const e1rm = calculateEpley1RM(s.weight, s.reps);
              return e1rm > best ? e1rm : best;
            }, 0);

            const canonicalKey = normalizeExerciseKey(ex.name);
            const standardName = EXERCISE_LABELS[canonicalKey] || ex.name;
            const anatomy = EXERCISE_ANATOMY[canonicalKey];

            return {
              exerciseId: canonicalKey,
              exerciseName: standardName,
              muscleGroup: anatomy?.label,
              primaryMuscles: (anatomy?.primary || []) as any,
              secondaryMuscles: (anatomy?.secondary || []) as any,
              bestEpley1RM: bestEpley,
              totalVolume: validSets.reduce((acc, s) => acc + s.weight * s.reps, 0),
              sets: validSets,
            };
          })
          .filter(Boolean) as SessionExercise[];

        if (sessionExercises.length === 0) return null;

        const newSession: WorkoutSession = {
          id: `session-${Date.now()}`,
          workoutId,
          workoutTitle,
          date: new Date().toISOString(),
          exercises: sessionExercises,
          totalVolume: sessionExercises.reduce((acc, e) => acc + e.totalVolume, 0),
        };

        set((state) => ({
          workoutHistory: [newSession, ...state.workoutHistory],
          lastSession: {
            ...state.lastSession,
            [workoutId]: exercises,
          },
        }));

        // Push standardized session payload to backend in background
        apiClient.recordWorkoutSession({
          workout_id: workoutId,
          workout_title: workoutTitle,
          date: newSession.date.slice(0, 10),
          exercises: sessionExercises.map((e) => ({
            exercise_key: e.exerciseId,
            exercise_name: e.exerciseName,
            sets: e.sets.map((s, idx) => ({
              set_number: idx + 1,
              weight_kg: s.weight,
              reps: s.reps,
              rpe: s.rpe,
            })),
          })),
        }).catch((err: any) => {
          console.warn('[WorkoutStore] Cloud session sync skipped:', err?.message || err);
        });

        return newSession;

      },

      recordBenchmarkSession: (exerciseId: string, oneRM: number, rpe = 10) => {
        const canonicalKey = normalizeExerciseKey(exerciseId);
        const standardName = EXERCISE_LABELS[canonicalKey] || exerciseId;
        const anatomy = EXERCISE_ANATOMY[canonicalKey];
        const val = Math.round(oneRM * 10) / 10;
        const todayStr = new Date().toISOString().slice(0, 10);

        set((state) => {
          const existingIdx = state.workoutHistory.findIndex(
            (s) =>
              s.workoutId === 'benchmark' &&
              s.date.slice(0, 10) === todayStr &&
              s.exercises.some((e) => e.exerciseId === canonicalKey)
          );

          if (existingIdx >= 0) {
            const updated = [...state.workoutHistory];
            const existing = updated[existingIdx];
            const updatedExercises = existing.exercises.map((e) => {
              if (e.exerciseId === canonicalKey) {
                const best = Math.max(e.bestEpley1RM, val);
                return {
                  ...e,
                  bestEpley1RM: best,
                  totalVolume: best,
                  sets: [{ weight: best, reps: 1, rpe }],
                };
              }
              return e;
            });
            updated[existingIdx] = {
              ...existing,
              date: new Date().toISOString(),
              exercises: updatedExercises,
              totalVolume: updatedExercises.reduce((acc, e) => acc + e.totalVolume, 0),
            };
            return { workoutHistory: updated };
          }

          const session: WorkoutSession = {
            id: `benchmark-${Date.now()}`,
            workoutId: 'benchmark',
            workoutTitle: '1RM Benchmark Test',
            date: new Date().toISOString(),
            exercises: [
              {
                exerciseId: canonicalKey,
                exerciseName: standardName,
                muscleGroup: anatomy?.label,
                primaryMuscles: (anatomy?.primary || []) as any,
                secondaryMuscles: (anatomy?.secondary || []) as any,
                bestEpley1RM: val,
                totalVolume: val,
                sets: [{ weight: val, reps: 1, rpe }],
              },
            ],
            totalVolume: val,
          };

          return {
            workoutHistory: [session, ...state.workoutHistory],
          };
        });
      },

      clearAll: () =>
        set({
          activeExerciseMap: {},
          lastSession: {},
          workoutHistory: [],
        }),
    }),
    {
      name: 'fitbuddy-workout-data-v2',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.activeExerciseMap = sanitizeExerciseMap(state.activeExerciseMap);
          state.lastSession = sanitizeExerciseMap(state.lastSession);
        }
      },
    },
  ),
);
