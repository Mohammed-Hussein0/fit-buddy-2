import { Button } from '../ui';
import { Target, History, Plus, Check, AlertCircle } from 'lucide-react';
import { Workout } from '../../../models/types/Workout';

interface WorkoutSessionHeaderProps {
  selectedWorkout?: Workout;
  todayDow: number;
  activeMuscles: { displayMuscles: string[]; detailedTargets: string[] };
  lastSessionCount: number;
  commitError: string | null;
  saveSuccess: boolean;
  isCloudSynced: boolean | null;
  onFillFromPreviousSession: () => void;
  onOpenPicker: () => void;
  onCommitWorkout: () => void;
}

const DOW_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WorkoutSessionHeader({
  selectedWorkout,
  todayDow,
  activeMuscles,
  lastSessionCount,
  commitError,
  saveSuccess,
  isCloudSynced,
  onFillFromPreviousSession,
  onOpenPicker,
  onCommitWorkout,
}: WorkoutSessionHeaderProps) {
  return (
    <div className="space-y-4">
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

            {/* Targeted Muscles Badges */}
            {activeMuscles.displayMuscles.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[10px] font-black uppercase text-neutral-400 font-mono-stat tracking-wider flex items-center gap-1">
                  <Target size={11} className="text-[#dc2626]" /> Targeted:
                </span>
                {activeMuscles.displayMuscles.map((muscle) => (
                  <span
                    key={muscle}
                    className="px-2 py-0.5 text-[10px] font-mono-stat font-bold uppercase tracking-wide bg-[#1c1c20] border border-[#2e2e34] text-neutral-200 rounded"
                  >
                    {muscle}
                  </span>
                ))}
                {activeMuscles.detailedTargets.length > 0 && (
                  <span className="text-[10px] text-neutral-500 font-mono-stat ml-1 hidden sm:inline">
                    ({activeMuscles.detailedTargets.slice(0, 4).join(', ')})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {lastSessionCount > 0 && (
            <Button
              variant="secondary"
              size="md"
              onClick={onFillFromPreviousSession}
              title="Autofill weights and reps from previous logged session"
              className="border-neutral-700 hover:border-neutral-500 text-neutral-300"
            >
              <History size={15} className="text-neutral-400" /> Autofill Prev
            </Button>
          )}
          <Button variant="secondary" size="md" onClick={onOpenPicker}>
            <Plus size={15} /> Add movement
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onCommitWorkout}
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
          {lastSessionCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onFillFromPreviousSession}
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
    </div>
  );
}
