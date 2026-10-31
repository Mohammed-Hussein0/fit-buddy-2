import { Button } from '../ui';
import { MuscleDiagram } from '../MuscleDiagram';
import { calculateEpley1RM } from '../../../models/services/StrengthEngine';
import { EXERCISE_LABELS, EXERCISE_IMAGES, normalizeExerciseKey } from '../../../models/types/Exercise';
import { WorkoutExercise, ExerciseSet } from '../../../models/types/Workout';
import { PREntry } from '../../../models/types/PersonalRecord';
import { preventMinusKeyDown, sanitizePositiveNumber } from '../../../utils/numberInputUtils';
import { Trophy, Trash2 } from 'lucide-react';

interface ExerciseCardListProps {
  workingExercises: WorkoutExercise[];
  lastSession: WorkoutExercise[];
  personalRecords: Record<string, PREntry>;
  sessionPRs: Record<string, PREntry>;
  onOpenPicker: () => void;
  onDeleteExercise: (exerciseId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => void;
  onUpdateSetRpe: (exerciseId: string, setId: string, rpe: number) => void;
}

export function ExerciseCardList({
  workingExercises,
  lastSession,
  personalRecords,
  sessionPRs,
  onOpenPicker,
  onDeleteExercise,
  onAddSet,
  onDeleteSet,
  onUpdateSet,
  onUpdateSetRpe,
}: ExerciseCardListProps) {
  const lastSessionMap = new Map(lastSession.map((e) => [e.name, e]));

  if (workingExercises.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-[#262626] text-neutral-500 font-mono-stat space-y-3">
        <p className="text-sm font-black uppercase tracking-wider">NO MOVEMENTS LOGGED FOR THIS SESSION.</p>
        <Button variant="secondary" size="md" onClick={onOpenPicker}>
          + ADD MOVEMENT
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {workingExercises.map((ex) => {
        const canonicalKey = normalizeExerciseKey(ex.name);
        const label = EXERCISE_LABELS[canonicalKey] || ex.name;
        const storedPR = personalRecords[canonicalKey]?.oneRM || personalRecords[ex.name]?.oneRM || 0;
        const ghostEx = lastSessionMap.get(ex.name) || lastSessionMap.get(canonicalKey);
        const image = EXERCISE_IMAGES[canonicalKey] || ex.imageUrl;

        return (
          <div key={ex.id} className="bg-[#111113] border-2 border-[#262626] rounded-none">
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
                  <p className="text-xs text-neutral-500 font-mono-stat uppercase">{ex.muscleGroup}</p>
                  <p className="text-xs text-neutral-400 font-mono-stat mt-0.5">
                    Best 1RM: <strong className="text-white">{storedPR ? `${storedPR} kg` : '—'}</strong>
                  </p>
                </div>
              </div>

              {/* Right: muscle diagram + delete */}
              <div className="flex items-center gap-2 pr-4 border-l border-[#1e1e22] pl-3">
                <MuscleDiagram exerciseId={ex.name} muscleGroup={ex.muscleGroup} size={65} />
                <button
                  onClick={() => onDeleteExercise(ex.id)}
                  className="p-2 text-neutral-600 hover:text-red-400 transition-colors cursor-pointer self-start mt-4"
                  title="Remove"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Sets Table */}
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
                  {ex.sets.map((set: ExerciseSet, sIdx: number) => {
                    const w = parseFloat(set.weight) || 0;
                    const r = parseInt(set.reps, 10) || 0;
                    const e1rm = calculateEpley1RM(w, r);
                    const currentSessionPR = (sessionPRs[canonicalKey] || sessionPRs[ex.name])?.oneRM || 0;
                    const isNewPR = e1rm > 0 && currentSessionPR > storedPR && e1rm === currentSessionPR;
                    const ghostSet = ghostEx?.sets[sIdx];

                    return (
                      <tr key={set.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-center font-black text-neutral-400 border-r border-[#222226]">
                          {sIdx + 1}
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-neutral-400 border-r border-[#222226]">
                          {ghostSet ? `${ghostSet.weight}k×${ghostSet.reps}` : '—'}
                        </td>
                        <td className="py-2 px-3 border-r border-[#222226]">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder={ghostSet?.weight || '0'}
                            value={set.weight}
                            onKeyDown={preventMinusKeyDown}
                            onChange={(e) => onUpdateSet(ex.id, set.id, 'weight', sanitizePositiveNumber(e.target.value, true))}
                            className="w-full bg-black border border-[#2a2a2f] px-3 py-1.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#dc2626] rounded-none font-mono-stat"
                          />
                        </td>
                        <td className="py-2 px-3 border-r border-[#222226]">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder={ghostSet?.reps || '0'}
                            value={set.reps}
                            onKeyDown={preventMinusKeyDown}
                            onChange={(e) => onUpdateSet(ex.id, set.id, 'reps', sanitizePositiveNumber(e.target.value, false))}
                            className="w-full bg-black border border-[#2a2a2f] px-3 py-1.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#dc2626] rounded-none font-mono-stat"
                          />
                        </td>
                        <td className="py-2 px-3 text-center border-r border-[#222226]">
                          <div className="inline-flex items-center gap-1.5 bg-black border border-[#2a2a2f] px-2 py-1 rounded-none">
                            <button
                              onClick={() => onUpdateSetRpe(ex.id, set.id, Math.max(0, (set.rpe || 0) - 1))}
                              className="text-neutral-400 hover:text-white px-1.5 font-black cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <span className={`text-xs font-black min-w-[20px] text-center ${set.rpe ? 'text-[#ef4444]' : 'text-neutral-500'}`}>
                              {set.rpe || '—'}
                            </span>
                            <button
                              onClick={() => onUpdateSetRpe(ex.id, set.id, Math.min(10, (set.rpe || 0) + 1))}
                              className="text-neutral-400 hover:text-white px-1.5 font-black cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
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
                        <td className="py-3 px-3 text-center">
                          {ex.sets.length > 1 && (
                            <button
                              onClick={() => onDeleteSet(ex.id, set.id)}
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

              <div className="p-3.5 bg-[#141416] border-t border-[#262626] flex justify-start">
                <button
                  onClick={() => onAddSet(ex.id)}
                  className="px-3.5 py-1.5 bg-[#1c1c20] hover:bg-[#26262b] text-neutral-300 text-xs font-black uppercase transition-colors cursor-pointer border border-[#333338] font-mono-stat"
                >
                  + ADD SET
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
