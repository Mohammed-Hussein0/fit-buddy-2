import { useState, useMemo, useCallback, useEffect } from 'react';
import { useWorkoutStore } from '../models/repositories/WorkoutStore';
import { usePRStore, syncPRsWithHistory } from '../models/repositories/PRStore';
import { Workout, WorkoutExercise } from '../models/types/Workout';
import { WorkoutSession } from '../models/types/WorkoutHistory';
import { EXERCISE_IMAGES, ExerciseId, normalizeExerciseKey } from '../models/types/Exercise';
import { PREntry } from '../models/types/PersonalRecord';
import { calculateEpley1RM } from '../models/services/StrengthEngine';
import { ApiClient } from '../models/services/ApiClient';

export interface WeekDayCalendarItem {
  date: Date;
  dateStr: string;
  dateNum: number;
  dayName: string;
  shortDay: string;
  dayOfWeek: number;
  isToday: boolean;
  workout?: Workout;
  isCompleted: boolean;
}

export function useWorkoutController() {
  const programs = useWorkoutStore((s) => s.programs);
  const activeProgramId = useWorkoutStore((s) => s.activeProgramId);
  const getActiveProgram = useWorkoutStore((s) => s.getActiveProgram);
  const getActiveWorkouts = useWorkoutStore((s) => s.getActiveWorkouts);
  const switchProgram = useWorkoutStore((s) => s.switchProgram);
  const createProgram = useWorkoutStore((s) => s.createProgram);
  const deleteProgram = useWorkoutStore((s) => s.deleteProgram);
  const updateWorkoutSchedule = useWorkoutStore((s) => s.updateWorkoutSchedule);
  const updateProgramSchedule = useWorkoutStore((s) => s.updateProgramSchedule);

  const activeExerciseMap = useWorkoutStore((s) => s.activeExerciseMap);
  const lastSessionMap = useWorkoutStore((s) => s.lastSession);
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const updateWorkoutExercises = useWorkoutStore((s) => s.updateWorkoutExercises);
  const recordSession = useWorkoutStore((s) => s.recordSession);

  const personalRecords = usePRStore((s) => s.personalRecords);
  const checkIfNewPR = usePRStore((s) => s.checkIfNewPR);
  const saveNewPRs = usePRStore((s) => s.saveNewPRs);

  const activeProgram = getActiveProgram();
  const activeWorkouts = getActiveWorkouts();

  // Reconcile PR records with workout history on load
  useEffect(() => {
    if (workoutHistory && workoutHistory.length > 0) {
      syncPRsWithHistory(workoutHistory);
    }
  }, [workoutHistory]);

  // Convert JS getDay() (0=Sun) to the 1=Mon…7=Sun convention used in dayOfWeek
  const getTodayDow = () => {
    const js = new Date().getDay(); // 0=Sun,1=Mon,...,6=Sat
    return js === 0 ? 7 : js;      // 7=Sun,1=Mon,...,6=Sat
  };

  // Find the workout for today, or fall back to the first workout
  const findTodayWorkout = useCallback((workouts: Workout[]) => {
    const todayDow = getTodayDow();
    return workouts.find((w) => w.dayOfWeek === todayDow || (todayDow === 7 && w.dayOfWeek === 0)) ?? workouts[0];
  }, []);

  // Selected workout ID within active program — defaults to today's day
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>(() => {
    return findTodayWorkout(activeWorkouts)?.id || activeWorkouts[0]?.id || 'ppl-push1';
  });

  // Session reflection note
  const [sessionNote, setSessionNote] = useState<string>('');
  const [isCloudSynced, setIsCloudSynced] = useState<boolean | null>(null);

  // When activeProgram changes, prioritize selecting today's scheduled workout
  useEffect(() => {
    if (activeWorkouts.length > 0) {
      const todayW = findTodayWorkout(activeWorkouts);
      if (todayW) {
        setSelectedWorkoutId(todayW.id);
        setWorkingExercises(activeExerciseMap[todayW.id] || []);
      }
    }
  }, [activeProgramId]);

  // If selectedWorkoutId no longer exists in active workouts, fall back to today's workout
  useEffect(() => {
    if (activeWorkouts.length > 0 && !activeWorkouts.some((w) => w.id === selectedWorkoutId)) {
      const todayW = findTodayWorkout(activeWorkouts);
      if (todayW) {
        setSelectedWorkoutId(todayW.id);
        setWorkingExercises(activeExerciseMap[todayW.id] || []);
      }
    }
  }, [activeWorkouts, selectedWorkoutId, activeExerciseMap, findTodayWorkout]);

  // Weekly calendar bar items for current calendar week (Sunday to Saturday)
  const weekCalendarDays = useMemo<WeekDayCalendarItem[]>(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sunday
    const sunDiff = now.getDate() - currentDay;
    const sunday = new Date(now);
    sunday.setDate(sunDiff);

    const days: WeekDayCalendarItem[] = [];
    const shortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const historyDates = new Set(
      workoutHistory.map((h) => new Date(h.date).toDateString())
    );

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const jsDay = d.getDay();
      const dow = jsDay === 0 ? 7 : jsDay;
      const isToday = d.toDateString() === now.toDateString();
      const matchedWorkout = activeWorkouts.find(
        (w) => w.dayOfWeek === dow || (dow === 7 && w.dayOfWeek === 0)
      );
      const isCompleted = historyDates.has(d.toDateString());

      days.push({
        date: d,
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateNum: d.getDate(),
        dayName: fullNames[jsDay],
        shortDay: shortNames[jsDay],
        dayOfWeek: dow,
        isToday,
        workout: matchedWorkout,
        isCompleted,
      });
    }
    return days;
  }, [activeWorkouts, workoutHistory]);

  // Working copy of exercises
  const currentExercises = useMemo(() => {
    return activeExerciseMap[selectedWorkoutId] || [];
  }, [activeExerciseMap, selectedWorkoutId]);

  const [workingExercises, setWorkingExercises] = useState<WorkoutExercise[]>(currentExercises);
  const [committedSessionPRs, setCommittedSessionPRs] = useState<Record<string, PREntry>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [loggedSessionSummary, setLoggedSessionSummary] = useState<WorkoutSession | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  // Dynamically derive current session PRs from the highest 1RM achieved across all sets of each exercise
  const activeSessionPRs = useMemo(() => {
    const prs: Record<string, PREntry> = {};

    for (const ex of workingExercises) {
      const canonicalKey = normalizeExerciseKey(ex.name);
      const stored = personalRecords[canonicalKey] || personalRecords[ex.name];
      const stored1RM = stored?.oneRM || 0;
      const storedRpe = stored?.rpe || 10;

      let peak1RM = 0;
      let peakRpe = 0;

      for (const set of ex.sets) {
        const w = parseFloat(set.weight) || 0;
        const r = parseInt(set.reps, 10) || 0;
        if (w > 0 && r > 0) {
          const e1rm = calculateEpley1RM(w, r);
          const rpe = set.rpe || 0;

          // The highest 1RM across all sets is the candidate PR.
          // If equal 1RM, prioritize lower RPE (less perceived effort).
          if (e1rm > peak1RM) {
            peak1RM = e1rm;
            peakRpe = rpe;
          } else if (e1rm === peak1RM && rpe > 0 && (peakRpe === 0 || rpe < peakRpe)) {
            peakRpe = rpe;
          }
        }
      }

      if (peak1RM > 0) {
        const isNewPR =
          !stored ||
          peak1RM > stored1RM ||
          (peak1RM === stored1RM && peakRpe > 0 && storedRpe > 0 && peakRpe < storedRpe);

        if (isNewPR) {
          prs[canonicalKey] = { oneRM: peak1RM, rpe: peakRpe };
        }
      }
    }

    return prs;
  }, [workingExercises, personalRecords]);

  // While modal is open, use the snapshot captured at finish; otherwise use reactive active PRs
  const sessionPRs = completionModalOpen ? committedSessionPRs : activeSessionPRs;

  // Sync working exercises when selectedWorkoutId changes
  const handleSelectWorkout = useCallback((workoutId: string) => {
    setSelectedWorkoutId(workoutId);
    setWorkingExercises(activeExerciseMap[workoutId] || []);
    setSaveSuccess(false);
    setSessionNote('');
    setIsCloudSynced(null);
  }, [activeExerciseMap]);

  const selectedWorkout = useMemo(() => {
    return activeWorkouts.find((w) => w.id === selectedWorkoutId) || activeWorkouts[0];
  }, [activeWorkouts, selectedWorkoutId]);

  const lastSession = useMemo(() => {
    return lastSessionMap[selectedWorkoutId] || [];
  }, [lastSessionMap, selectedWorkoutId]);

  // Exercise manipulation
  const handleAddExercise = useCallback((exerciseId: ExerciseId, muscleGroup: string) => {
    const newEx: WorkoutExercise = {
      id: `ex-${Date.now()}`,
      name: exerciseId,
      muscleGroup,
      imageUrl: EXERCISE_IMAGES[exerciseId] || '',
      sets: [
        { id: `s-${Date.now()}-1`, weight: '', reps: '', rpe: 0 },
        { id: `s-${Date.now()}-2`, weight: '', reps: '', rpe: 0 },
        { id: `s-${Date.now()}-3`, weight: '', reps: '', rpe: 0 },
      ],
    };
    setWorkingExercises((prev) => [...prev, newEx]);
  }, []);

  const handleDeleteExercise = useCallback((exerciseId: string) => {
    setWorkingExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  }, []);

  // Set manipulation
  const handleAddSet = useCallback((exerciseId: string) => {
    setWorkingExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        if (ex.sets.length >= 10) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet = {
          id: `set-${Date.now()}-${ex.sets.length + 1}`,
          weight: lastSet ? lastSet.weight : '',
          reps: lastSet ? lastSet.reps : '',
          rpe: 0,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  }, []);

  const handleDeleteSet = useCallback((exerciseId: string, setId: string) => {
    setWorkingExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        if (ex.sets.length <= 1) return ex;
        return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
      })
    );
  }, []);

  const handleUpdateSet = useCallback((
    exerciseId: string,
    setId: string,
    field: 'reps' | 'weight',
    value: string
  ) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setWorkingExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            return { ...s, [field]: sanitized };
          }),
        };
      })
    );
  }, []);

  const handleUpdateSetRpe = useCallback((exerciseId: string, setId: string, rpe: number) => {
    setWorkingExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            return { ...s, rpe };
          }),
        };
      })
    );
  }, []);

  // Quick Autofill from previous logged session
  const fillFromPreviousSession = useCallback(() => {
    const ghostExercises = lastSessionMap[selectedWorkoutId] || [];
    if (ghostExercises.length === 0) {
      setCommitError('No previous session logs found for this workout day.');
      setTimeout(() => setCommitError(null), 4000);
      return;
    }

    setWorkingExercises((prev) =>
      prev.map((ex) => {
        const ghostEx = ghostExercises.find((g) => g.name === ex.name);
        if (!ghostEx || !ghostEx.sets || ghostEx.sets.length === 0) return ex;

        return {
          ...ex,
          sets: ex.sets.map((s, idx) => {
            const ghostSet = ghostEx.sets[idx] || ghostEx.sets[ghostEx.sets.length - 1];
            return {
              ...s,
              weight: ghostSet?.weight || s.weight,
              reps: ghostSet?.reps || s.reps,
              rpe: ghostSet?.rpe || s.rpe,
            };
          }),
        };
      })
    );
  }, [lastSessionMap, selectedWorkoutId]);

  // Commit workout session
  const handleCommitWorkout = useCallback(async () => {
    setCommitError(null);

    // Check if there are any completed sets with valid weight and reps
    const hasValidSets = workingExercises.some((ex) =>
      ex.sets.some((s) => parseFloat(s.weight) > 0 && parseInt(s.reps, 10) > 0)
    );

    if (!hasValidSets) {
      setCommitError('Please enter weight and reps for at least one set (or click "Autofill Previous") before finishing.');
      setTimeout(() => setCommitError(null), 5000);
      return false;
    }

    // Save personal records based on the true maximum 1RM across all sets in this session
    const prsToCommit = { ...activeSessionPRs };
    setCommittedSessionPRs(prsToCommit);

    if (Object.keys(prsToCommit).length > 0) {
      saveNewPRs(prsToCommit);
    }

    updateWorkoutExercises(selectedWorkoutId, workingExercises);
    const recorded = recordSession(selectedWorkoutId, selectedWorkout?.title || 'Workout', workingExercises);

    if (!recorded) {
      setCommitError('Failed to record session. Please check that entered weights and reps are valid numbers.');
      setTimeout(() => setCommitError(null), 5000);
      return false;
    }

    setSaveSuccess(true);
    setLoggedSessionSummary(recorded);
    setCompletionModalOpen(true);

    // Attempt cloud sync to backend
    const today = new Date().toISOString().split('T')[0];
    try {
      if (sessionNote.trim()) {
        await ApiClient.createWorkoutNote({
          logged_date: today,
          note: sessionNote.trim(),
        });
      }
      setIsCloudSynced(true);
    } catch {
      setIsCloudSynced(false); // Saved locally, backend offline
    }

    // Reset working exercises inputs so they reflect as clean ghost placeholders for the next session
    setWorkingExercises((prev) =>
      prev.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s) => ({ ...s, weight: '', reps: '' })),
      }))
    );
    setSessionNote('');

    setTimeout(() => setSaveSuccess(false), 4000);
    return true;
  }, [
    workingExercises,
    activeSessionPRs,
    saveNewPRs,
    updateWorkoutExercises,
    recordSession,
    selectedWorkoutId,
    selectedWorkout?.title,
    sessionNote,
  ]);

  return {
    programs,
    activeProgram,
    activeProgramId,
    activeWorkouts,
    todayDow: getTodayDow(),
    selectedWorkoutId,
    selectedWorkout,
    workingExercises,
    lastSession,
    personalRecords,
    sessionPRs,
    saveSuccess,
    completionModalOpen,
    setCompletionModalOpen,
    loggedSessionSummary,
    commitError,
    fillFromPreviousSession,
    sessionNote,
    setSessionNote,
    isCloudSynced,
    weekCalendarDays,
    updateWorkoutSchedule,
    updateProgramSchedule,
    switchProgram,
    createProgram,
    deleteProgram,
    selectWorkout: handleSelectWorkout,
    addExercise: handleAddExercise,
    deleteExercise: handleDeleteExercise,
    addSet: handleAddSet,
    deleteSet: handleDeleteSet,
    updateSet: handleUpdateSet,
    updateSetRpe: handleUpdateSetRpe,
    commitWorkout: handleCommitWorkout,
  };
}
