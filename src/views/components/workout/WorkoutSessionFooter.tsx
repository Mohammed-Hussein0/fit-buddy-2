import { Card, Button } from '../ui';
import { Trophy, AlertCircle, Check, History } from 'lucide-react';
import { PREntry } from '../../../models/types/PersonalRecord';

interface WorkoutSessionFooterProps {
  sessionNote: string;
  sessionPRs: Record<string, PREntry>;
  commitError: string | null;
  saveSuccess: boolean;
  hasLastSession: boolean;
  onSessionNoteChange: (val: string) => void;
  onFillFromPreviousSession: () => void;
  onCommitWorkout: () => void;
}

export function WorkoutSessionFooter({
  sessionNote,
  sessionPRs,
  commitError,
  saveSuccess,
  hasLastSession,
  onSessionNoteChange,
  onFillFromPreviousSession,
  onCommitWorkout,
}: WorkoutSessionFooterProps) {
  return (
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
        onChange={(e) => onSessionNoteChange(e.target.value)}
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
          {hasLastSession && (
            <Button
              variant="secondary"
              size="lg"
              onClick={onFillFromPreviousSession}
              className="w-full sm:w-auto border-neutral-700 text-neutral-300 hover:text-white"
              title="Fill in empty sets with weights/reps from your last session"
            >
              <History size={16} /> Autofill Prev
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={onCommitWorkout}
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
  );
}
