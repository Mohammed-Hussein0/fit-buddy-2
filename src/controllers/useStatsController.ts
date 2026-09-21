import { useState, useMemo, useCallback } from 'react';
import { useWorkoutStore } from '../models/repositories/WorkoutStore';
import { usePRStore } from '../models/repositories/PRStore';
import { useProfileController } from './useProfileController';
import { computeVolumeSummary } from '../models/services/VolumeService';
import {
  getTop5Exercises,
  getTier,
  getTierThresholds,
  getAllometricScore,
  getStrengthGainPct,
  calculateLifterPercentile,
  LifterStrengthAnalysis,
} from '../models/services/StrengthEngine';
import {
  COMPOUND_EXERCISES,
  EXERCISE_LIBRARY,
  EXERCISE_LABELS,
  ExerciseId,
  LibraryExercise,
} from '../models/types/Exercise';

export function useStatsController(userId?: string) {
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const recordBenchmarkSession = useWorkoutStore((s) => s.recordBenchmarkSession);
  const personalRecords = usePRStore((s) => s.personalRecords);
  const set1RMInStore = usePRStore((s) => s.set1RM);
  const { profile } = useProfileController(userId);

  const [selectedExerciseId, setSelectedExerciseId] = useState<ExerciseId | null>(null);
  const [showAllExercises, setShowAllExercises] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('All');
  const [patternFilter, setPatternFilter] = useState('All Patterns');
  const [mechanicsFilter, setMechanicsFilter] = useState<'All' | 'Compound' | 'Isolation'>('All');
  const [onlyLoggedFilter, setOnlyLoggedFilter] = useState(false);

  const bw = parseFloat(profile.currentWeight) || 78.5;
  const age = parseInt(profile.age, 10) || 25;
  const gender = profile.gender;

  // 1. Weekly Volume distribution
  const volumeSummary = useMemo(() => {
    return computeVolumeSummary(workoutHistory, 8);
  }, [workoutHistory]);

  // 2. Frequency count per exercise
  const sessionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of workoutHistory) {
      for (const e of s.exercises) {
        counts[e.exerciseId] = (counts[e.exerciseId] ?? 0) + 1;
      }
    }
    return counts;
  }, [workoutHistory]);

  // 3. Top 5 exercises by canonical movement pattern
  const top5ExerciseIds = useMemo(() => {
    return getTop5Exercises(personalRecords, sessionCounts);
  }, [personalRecords, sessionCounts]);

  // 4. All exercises with logged history or PRs
  const allExercisesWithData = useMemo(() => {
    const seen = new Set<ExerciseId>();
    const result: ExerciseId[] = [];

    for (const key of Object.keys(personalRecords) as ExerciseId[]) {
      if ((personalRecords[key]?.oneRM ?? 0) > 0) {
        seen.add(key);
        result.push(key);
      }
    }

    for (const s of workoutHistory) {
      for (const e of s.exercises) {
        const id = e.exerciseId as ExerciseId;
        if (!seen.has(id)) {
          seen.add(id);
          result.push(id);
        }
      }
    }

    return [
      ...result.filter((id) => COMPOUND_EXERCISES.has(id)),
      ...result.filter((id) => !COMPOUND_EXERCISES.has(id)),
    ];
  }, [personalRecords, workoutHistory]);

  // 5. Complete Library of all 44 exercises with multi-dimensional filtering
  const filteredLibraryExercises = useMemo(() => {
    return EXERCISE_LIBRARY.filter((ex) => {
      const label = EXERCISE_LABELS[ex.idKey] || ex.idKey;
      const matchesGroup = muscleGroupFilter === 'All' || ex.muscleGroup === muscleGroupFilter;
      const matchesPattern = patternFilter === 'All Patterns' || ex.movementPattern.toLowerCase().includes(patternFilter.toLowerCase());
      const matchesMechanics = mechanicsFilter === 'All' || ex.mechanics === mechanicsFilter;
      const hasData = (sessionCounts[ex.idKey] || 0) > 0 || (personalRecords[ex.idKey]?.oneRM || 0) > 0;
      const matchesOnlyLogged = !onlyLoggedFilter || hasData;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        label.toLowerCase().includes(q) ||
        ex.primaryMuscle.toLowerCase().includes(q) ||
        ex.secondaryMuscles.some((m) => m.toLowerCase().includes(q)) ||
        ex.movementPattern.toLowerCase().includes(q);

      return matchesGroup && matchesPattern && matchesMechanics && matchesOnlyLogged && matchesSearch;
    }).sort((a, b) => {
      const aHasData = (sessionCounts[a.idKey] || 0) > 0 || (personalRecords[a.idKey]?.oneRM || 0) > 0;
      const bHasData = (sessionCounts[b.idKey] || 0) > 0 || (personalRecords[b.idKey]?.oneRM || 0) > 0;
      if (aHasData && !bHasData) return -1;
      if (!aHasData && bHasData) return 1;
      return (sessionCounts[b.idKey] || 0) - (sessionCounts[a.idKey] || 0);
    });
  }, [
    muscleGroupFilter,
    patternFilter,
    mechanicsFilter,
    onlyLoggedFilter,
    searchQuery,
    sessionCounts,
    personalRecords,
  ]);

  // Exercise time-series history getter
  const getExerciseHistory = useCallback((exerciseId: string) => {
    const history = [];
    for (const s of workoutHistory) {
      const found = s.exercises.find((e) => e.exerciseId === exerciseId);
      if (found) {
        history.push({
          date: s.date,
          workoutTitle: s.workoutTitle,
          ...found,
        });
      }
    }
    return history;
  }, [workoutHistory]);

  // Helper for computing exercise stats and demographic analysis
  const getExerciseStats = useCallback((exerciseId: string) => {
    const history = getExerciseHistory(exerciseId);
    const pr = personalRecords[exerciseId];
    const latest1RM = pr?.oneRM ?? (history[0]?.bestEpley1RM || 0);

    const analysis: LifterStrengthAnalysis = calculateLifterPercentile(exerciseId, latest1RM, bw, gender, age);
    const tier = analysis.tier;
    const thresholds = getTierThresholds(exerciseId, bw, gender, age);
    const allometricScore = getAllometricScore(latest1RM, bw);
    const gainPct = getStrengthGainPct(history);
    const sessionCount = sessionCounts[exerciseId] || 0;

    return {
      latest1RM,
      tier,
      thresholds,
      allometricScore,
      gainPct,
      sessionCount,
      history,
      analysis,
    };
  }, [getExerciseHistory, personalRecords, bw, gender, age, sessionCounts]);

  // Fetch full details of an exercise from library
  const getExerciseDetails = useCallback((exerciseId: string): LibraryExercise | undefined => {
    return EXERCISE_LIBRARY.find((ex) => ex.idKey === exerciseId);
  }, []);

  // Set or update a 1RM directly
  const update1RM = useCallback((exerciseId: string, oneRM: number, rpe?: number) => {
    set1RMInStore(exerciseId, oneRM, rpe);
    recordBenchmarkSession(exerciseId, oneRM, rpe);
  }, [set1RMInStore, recordBenchmarkSession]);

  return {
    volumeSummary,
    top5ExerciseIds,
    allExercisesWithData,
    filteredLibraryExercises,
    showAllExercises,
    selectedExerciseId,
    searchQuery,
    muscleGroupFilter,
    patternFilter,
    mechanicsFilter,
    onlyLoggedFilter,
    profile,
    setSearchQuery,
    setMuscleGroupFilter,
    setPatternFilter,
    setMechanicsFilter,
    setOnlyLoggedFilter,
    setShowAllExercises,
    openExerciseHistory: setSelectedExerciseId,
    closeExerciseHistory: () => setSelectedExerciseId(null),
    getExerciseStats,
    getExerciseDetails,
    update1RM,
  };
}
