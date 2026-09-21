/**
 * Standardized Muscle Constants for Fit Buddy (Web & Backend compatible)
 */

import type { MuscleGroup as CoreMuscleGroup } from '@musclemap/core';

// Granular anatomical target muscles matching kinesiology and @musclemap/core
export const TARGET_MUSCLES = {
  CHEST: 'CHEST',
  SHOULDERS_FRONT: 'SHOULDERS_FRONT',
  SHOULDERS_SIDE: 'SHOULDERS_SIDE',
  SHOULDERS_REAR: 'SHOULDERS_REAR',
  LATS: 'LATS',
  BACK_UPPER: 'BACK_UPPER',
  BACK_LOWER: 'BACK_LOWER',
  TRAPEZIUS: 'TRAPEZIUS',
  RHOMBOIDS: 'RHOMBOIDS',
  BICEPS: 'BICEPS',
  TRICEPS: 'TRICEPS',
  FOREARMS: 'FOREARMS',
  QUADS: 'QUADS',
  HAMSTRINGS: 'HAMSTRINGS',
  GLUTES: 'GLUTES',
  CALVES: 'CALVES',
  CORE: 'CORE',
  OBLIQUES: 'OBLIQUES',
} as const;

export type TargetMuscleId = typeof TARGET_MUSCLES[keyof typeof TARGET_MUSCLES];

// Broad muscle groups used for workout splits and high-level filters
export const MUSCLE_GROUPS = {
  CHEST: 'chest',
  BACK: 'back',
  SHOULDERS: 'shoulders',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  LEGS: 'legs',
  GLUTES: 'glutes',
  CALVES: 'calves',
  CORE: 'core',
  FOREARMS: 'forearms',
} as const;

export type MuscleGroupId = typeof MUSCLE_GROUPS[keyof typeof MUSCLE_GROUPS];

// Single standardized clean display name for each target muscle
export const TARGET_MUSCLE_LABELS: Record<TargetMuscleId, string> = {
  [TARGET_MUSCLES.CHEST]: 'Chest',
  [TARGET_MUSCLES.SHOULDERS_FRONT]: 'Front Delts',
  [TARGET_MUSCLES.SHOULDERS_SIDE]: 'Side Delts',
  [TARGET_MUSCLES.SHOULDERS_REAR]: 'Rear Delts',
  [TARGET_MUSCLES.LATS]: 'Lats',
  [TARGET_MUSCLES.BACK_UPPER]: 'Upper Back',
  [TARGET_MUSCLES.BACK_LOWER]: 'Lower Back',
  [TARGET_MUSCLES.TRAPEZIUS]: 'Traps',
  [TARGET_MUSCLES.RHOMBOIDS]: 'Rhomboids',
  [TARGET_MUSCLES.BICEPS]: 'Biceps',
  [TARGET_MUSCLES.TRICEPS]: 'Triceps',
  [TARGET_MUSCLES.FOREARMS]: 'Forearms',
  [TARGET_MUSCLES.QUADS]: 'Quads',
  [TARGET_MUSCLES.HAMSTRINGS]: 'Hamstrings',
  [TARGET_MUSCLES.GLUTES]: 'Glutes',
  [TARGET_MUSCLES.CALVES]: 'Calves',
  [TARGET_MUSCLES.CORE]: 'Core',
  [TARGET_MUSCLES.OBLIQUES]: 'Obliques',
};

// Broad muscle group labels
export const MUSCLE_GROUP_LABELS: Record<MuscleGroupId, string> = {
  [MUSCLE_GROUPS.CHEST]: 'Chest',
  [MUSCLE_GROUPS.BACK]: 'Back',
  [MUSCLE_GROUPS.SHOULDERS]: 'Shoulders',
  [MUSCLE_GROUPS.BICEPS]: 'Biceps',
  [MUSCLE_GROUPS.TRICEPS]: 'Triceps',
  [MUSCLE_GROUPS.LEGS]: 'Legs',
  [MUSCLE_GROUPS.GLUTES]: 'Glutes',
  [MUSCLE_GROUPS.CALVES]: 'Calves',
  [MUSCLE_GROUPS.CORE]: 'Core',
  [MUSCLE_GROUPS.FOREARMS]: 'Forearms',
};
