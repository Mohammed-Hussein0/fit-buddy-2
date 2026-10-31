import { Button } from '../ui';
import { Layers } from 'lucide-react';
import { Program } from '../../../models/types/Workout';

interface WorkoutRoutineBannerProps {
  activeProgram: Program;
  workoutCount: number;
  onOpenRoutineModal: () => void;
}

export function WorkoutRoutineBanner({
  activeProgram,
  workoutCount,
  onOpenRoutineModal,
}: WorkoutRoutineBannerProps) {
  return (
    <div className="p-6 sm:p-8 bg-[#111113] border-l-4 border-l-[#dc2626] border-y border-r border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-5 font-sans">
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-[10px] font-black uppercase text-[#ef4444] font-mono-stat tracking-widest">
            ACTIVE ROUTINE
          </span>
          <span className="text-neutral-600">·</span>
          <span className="text-xs font-mono-stat text-neutral-400 uppercase">
            {workoutCount} WORKOUT DAYS
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
          onClick={onOpenRoutineModal}
        >
          <Layers size={15} /> Switch / Create Routine
        </Button>
      </div>
    </div>
  );
}
