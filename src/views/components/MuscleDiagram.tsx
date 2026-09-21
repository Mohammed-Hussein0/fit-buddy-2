/**
 * MuscleDiagram — Powered by the official @musclemap/react & @musclemap/assets packages.
 * Uses strict anatomical kinesiology mapping:
 * - Primary muscles turn deep crimson red (score 100)
 * - Secondary muscles turn a lighter shade of red (score 45)
 * - Automatically renders the true anatomical perspective (FRONT vs BACK) so shoulders,
 *   deadlifts, chest, and arms are never obscured or misrepresented.
 */

import React, { useMemo } from 'react';
import { MuscleMap } from '@musclemap/react';
import type { MuscleMapValues, MuscleMapView, MuscleMapSex } from '@musclemap/core';
import { resolveExerciseAnatomy } from '../../models/types/ExerciseAnatomyMap';

type Props = {
  /** Exact exercise ID (e.g. 'overhead_press', 'deadlift', 'barbell_bench_press') */
  exerciseId?: string;
  /** Fallback muscle group name (e.g. 'Shoulders', 'Chest', 'Back') */
  muscleGroup?: string;
  /** Explicit view override if desired ('front' | 'back' | 'both') */
  view?: 'front' | 'back' | 'both';
  className?: string;
  size?: number;
  sex?: 'male' | 'female';
  showTooltip?: boolean;
};

export function MuscleDiagram({
  exerciseId,
  muscleGroup,
  view,
  className = '',
  size = 65,
  sex = 'male',
  showTooltip = false,
}: Props) {
  // Resolve exact anatomy mapping by exerciseId (or fallback to muscleGroup)
  const anatomy = useMemo(() => {
    return resolveExerciseAnatomy(exerciseId || muscleGroup);
  }, [exerciseId, muscleGroup]);

  // Construct values: Primary = 100 (deep red), Secondary = 45 (lighter red)
  const values = useMemo<MuscleMapValues>(() => {
    const map: MuscleMapValues = {};

    // 1. Primary movers (bold red)
    for (const grp of anatomy.primary) {
      map[grp] = { score: 100 };
    }

    // 2. Secondary synergists / stabilizers (lighter shade of red)
    for (const grp of anatomy.secondary) {
      // Don't overwrite if it's already a primary
      if (!map[grp]) {
        map[grp] = { score: 45 };
      }
    }

    return map;
  }, [anatomy]);

  // Perspective view: explicit prop wins, otherwise use anatomy's verified view
  const targetView: MuscleMapView = useMemo(() => {
    if (view === 'front') return 'FRONT';
    if (view === 'back') return 'BACK';
    if (view === 'both') return 'BOTH';
    return anatomy.view;
  }, [view, anatomy.view]);

  const targetSex: MuscleMapSex = sex === 'female' ? 'FEMALE' : 'MALE';

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      title={anatomy.label}
    >
      <MuscleMap
        values={values}
        sex={targetSex}
        view={targetView}
        monochromeColor="#dc2626"
        monochromeBaseColor="#fca5a5"
        glow={true}
        showLegend={false}
        figureWidth={size}
        tooltipFields={showTooltip ? ['group'] : []}
      />
    </div>
  );
}
