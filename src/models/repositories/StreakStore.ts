import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Formats a Date object to local calendar date string 'YYYY-MM-DD'.
 * Uses local timezone rather than UTC to ensure accurate midnight boundaries for the lifter.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the difference in full calendar days between two 'YYYY-MM-DD' dates.
 * Positive number means date2 is in the future relative to date1.
 */
export function getDaysDifference(date1Str: string, date2Str: string): number {
  const [y1, m1, d1] = date1Str.split('-').map(Number);
  const [y2, m2, d2] = date2Str.split('-').map(Number);
  const d1Obj = new Date(y1, m1 - 1, d1);
  const d2Obj = new Date(y2, m2 - 1, d2);
  const diffTime = d2Obj.getTime() - d1Obj.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export interface UserStreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string | null;
  history: string[]; // List of YYYY-MM-DD dates logged in
}

interface StreakStoreState {
  streaks: Record<string, UserStreakData>;

  /**
   * Records a daily login for the given user (or 'default').
   * If logged in yesterday: streak + 1.
   * If logged in today: streak preserved.
   * If missed 1+ days: streak reset to 1.
   * If first time: streak initialized to 1.
   */
  recordLogin: (userId?: string) => UserStreakData;

  /**
   * Retrieves the current streak data for a user.
   */
  getStreak: (userId?: string) => {
    currentStreak: number;
    longestStreak: number;
    lastLoginDate: string | null;
    isLoggedToday: boolean;
  };

  /**
   * Reset streak data for a specific user or all users.
   */
  resetStreak: (userId?: string) => void;
}

const DEFAULT_STREAK_RECORD: UserStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastLoginDate: null,
  history: [],
};

export const useStreakStore = create<StreakStoreState>()(
  persist(
    (set, get) => ({
      streaks: {},

      recordLogin: (userId = 'default') => {
        const targetId = userId || 'default';
        const today = getLocalDateString();
        const state = get();
        const existing = state.streaks[targetId] || { ...DEFAULT_STREAK_RECORD };

        let newStreak = existing.currentStreak;
        let newLongest = existing.longestStreak;

        if (!existing.lastLoginDate) {
          // First time ever logging in -> day 1 streak!
          newStreak = 1;
          newLongest = 1;
        } else {
          const diff = getDaysDifference(existing.lastLoginDate, today);

          if (diff === 0) {
            // Already logged in today -> maintain current streak
            newStreak = Math.max(1, existing.currentStreak);
          } else if (diff === 1) {
            // Consecutive day login -> increment streak!
            newStreak = existing.currentStreak + 1;
            newLongest = Math.max(existing.longestStreak, newStreak);
          } else if (diff > 1) {
            // Missed 1 or more days -> streak broken, restart at 1 today
            newStreak = 1;
          }
          // If diff < 0 (clock moved back), keep current streak
        }

        const updatedHistory = existing.history.includes(today)
          ? existing.history
          : [...existing.history, today];

        const updatedRecord: UserStreakData = {
          currentStreak: newStreak,
          longestStreak: Math.max(newLongest, newStreak),
          lastLoginDate: today,
          history: updatedHistory,
        };

        set((prev) => ({
          streaks: {
            ...prev.streaks,
            [targetId]: updatedRecord,
          },
        }));

        return updatedRecord;
      },

      getStreak: (userId = 'default') => {
        const targetId = userId || 'default';
        const state = get();
        const record = state.streaks[targetId];
        const today = getLocalDateString();

        if (!record || !record.lastLoginDate) {
          return {
            currentStreak: 0,
            longestStreak: 0,
            lastLoginDate: null,
            isLoggedToday: false,
          };
        }

        const diff = getDaysDifference(record.lastLoginDate, today);

        if (diff === 0) {
          return {
            currentStreak: record.currentStreak,
            longestStreak: record.longestStreak,
            lastLoginDate: record.lastLoginDate,
            isLoggedToday: true,
          };
        }

        if (diff === 1) {
          // Logged in yesterday; hasn't checked in yet today
          return {
            currentStreak: record.currentStreak,
            longestStreak: record.longestStreak,
            lastLoginDate: record.lastLoginDate,
            isLoggedToday: false,
          };
        }

        // More than 1 day elapsed without login
        return {
          currentStreak: 0,
          longestStreak: record.longestStreak,
          lastLoginDate: record.lastLoginDate,
          isLoggedToday: false,
        };
      },

      resetStreak: (userId) => {
        if (userId) {
          set((prev) => {
            const next = { ...prev.streaks };
            delete next[userId];
            return { streaks: next };
          });
        } else {
          set({ streaks: {} });
        }
      },
    }),
    {
      name: 'fitbuddy-streak-storage-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
