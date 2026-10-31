import { CalendarDays, Check } from 'lucide-react';
import { WeekDayCalendarItem } from '../../../controllers/useWorkoutController';
import { WorkoutExercise } from '../../../models/types/Workout';
import { getSessionMusclesHit } from '../../../models/types/Muscles';

interface WorkoutWeeklyScheduleProps {
  weekCalendarDays: WeekDayCalendarItem[];
  selectedWorkoutId: string;
  activeExerciseMap: Record<string, WorkoutExercise[]>;
  onSelectWorkout: (workoutId: string) => void;
}

export function WorkoutWeeklySchedule({
  weekCalendarDays,
  selectedWorkoutId,
  activeExerciseMap,
  onSelectWorkout,
}: WorkoutWeeklyScheduleProps) {
  const todayCalendarItem = weekCalendarDays.find((d) => d.isToday);
  const todayWorkout = todayCalendarItem?.workout;

  return (
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
                  onSelectWorkout(calDay.workout.id);
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
                    {(() => {
                      const dayExercises = activeExerciseMap[calDay.workout!.id] || [];
                      const dayMuscles = getSessionMusclesHit(dayExercises);
                      if (dayMuscles.displayMuscles.length === 0) return null;
                      return (
                        <p className={`text-[9px] font-mono-stat truncate mt-0.5 ${
                          isSelected ? 'text-white/80' : isToday ? 'text-red-300 font-semibold' : 'text-neutral-400'
                        }`}>
                          {dayMuscles.displayMuscles.join(' · ')}
                        </p>
                      );
                    })()}
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
  );
}
