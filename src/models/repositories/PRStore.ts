import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PREntry, PRRecord } from '../types/PersonalRecord';
import { calculateEpley1RM } from '../services/StrengthEngine';
import { normalizeExerciseKey } from '../types/Exercise';

interface PRStoreState {
  personalRecords: PRRecord;
  checkIfNewPR: (
    exerciseId: string,
    weight: number,
    reps: number,
    rpe: number,
  ) => { isNewPR: boolean; calculated1RM: number };
  saveNewPRs: (newPRs: Partial<PRRecord>) => void;
  set1RM: (exerciseId: string, oneRM: number, rpe?: number) => void;
  clearAllPRs: () => void;
}

const INITIAL_PRS: PRRecord = {
  barbell_bench_press: { oneRM: 102.1, rpe: 8 },
  deadlift: { oneRM: 157.5, rpe: 8 },
  barbell_squat: { oneRM: 128.3, rpe: 8 },
  overhead_press: { oneRM: 72.9, rpe: 8 },
  barbell_row: { oneRM: 99.0, rpe: 8 },
  romanian_deadlift: { oneRM: 126.7, rpe: 8 },
};

export const usePRStore = create<PRStoreState>()(
  persist(
    (set, get) => ({
      personalRecords: INITIAL_PRS,

      checkIfNewPR: (exerciseId, weight, reps, rpe) => {
        const canonicalKey = normalizeExerciseKey(exerciseId);
        const calculated1RM = calculateEpley1RM(weight, reps);
        const stored = get().personalRecords[canonicalKey] || get().personalRecords[exerciseId];

        let isNewPR = false;
        if (!stored) {
          isNewPR = calculated1RM > 0;
        } else if (calculated1RM > stored.oneRM) {
          isNewPR = true;
        } else if (calculated1RM === stored.oneRM && rpe > 0 && stored.rpe > 0 && rpe < stored.rpe) {
          // Equal 1RM achieved with lower perceived exertion
          isNewPR = true;
        }

        return { isNewPR, calculated1RM };
      },

      set1RM: (exerciseId, oneRM, rpe = 10) => {
        const canonicalKey = normalizeExerciseKey(exerciseId);
        set((state) => ({
          personalRecords: {
            ...state.personalRecords,
            [canonicalKey]: { oneRM: Math.round(oneRM * 10) / 10, rpe },
          },
        }));
      },

      saveNewPRs: (newPRs) => {
        set((state) => {
          const merged = { ...state.personalRecords };
          for (const [key, incoming] of Object.entries(newPRs)) {
            if (!incoming) continue;
            const canonicalKey = normalizeExerciseKey(key);
            const existing = merged[canonicalKey] || merged[key];
            const shouldWrite =
              !existing ||
              incoming.oneRM > existing.oneRM ||
              (incoming.oneRM === existing.oneRM && incoming.rpe < existing.rpe);

            if (shouldWrite) {
              merged[canonicalKey] = incoming;
            }
          }
          return { personalRecords: merged };
        });
      },

      clearAllPRs: () => set({ personalRecords: {} }),
    }),
    {
      name: 'fitbuddy-pr-cache',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Reconciles personalRecords with historical sessions so that if any past workout
 * logged a higher 1RM, it is preserved and reflected in the lifter's PR records.
 */
export function syncPRsWithHistory(workoutHistory: any[]) {
  if (!workoutHistory || workoutHistory.length === 0) return;
  const prStore = usePRStore.getState();
  const candidatePRs: Record<string, PREntry> = {};

  for (const session of workoutHistory) {
    if (!session.exercises) continue;
    for (const ex of session.exercises) {
      const canonicalKey = normalizeExerciseKey(ex.exerciseId || ex.exerciseName);
      const e1rm = ex.bestEpley1RM || 0;
      if (e1rm > 0) {
        const currentBest =
          candidatePRs[canonicalKey]?.oneRM || prStore.personalRecords[canonicalKey]?.oneRM || 0;
        if (e1rm > currentBest) {
          candidatePRs[canonicalKey] = { oneRM: e1rm, rpe: 8 };
        }
      }
    }
  }

  if (Object.keys(candidatePRs).length > 0) {
    prStore.saveNewPRs(candidatePRs);
  }
}
