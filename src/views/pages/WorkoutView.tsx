import { useState, useMemo } from 'react';
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { RoutineManagerModal } from '../components/RoutineManagerModal';
import { WorkoutCompletionModal } from '../components/WorkoutCompletionModal';
import { useWorkoutController } from '../../controllers/useWorkoutController';
import { getSessionMusclesHit } from '../../models/types/Muscles';

import { WorkoutRoutineBanner } from '../components/workout/WorkoutRoutineBanner';
import { WorkoutWeeklySchedule } from '../components/workout/WorkoutWeeklySchedule';
import { WorkoutSessionHeader } from '../components/workout/WorkoutSessionHeader';
import { ExerciseCardList } from '../components/workout/ExerciseCardList';
import { WorkoutSessionFooter } from '../components/workout/WorkoutSessionFooter';

interface WorkoutViewProps {
  onNavigateTab?: (tab: 'profile' | 'workout' | 'exercises' | 'stats' | 'advice') => void;
}

export function WorkoutView({ onNavigateTab }: WorkoutViewProps = {}) {
  const {
    programs,
    activeProgram,
    activeProgramId,
    activeWorkouts,
    activeExerciseMap,
    todayDow,
    weekCalendarDays,
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
    switchProgram,
    createProgram,
    deleteProgram,
    selectWorkout,
    addExercise,
    deleteExercise,
    addSet,
    deleteSet,
    updateSet,
    updateSetRpe,
    commitWorkout,
  } = useWorkoutController();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);

  // Targeted muscles computed dynamically for the active workout session
  const activeMuscles = useMemo(() => getSessionMusclesHit(workingExercises), [workingExercises]);

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in font-sans">
      {/* 1. Active Routine Header Banner */}
      <WorkoutRoutineBanner
        activeProgram={activeProgram}
        workoutCount={activeWorkouts.length}
        onOpenRoutineModal={() => setRoutineModalOpen(true)}
      />

      {/* 2. Interactive Weekly Calendar Schedule Strip */}
      <WorkoutWeeklySchedule
        weekCalendarDays={weekCalendarDays}
        selectedWorkoutId={selectedWorkoutId}
        activeExerciseMap={activeExerciseMap}
        onSelectWorkout={selectWorkout}
      />

      {/* 3. Active Workout Header & Action Controls */}
      <WorkoutSessionHeader
        selectedWorkout={selectedWorkout}
        todayDow={todayDow}
        activeMuscles={activeMuscles}
        lastSessionCount={lastSession.length}
        commitError={commitError}
        saveSuccess={saveSuccess}
        isCloudSynced={isCloudSynced}
        onFillFromPreviousSession={fillFromPreviousSession}
        onOpenPicker={() => setPickerOpen(true)}
        onCommitWorkout={commitWorkout}
      />

      {/* 4. Movements & Industrial Sets Table */}
      <ExerciseCardList
        workingExercises={workingExercises}
        lastSession={lastSession}
        personalRecords={personalRecords}
        sessionPRs={sessionPRs}
        onOpenPicker={() => setPickerOpen(true)}
        onDeleteExercise={deleteExercise}
        onAddSet={addSet}
        onDeleteSet={deleteSet}
        onUpdateSet={updateSet}
        onUpdateSetRpe={updateSetRpe}
      />

      {/* 5. Session Reflection & Notes Footer */}
      <WorkoutSessionFooter
        sessionNote={sessionNote}
        sessionPRs={sessionPRs}
        commitError={commitError}
        saveSuccess={saveSuccess}
        hasLastSession={lastSession.length > 0}
        onSessionNoteChange={setSessionNote}
        onFillFromPreviousSession={fillFromPreviousSession}
        onCommitWorkout={commitWorkout}
      />

      {/* Routine Switcher / Creator Modal */}
      <RoutineManagerModal
        isOpen={routineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
        programs={programs}
        activeProgramId={activeProgramId}
        onSwitchProgram={switchProgram}
        onCreateProgram={createProgram}
        onDeleteProgram={deleteProgram}
      />

      {/* Movement Picker Modal */}
      <ExercisePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addExercise}
        alreadyAdded={workingExercises.map((e) => e.name)}
      />

      {/* Workout Completion Celebration Modal */}
      <WorkoutCompletionModal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        session={loggedSessionSummary}
        sessionPRs={sessionPRs}
        onViewStats={() => {
          setCompletionModalOpen(false);
          if (onNavigateTab) {
            onNavigateTab('stats');
          }
        }}
      />
    </div>
  );
}
