import { Modal, Button } from './ui';
import { WorkoutSession } from '../../models/types/WorkoutHistory';
import { PREntry } from '../../models/types/PersonalRecord';
import { Trophy, CheckCircle, Flame, Dumbbell, ArrowRight } from 'lucide-react';

interface WorkoutCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkoutSession | null;
  sessionPRs?: Record<string, PREntry>;
  onViewStats?: () => void;
}

export function WorkoutCompletionModal({
  isOpen,
  onClose,
  session,
  sessionPRs = {},
  onViewStats,
}: WorkoutCompletionModalProps) {
  if (!session) return null;

  const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const prKeys = Object.keys(sessionPRs);
  const hasPRs = prKeys.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workout Completed" maxWidth="max-w-lg">
      <div className="space-y-5 font-mono-stat">
        {/* Celebration Header Banner */}
        <div className="p-4 bg-[#18181b] border-l-4 border-l-[#22c55e] border-y border-r border-[#262626]">
          <div className="flex items-center gap-2.5 mb-1">
            <CheckCircle size={18} className="text-[#22c55e]" />
            <span className="text-xs font-black uppercase text-[#22c55e] tracking-wider">
              SESSION LOGGED TO DATABASE
            </span>
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">
            {session.workoutTitle}
          </h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            {new Date(session.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 bg-[#0a0a0c] border border-[#262626]">
            <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500 mb-1">
              TOTAL TONNAGE
            </p>
            <p className="text-base sm:text-lg font-black text-white">
              {session.totalVolume >= 1000
                ? `${(session.totalVolume / 1000).toFixed(2)} t`
                : `${Math.round(session.totalVolume)} kg`}
            </p>
          </div>

          <div className="p-3 bg-[#0a0a0c] border border-[#262626]">
            <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500 mb-1">
              SETS LOGGED
            </p>
            <p className="text-base sm:text-lg font-black text-white">
              {totalSets} Sets
            </p>
          </div>

          <div className="p-3 bg-[#0a0a0c] border border-[#262626]">
            <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500 mb-1">
              MOVEMENTS
            </p>
            <p className="text-base sm:text-lg font-black text-white">
              {session.exercises.length}
            </p>
          </div>
        </div>

        {/* PR Announcement if any */}
        {hasPRs && (
          <div className="p-3.5 bg-[#2a1708] border border-[#d97706]/60 space-y-2">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-[#facc15]" />
              <span className="text-xs font-black uppercase text-[#facc15] tracking-wider">
                {prKeys.length} NEW PERSONAL RECORD{prKeys.length > 1 ? 'S' : ''}!
              </span>
            </div>
            <div className="space-y-1">
              {prKeys.map((key) => {
                const pr = sessionPRs[key];
                return (
                  <div key={key} className="flex items-center justify-between text-xs text-neutral-200">
                    <span className="capitalize font-bold">{key.replace(/_/g, ' ')}</span>
                    <span className="font-black text-[#facc15]">{pr.oneRM} kg Est. 1RM</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Exercises Breakdown */}
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
            MOVEMENTS BREAKDOWN
          </p>
          {session.exercises.map((ex, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-[#0a0a0c] border border-[#1e1e22] text-xs"
            >
              <div className="min-w-0 flex-1 mr-2">
                <p className="font-bold text-white truncate">{ex.exerciseName}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  {ex.sets.map((s) => `${s.weight}k×${s.reps}`).join(' · ')}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] text-neutral-500 uppercase block">Best 1RM</span>
                <span className="font-black text-white text-xs">{ex.bestEpley1RM} kg</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>

          {onViewStats && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                onClose();
                onViewStats();
              }}
              className="w-full sm:w-auto"
            >
              <span>View In Statistics</span>
              <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
