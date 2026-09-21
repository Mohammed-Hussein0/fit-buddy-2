import { useState, useMemo } from 'react';
import { Modal } from './ui';
import {
  EXERCISE_LIBRARY,
  EXERCISE_LABELS,
  EXERCISE_IMAGES,
  COMPOUND_EXERCISES,
  MUSCLE_GROUPS,
  ExerciseId,
} from '../../models/types/Exercise';
import { Search, Plus } from 'lucide-react';

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exerciseId: ExerciseId, muscleGroup: string) => void;
  alreadyAdded: string[];
}

export function ExercisePickerModal({
  isOpen,
  onClose,
  onSelect,
  alreadyAdded,
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');

  const filteredExercises = useMemo(() => {
    return EXERCISE_LIBRARY.filter((ex) => {
      const label = EXERCISE_LABELS[ex.idKey] || ex.idKey;
      const matchesGroup = activeGroup === 'All' || ex.muscleGroup === activeGroup;
      const matchesSearch = label.toLowerCase().includes(search.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [search, activeGroup]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Movement Directory" maxWidth="max-w-2xl">
      {/* Search Input */}
      <div className="relative mb-3.5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Filter movements (bench, squat, deadlift, row...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black border border-[#27272a] pl-10 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#dc2626] transition-colors rounded-none font-mono-stat"
        />
      </div>

      {/* Muscle Group Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3.5 border-b border-[#262626] scrollbar-none">
        {MUSCLE_GROUPS.map((group) => {
          const isActive = activeGroup === group;
          return (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-[#dc2626] text-white border-[#dc2626]'
                  : 'bg-[#18181b] text-neutral-400 hover:text-white border-[#27272a]'
              }`}
            >
              {group}
            </button>
          );
        })}
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {filteredExercises.map((ex) => {
          const isAdded = alreadyAdded.includes(ex.idKey);
          const isCompound = COMPOUND_EXERCISES.has(ex.idKey);
          const label = EXERCISE_LABELS[ex.idKey] || ex.idKey;
          const image = EXERCISE_IMAGES[ex.idKey];

          return (
            <div
              key={ex.idKey}
              className="flex items-center gap-3 p-2 bg-[#161619] border border-[#262626] hover:border-neutral-500 transition-all"
            >
              <img
                src={image}
                alt={label}
                className="w-10 h-10 object-cover bg-neutral-900 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate uppercase">{label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono-stat">{ex.muscleGroup}</span>
                  {isCompound && (
                    <span className="text-[8px] font-black px-1.5 py-0.2 bg-[#3b0d0c] text-red-400 border border-[#7f1d1d] uppercase font-mono-stat">
                      Compound
                    </span>
                  )}
                </div>
              </div>

              <button
                disabled={isAdded}
                onClick={() => {
                  onSelect(ex.idKey, ex.muscleGroup);
                  onClose();
                }}
                className={`px-2.5 py-1.5 transition-all flex-shrink-0 cursor-pointer border text-xs font-black uppercase ${
                  isAdded
                    ? 'bg-[#18181b] text-neutral-600 border-[#27272a] cursor-not-allowed'
                    : 'bg-[#dc2626] text-white border-[#dc2626] hover:bg-[#b91c1c]'
                }`}
              >
                {isAdded ? 'Added' : '+ Add'}
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
