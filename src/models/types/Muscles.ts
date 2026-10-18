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

export interface SessionMusclesAnalysis {
  displayMuscles: string[]; // High-level clean labels for UI e.g. ["Chest", "Deltoids", "Triceps"]
  detailedTargets: string[]; // Granular targets e.g. ["Chest", "Front Delts", "Side Delts", "Triceps"]
  muscleKeys: string[]; // Lowercase keys for backend/adaptation engine e.g. ["chest", "deltoids", "shoulders", ...]
}

/**
 * Analyzes a session's exercises and computes the exact muscles hit.
 * Differentiates primary movers from secondary synergists.
 */
export function getSessionMusclesHit(exercises: { name: string; muscleGroup?: string }[]): SessionMusclesAnalysis {
  if (!exercises || exercises.length === 0) {
    return { displayMuscles: [], detailedTargets: [], muscleKeys: [] };
  }

  const primaryTargets = new Set<string>();
  const secondaryTargets = new Set<string>();
  const allKeys = new Set<string>();

  // Dynamic import avoidance: inline canonical mapping logic
  for (const ex of exercises) {
    const rawName = (ex.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const mgLower = (ex.muscleGroup || '').toLowerCase();

    // Check exercise specifics
    if (rawName.includes('bench_press') || rawName.includes('chest_fly') || rawName.includes('pushup') || rawName.includes('crossover') || rawName.includes('pec_deck')) {
      primaryTargets.add('CHEST');
      if (rawName.includes('incline')) {
        primaryTargets.add('SHOULDERS_FRONT');
      } else {
        secondaryTargets.add('SHOULDERS_FRONT');
      }
      secondaryTargets.add('TRICEPS');
    } else if (rawName.includes('dips')) {
      primaryTargets.add('CHEST');
      primaryTargets.add('TRICEPS');
      secondaryTargets.add('SHOULDERS_FRONT');
    } else if (rawName.includes('shoulder_press') || rawName.includes('overhead_press') || rawName.includes('military_press') || rawName.includes('arnold_press')) {
      primaryTargets.add('SHOULDERS_FRONT');
      primaryTargets.add('SHOULDERS_SIDE');
      secondaryTargets.add('TRICEPS');
    } else if (rawName.includes('lateral_raise')) {
      primaryTargets.add('SHOULDERS_SIDE');
    } else if (rawName.includes('rear_delt') || rawName.includes('face_pull') || rawName.includes('reverse_fly')) {
      primaryTargets.add('SHOULDERS_REAR');
      primaryTargets.add('BACK_UPPER');
    } else if (rawName.includes('shrug')) {
      primaryTargets.add('TRAPEZIUS');
    } else if (rawName.includes('row') || rawName.includes('pulldown') || rawName.includes('pullup') || rawName.includes('chin_up')) {
      if (rawName.includes('pulldown') || rawName.includes('pullup') || rawName.includes('chin_up') || rawName.includes('lat_')) {
        primaryTargets.add('LATS');
      } else {
        primaryTargets.add('BACK_UPPER');
        primaryTargets.add('LATS');
      }
      secondaryTargets.add('BICEPS');
    } else if (rawName.includes('deadlift')) {
      if (rawName.includes('romanian') || rawName.includes('rdl') || rawName.includes('stiff')) {
        primaryTargets.add('HAMSTRINGS');
        primaryTargets.add('GLUTES');
      } else {
        primaryTargets.add('BACK_LOWER');
        primaryTargets.add('GLUTES');
        primaryTargets.add('HAMSTRINGS');
      }
    } else if (rawName.includes('curl')) {
      primaryTargets.add('BICEPS');
    } else if (rawName.includes('pushdown') || rawName.includes('tricep') || rawName.includes('skull_crusher') || rawName.includes('extension')) {
      primaryTargets.add('TRICEPS');
    } else if (rawName.includes('squat') || rawName.includes('leg_press') || rawName.includes('leg_extension') || rawName.includes('lunge')) {
      primaryTargets.add('QUADS');
      if (!rawName.includes('extension')) {
        primaryTargets.add('GLUTES');
        secondaryTargets.add('HAMSTRINGS');
      }
    } else if (rawName.includes('leg_curl')) {
      primaryTargets.add('HAMSTRINGS');
    } else if (rawName.includes('hip_thrust') || rawName.includes('glute_bridge')) {
      primaryTargets.add('GLUTES');
      secondaryTargets.add('HAMSTRINGS');
    } else if (rawName.includes('calf_raise') || rawName.includes('calves')) {
      primaryTargets.add('CALVES');
    } else if (rawName.includes('crunch') || rawName.includes('plank') || rawName.includes('leg_raise') || rawName.includes('ab_')) {
      primaryTargets.add('CORE');
    } else {
      // Fallback to muscleGroup attribute
      if (mgLower.includes('chest')) primaryTargets.add('CHEST');
      else if (mgLower.includes('shoulder') || mgLower.includes('delt')) primaryTargets.add('SHOULDERS_FRONT');
      else if (mgLower.includes('back') || mgLower.includes('lat')) primaryTargets.add('LATS');
      else if (mgLower.includes('bicep')) primaryTargets.add('BICEPS');
      else if (mgLower.includes('tricep')) primaryTargets.add('TRICEPS');
      else if (mgLower.includes('leg') || mgLower.includes('quad')) primaryTargets.add('QUADS');
      else if (mgLower.includes('hamstring')) primaryTargets.add('HAMSTRINGS');
      else if (mgLower.includes('glute')) primaryTargets.add('GLUTES');
      else if (mgLower.includes('calf') || mgLower.includes('calves')) primaryTargets.add('CALVES');
      else if (mgLower.includes('core') || mgLower.includes('abs')) primaryTargets.add('CORE');
    }
  }

  // Build clean display groups
  const displaySet = new Set<string>();
  const detailedSet = new Set<string>();

  // Chest
  if (primaryTargets.has('CHEST') || secondaryTargets.has('CHEST')) {
    displaySet.add('Chest');
    detailedSet.add('Chest');
    allKeys.add('chest');
    allKeys.add('upper_chest');
    allKeys.add('lower_chest');
  }

  // Deltoids
  const hasFrontDelts = primaryTargets.has('SHOULDERS_FRONT') || secondaryTargets.has('SHOULDERS_FRONT');
  const hasSideDelts = primaryTargets.has('SHOULDERS_SIDE') || secondaryTargets.has('SHOULDERS_SIDE');
  const hasRearDelts = primaryTargets.has('SHOULDERS_REAR') || secondaryTargets.has('SHOULDERS_REAR');
  if (hasFrontDelts || hasSideDelts || hasRearDelts) {
    displaySet.add('Deltoids');
    allKeys.add('deltoids');
    allKeys.add('shoulders');
    if (hasFrontDelts) {
      detailedSet.add('Front Delts');
      allKeys.add('front_delts');
      allKeys.add('shoulders_front');
    }
    if (hasSideDelts) {
      detailedSet.add('Side Delts');
      allKeys.add('side_delts');
      allKeys.add('shoulders_side');
    }
    if (hasRearDelts) {
      detailedSet.add('Rear Delts');
      allKeys.add('rear_delts');
      allKeys.add('shoulders_rear');
    }
  }

  // Triceps
  if (primaryTargets.has('TRICEPS') || secondaryTargets.has('TRICEPS')) {
    displaySet.add('Triceps');
    detailedSet.add('Triceps');
    allKeys.add('triceps');
    allKeys.add('arms');
  }

  // Back / Lats
  const hasLats = primaryTargets.has('LATS') || secondaryTargets.has('LATS');
  const hasUpperBack = primaryTargets.has('BACK_UPPER') || secondaryTargets.has('BACK_UPPER');
  const hasTraps = primaryTargets.has('TRAPEZIUS') && !hasFrontDelts;
  if (hasLats || hasUpperBack || (hasTraps && !primaryTargets.has('CHEST'))) {
    displaySet.add('Back');
    allKeys.add('back');
    if (hasLats) {
      detailedSet.add('Lats');
      allKeys.add('lats');
    }
    if (hasUpperBack) {
      detailedSet.add('Upper Back');
      allKeys.add('upper_back');
      allKeys.add('mid_back');
    }
    if (hasTraps) {
      detailedSet.add('Traps');
      allKeys.add('traps');
    }
  }

  // Biceps
  if (primaryTargets.has('BICEPS') || secondaryTargets.has('BICEPS')) {
    displaySet.add('Biceps');
    detailedSet.add('Biceps');
    allKeys.add('biceps');
    allKeys.add('arms');
  }

  // Quads
  if (primaryTargets.has('QUADS') || secondaryTargets.has('QUADS')) {
    displaySet.add('Quads');
    detailedSet.add('Quads');
    allKeys.add('quads');
    allKeys.add('legs');
  }

  // Hamstrings
  if (primaryTargets.has('HAMSTRINGS') || secondaryTargets.has('HAMSTRINGS')) {
    displaySet.add('Hamstrings');
    detailedSet.add('Hamstrings');
    allKeys.add('hamstrings');
    allKeys.add('legs');
  }

  // Glutes
  if (primaryTargets.has('GLUTES') || secondaryTargets.has('GLUTES')) {
    displaySet.add('Glutes');
    detailedSet.add('Glutes');
    allKeys.add('glutes');
    allKeys.add('legs');
  }

  // Calves
  if (primaryTargets.has('CALVES') || secondaryTargets.has('CALVES')) {
    displaySet.add('Calves');
    detailedSet.add('Calves');
    allKeys.add('calves');
    allKeys.add('legs');
  }

  // Core
  if (primaryTargets.has('CORE')) {
    displaySet.add('Core');
    detailedSet.add('Core');
    allKeys.add('abs');
    allKeys.add('core');
  }

  const order = ['Chest', 'Deltoids', 'Triceps', 'Back', 'Biceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];
  const sortedDisplay = Array.from(displaySet).sort((a, b) => {
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  return {
    displayMuscles: sortedDisplay,
    detailedTargets: Array.from(detailedSet),
    muscleKeys: Array.from(allKeys),
  };
}
