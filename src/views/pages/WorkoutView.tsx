import { useState } from 'react';
import { Card, Button } from '../components/ui';
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { RoutineManagerModal } from '../components/RoutineManagerModal';
import { WorkoutCompletionModal } from '../components/WorkoutCompletionModal';
import { useWorkoutController } from '../../controllers/useWorkoutController';
import { calculateEpley1RM } from '../../models/services/StrengthEngine';
import { EXERCISE_LABELS, EXERCISE_IMAGES, normalizeExerciseKey } from '../../models/types/Exercise';
import { MuscleDiagram } from '../components/MuscleDiagram';
import { Plus, Trash2, Trophy, Check, Layers, ChevronRight, CalendarDays, History, AlertCircle } from 'lucide-react';

// Day-of-week helpers (1=Mon…7=Sun)
const DOW_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WorkoutViewProps {
  onNavigateTab?: (tab: 'profile' | 'workout' | 'exercises' | 'stats' | 'advice') => void;
}

export function WorkoutView({ onNavigateTab }: WorkoutViewProps = {}) {
  const {
    programs,
    activeProgram,
    activeProgramId,
    activeWorkouts,
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
  const lastSessionMap = new Map(lastSession.map((e) => [e.name, e]));

  // Is there a workout scheduled for today?
  const todayCalendarItem = weekCalendarDays.find((d) => d.isToday);
  const todayWorkout = todayCalendarItem?.workout;
  const todayHasWorkout = !!todayWorkout;

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in font-sans">
      {/* ─── Active Routine Header Banner ───────────────────────────────────── */}
      <div className="p-6 sm:p-8 bg-[#111113] border-l-4 border-l-[#dc2626] border-y border-r border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-[10px] font-black uppercase text-[#ef4444] font-mono-stat tracking-widest">
              ACTIVE ROUTINE
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs font-mono-stat text-neutral-400 uppercase">
              {activeWorkouts.length} WORKOUT DAYS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-wide uppercase font-mono-stat">
            {activeProgram.title}
          </h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setRoutineModalOpen(true)}
          >
            <Layers size={15} /> Switch / Create Routine
          </Button>
        </div>
      </div>

      {/* ─── Interactive Weekly Calendar Schedule Strip ─────────────────────── */}
      <div className="space-y-3 font-mono-stat">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#222226]">
          <div className="flex items-center gap-2.5">
            <CalendarDays size={15} className="text-[#dc2626]" />
            <span className="text-xs font-black uppercase text-white tracking-wider">
              WEEKLY TRAINING SCHEDULE
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400 font-bold">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {todayWorkout ? (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-[#dc2626] text-white flex items-center gap-1.5 shadow-sm">
                ★ TODAY'S TARGET: {todayWorkout.title}
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase px-2.5 py-1 bg-[#141416] border border-[#262626] text-neutral-400">
                REST DAY SCHEDULED TODAY · SELECT ANY WORKOUT BELOW TO TRAIN
              </span>
            )}
          </div>
        </div>

        {/* 7-Day Week Calendar Strip (Sunday to Saturday) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {weekCalendarDays.map((calDay) => {
            const hasWorkout = !!calDay.workout;
            const isSelected = calDay.workout && calDay.workout.id === selectedWorkoutId;
            const isToday = calDay.isToday;

            return (
              <button
                key={calDay.dayOfWeek}
                type="button"
                disabled={!hasWorkout}
                onClick={() => {
                  if (calDay.workout) {
                    selectWorkout(calDay.workout.id);
                  }
                }}
                className={`p-3 border text-left transition-all relative flex flex-col justify-between min-h-[96px] ${
                  !hasWorkout
                    ? 'bg-[#0c0c0e] border-[#222226] opacity-60 cursor-default'
                    : isSelected
                    ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-lg shadow-red-950/40 cursor-pointer'
                    : isToday
                    ? 'bg-[#1e0e0e] border-[#dc2626] hover:bg-[#251212] cursor-pointer text-white'
                    : 'bg-[#111113] border-[#262626] hover:border-neutral-500 hover:bg-[#18181b] cursor-pointer text-neutral-300'
                }`}
              >
                {/* Header: Day name + Date num + Today Badge */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    isSelected ? 'text-white' : isToday ? 'text-[#ef4444]' : 'text-neutral-400'
                  }`}>
                    {calDay.shortDay} {calDay.dateNum}
                  </span>

                  {isToday && (
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 tracking-wider ${
                      isSelected ? 'bg-white text-black' : 'bg-[#dc2626] text-white'
                    }`}>
                      TODAY
                    </span>
                  )}
                </div>

                {/* Workout Title or Rest status */}
                <div className="mt-2 min-w-0">
                  {hasWorkout ? (
                    <div>
                      <p className={`text-xs font-black truncate leading-snug ${
                        isSelected ? 'text-white' : isToday ? 'text-white' : 'text-neutral-200'
                      }`}>
                        {calDay.workout!.title}
                      </p>
                      {calDay.isCompleted && (
                        <span className={`inline-flex items-center gap-0.5 text-[8px] font-black uppercase mt-1 px-1 py-0.2 ${
                          isSelected ? 'bg-black/40 text-emerald-300' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                        }`}>
                          <Check size={9} /> Logged
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide">
                      REST DAY
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Active Workout Header & Action Controls ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222226]">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-[#dc2626] flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {selectedWorkout && (
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 ${
                  selectedWorkout.dayOfWeek === todayDow
                    ? 'bg-[#dc2626] text-white font-black'
                    : 'bg-[#1e1e22] text-neutral-400'
                }`}>
                  {DOW_SHORT[selectedWorkout.dayOfWeek] || ''}
                  {selectedWorkout.dayOfWeek === todayDow ? ' · Scheduled For Today' : ''}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {selectedWorkout?.title || 'Session'}
            </h3>
            {selectedWorkout?.note && (
              <p className="text-xs text-neutral-500 mt-0.5">{selectedWorkout.note}</p>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {lastSession.length > 0 && (
            <Button
              variant="secondary"
              size="md"
              onClick={fillFromPreviousSession}
              title="Autofill weights and reps from previous logged session"
              className="border-neutral-700 hover:border-neutral-500 text-neutral-300"
            >
              <History size={15} className="text-neutral-400" /> Autofill Prev
            </Button>
          )}
          <Button variant="secondary" size="md" onClick={() => setPickerOpen(true)}>
            <Plus size={15} /> Add movement
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={commitWorkout}
            className={saveSuccess ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white font-black' : ''}
          >
            <Check size={15} /> {saveSuccess ? 'Logged!' : 'Log workout'}
          </Button>
        </div>
      </div>

      {/* Validation Error Alert */}
      {commitError && (
        <div className="p-4 bg-[#181111] border-l-4 border-l-amber-500 border-y border-r border-[#3a2020] text-amber-200 text-xs sm:text-sm font-mono-stat flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
            <span>{commitError}</span>
          </div>
          {lastSession.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={fillFromPreviousSession}
              className="bg-amber-950/60 border-amber-600/60 text-amber-200 hover:bg-amber-900/60 flex-shrink-0"
            >
              <History size={14} /> Autofill Previous
            </Button>
          )}
        </div>
      )}

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 bg-[#0d1811] border-l-4 border-l-emerald-500 border-y border-r border-[#1a3824] text-white text-xs sm:text-sm font-black uppercase font-mono-stat flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Check size={18} className="text-emerald-400" />
            <span className="text-emerald-300">SESSION LOGGED TO DATABASE. TONNAGE & PRS UPDATED.</span>
          </div>
          {isCloudSynced !== null && (
            <span
              className={`text-[10px] px-2.5 py-1 border ${
                isCloudSynced
                  ? 'border-emerald-700/60 text-emerald-400 bg-emerald-950/40'
                  : 'border-neutral-700 text-neutral-400 bg-neutral-900'
              }`}
            >
              {isCloudSynced ? '● FASTAPI CLOUD SYNCED' : '○ OFFLINE LOCAL CACHE'}
            </span>
          )}
        </div>
      )}

      {/* ─── Exercises List ─────────────────────────────────────────────────── */}
      <div className="space-y-6 sm:space-y-8">
        {workingExercises.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-[#262626] text-neutral-500 font-mono-stat space-y-3">
            <p className="text-sm font-black uppercase tracking-wider">NO MOVEMENTS LOGGED FOR THIS SESSION.</p>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setPickerOpen(true)}
            >
              + ADD MOVEMENT
            </Button>
          </div>
        ) : (
          workingExercises.map((ex) => {
            const canonicalKey = normalizeExerciseKey(ex.name);
            const label = EXERCISE_LABELS[canonicalKey] || ex.name;
            const storedPR = personalRecords[canonicalKey]?.oneRM || personalRecords[ex.name]?.oneRM || 0;
            const ghostEx = lastSessionMap.get(ex.name) || lastSessionMap.get(canonicalKey);
            const image = EXERCISE_IMAGES[canonicalKey] || ex.imageUrl;

            return (
              <div
                key={ex.id}
                className="bg-[#111113] border-2 border-[#262626] rounded-none"
              >
                {/* Exercise Header Row */}
                <div className="flex items-stretch justify-between bg-[#0e0e11] border-b border-[#262626]">
                  {/* Left: image + info */}
                  <div className="flex items-center gap-4 p-4 sm:p-5 flex-1 min-w-0">
                    <img
                      src={image}
                      alt={label}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover bg-neutral-900 border border-[#262626] flex-shrink-0 rounded-none"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <span className="text-sm sm:text-base font-black text-white uppercase tracking-wide">{label}</span>
                        {(sessionPRs[canonicalKey] || sessionPRs[ex.name]) && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 bg-[#3b0d0c] text-[#ef4444] border border-[#7f1d1d] uppercase font-mono-stat">
                            <Trophy size={11} /> PR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 font-mono-stat uppercase">
                        {ex.muscleGroup}
                      </p>
                      <p className="text-xs text-neutral-400 font-mono-stat mt-0.5">
                        Best 1RM: <strong className="text-white">{storedPR ? `${storedPR} kg` : '—'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Right: muscle diagram + delete */}
                  <div className="flex items-center gap-2 pr-4 border-l border-[#1e1e22] pl-3">
                    <MuscleDiagram
                      exerciseId={ex.name}
                      muscleGroup={ex.muscleGroup}
                      size={65}
                    />
                    <button
                      onClick={() => deleteExercise(ex.id)}
                      className="p-2 text-neutral-600 hover:text-red-400 transition-colors cursor-pointer self-start mt-4"
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Industrial Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm min-w-[550px] border-collapse font-mono-stat">
                    <thead>
                      <tr className="bg-[#1c1c20] text-neutral-400 uppercase text-[10px] font-black tracking-wider border-b border-[#262626]">
                        <th className="py-3 px-4 w-14 text-center border-r border-[#262626]">SET</th>
                        <th className="py-3 px-4 w-28 text-center border-r border-[#262626]">PREV</th>
                        <th className="py-3 px-4 w-36 border-r border-[#262626]">LOAD (KG)</th>
                        <th className="py-3 px-4 w-28 border-r border-[#262626]">REPS</th>
                        <th className="py-3 px-4 w-28 text-center border-r border-[#262626]">RPE</th>
                        <th className="py-3 px-4 w-32 text-center border-r border-[#262626]">EST 1RM</th>
                        <th className="py-3 px-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222226] text-xs sm:text-sm">
                      {ex.sets.map((set, sIdx) => {
                        const w = parseFloat(set.weight) || 0;
                        const r = parseInt(set.reps, 10) || 0;
                        const e1rm = calculateEpley1RM(w, r);
                        const currentSessionPR = (sessionPRs[canonicalKey] || sessionPRs[ex.name])?.oneRM || 0;
                        // Highlight as PR only if this set achieved this session's peak 1RM AND beats previous all-time PR
                        const isNewPR = e1rm > 0 && currentSessionPR > storedPR && e1rm === currentSessionPR;
                        const ghostSet = ghostEx?.sets[sIdx];

                        return (
                          <tr key={set.id} className="hover:bg-white/5 transition-colors">
                            {/* Set # */}
                            <td className="py-3 px-4 text-center font-black text-neutral-400 border-r border-[#222226]">
                              {sIdx + 1}
                            </td>

                            {/* Ghost / Previous session */}
                            <td className="py-3 px-4 text-center text-xs text-neutral-400 border-r border-[#222226]">
                              {ghostSet ? `${ghostSet.weight}k×${ghostSet.reps}` : '—'}
                            </td>

                            {/* Weight Input */}
                            <td className="py-2 px-3 border-r border-[#222226]">
                              <input
                                type="text"
                                placeholder={ghostSet?.weight || '0'}
                                value={set.weight}
                                onChange={(e) => updateSet(ex.id, set.id, 'weight', e.target.value)}
                                className="w-full bg-black border border-[#2a2a2f] px-3 py-1.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#dc2626] rounded-none font-mono-stat"
                              />
                            </td>

                            {/* Reps Input */}
                            <td className="py-2 px-3 border-r border-[#222226]">
                              <input
                                type="text"
                                placeholder={ghostSet?.reps || '0'}
                                value={set.reps}
                                onChange={(e) => updateSet(ex.id, set.id, 'reps', e.target.value)}
                                className="w-full bg-black border border-[#2a2a2f] px-3 py-1.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#dc2626] rounded-none font-mono-stat"
                              />
                            </td>

                            {/* RPE Selector */}
                            <td className="py-2 px-3 text-center border-r border-[#222226]">
                              <div className="inline-flex items-center gap-1.5 bg-black border border-[#2a2a2f] px-2 py-1 rounded-none">
                                <button
                                  onClick={() => updateSetRpe(ex.id, set.id, Math.max(0, (set.rpe || 0) - 1))}
                                  className="text-neutral-400 hover:text-white px-1.5 font-black cursor-pointer text-xs"
                                >
                                  -
                                </button>
                                <span className={`text-xs font-black min-w-[20px] text-center ${set.rpe ? 'text-[#ef4444]' : 'text-neutral-500'}`}>
                                  {set.rpe || '—'}
                                </span>
                                <button
                                  onClick={() => updateSetRpe(ex.id, set.id, Math.min(10, (set.rpe || 0) + 1))}
                                  className="text-neutral-400 hover:text-white px-1.5 font-black cursor-pointer text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Estimated 1RM Badge */}
                            <td className="py-3 px-4 text-center border-r border-[#222226]">
                              {e1rm > 0 ? (
                                <span className={`inline-block px-2.5 py-1 text-xs font-black border ${
                                  isNewPR
                                    ? 'bg-[#3b0d0c] text-[#ef4444] border-[#7f1d1d]'
                                    : 'bg-[#18181b] text-white border-[#27272a]'
                                }`}>
                                  {e1rm} KG
                                </span>
                              ) : (
                                <span className="text-neutral-600">—</span>
                              )}
                            </td>

                            {/* Delete Set */}
                            <td className="py-3 px-3 text-center">
                              {ex.sets.length > 1 && (
                                <button
                                  onClick={() => deleteSet(ex.id, set.id)}
                                  className="text-neutral-600 hover:text-red-400 transition-colors font-mono cursor-pointer text-sm"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Add Set Button */}
                  <div className="p-3.5 bg-[#141416] border-t border-[#262626] flex justify-start">
                    <button
                      onClick={() => addSet(ex.id)}
                      className="px-3.5 py-1.5 bg-[#1c1c20] hover:bg-[#26262b] text-neutral-300 text-xs font-black uppercase transition-colors cursor-pointer border border-[#333338] font-mono-stat"
                    >
                      + ADD SET
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Workout Session Reflection & Notes (/api/workout-notes) ────── */}
      <Card className="p-6 sm:p-8 border border-[#27272a] bg-[#111113] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-4 bg-[#dc2626]" />
            <h4 className="text-sm font-black uppercase tracking-wider text-white font-mono-stat">
              Session Reflection & Coaching Journal
            </h4>
          </div>
          <span className="text-xs font-mono-stat text-neutral-400">
            /api/workout-notes
          </span>
        </div>
        <textarea
          rows={4}
          placeholder="Log fatigue, perceived exertion, joint readiness, or technical cues for this session..."
          value={sessionNote}
          onChange={(e) => setSessionNote(e.target.value)}
          className="w-full bg-[#0a0a0c] border border-[#262626] p-4 text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#dc2626] font-mono-stat resize-none leading-relaxed"
        />
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm font-mono-stat text-neutral-400 space-y-1">
            {Object.keys(sessionPRs).length > 0 && (
              <span className="text-[#facc15] font-black flex items-center gap-1.5">
                <Trophy size={16} /> {Object.keys(sessionPRs).length} NEW PERSONAL RECORD(S) IN THIS SESSION
              </span>
            )}
            {commitError && (
              <span className="text-amber-400 font-medium flex items-center gap-1.5">
                <AlertCircle size={15} /> {commitError}
              </span>
            )}
            {saveSuccess && (
              <span className="text-emerald-400 font-black flex items-center gap-1.5">
                <Check size={15} /> WORKOUT LOGGED SUCCESSFULLY!
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {lastSession.length > 0 && (
              <Button
                variant="secondary"
                size="lg"
                onClick={fillFromPreviousSession}
                className="w-full sm:w-auto border-neutral-700 text-neutral-300 hover:text-white"
                title="Fill in empty sets with weights/reps from your last session"
              >
                <History size={16} /> Autofill Prev
              </Button>
            )}
            <Button
              variant="primary"
              size="lg"
              onClick={commitWorkout}
              className={`w-full sm:w-auto min-w-[220px] ${
                saveSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white font-black'
                  : ''
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check size={18} /> Session Logged!
                </>
              ) : (
                <>
                  <Check size={18} /> Finish & Log Session
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

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
