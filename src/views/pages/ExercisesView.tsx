import { useState } from 'react';
import { useStatsController } from '../../controllers/useStatsController';
import { ExerciseHistoryModal } from './ExerciseHistoryModal';
import { TierBadge } from '../components/TierBadge';
import { MuscleDiagram } from '../components/MuscleDiagram';
import {
  EXERCISE_LABELS,
  EXERCISE_IMAGES,
  MUSCLE_GROUPS,
  MOVEMENT_PATTERN_CATEGORIES,
} from '../../models/types/Exercise';
import { TIER_COLORS, TIER_LABELS, getPercentileColor } from '../../models/types/StrengthStandards';
import { Search, Dumbbell, Shield, Activity, Target, CheckSquare, Square, ChevronRight } from 'lucide-react';

interface ExercisesViewProps {
  userId?: string;
}

export function ExercisesView({ userId }: ExercisesViewProps) {
  const {
    filteredLibraryExercises,
    selectedExerciseId,
    searchQuery,
    muscleGroupFilter,
    patternFilter,
    mechanicsFilter,
    onlyLoggedFilter,
    profile,
    setSearchQuery,
    setMuscleGroupFilter,
    setPatternFilter,
    setMechanicsFilter,
    setOnlyLoggedFilter,
    openExerciseHistory,
    closeExerciseHistory,
    getExerciseStats,
    getExerciseDetails,
    update1RM,
  } = useStatsController(userId);

  const selectedStats = selectedExerciseId ? getExerciseStats(selectedExerciseId) : null;
  const selectedDetails = selectedExerciseId ? getExerciseDetails(selectedExerciseId) : undefined;

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in font-mono-stat text-neutral-200">
      {/* ─── Header Banner ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b-2 border-[#222226]">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-9 sm:h-10 bg-[#dc2626] flex-shrink-0" />
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#facc15] tracking-wide uppercase">
              Exercise Registry
            </h2>
            <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mt-0.5">
              Target Muscles · Equipment · Strength Standards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-black uppercase px-3 py-1.5 bg-[#18181b] border border-[#2e2e34] text-neutral-300">
            TOTAL: <strong className="text-white">44 MOVEMENTS</strong>
          </span>
          <span className="text-xs font-black uppercase px-3 py-1.5 bg-[#3b0d0c] border border-[#7f1d1d] text-red-400">
            BODYWEIGHT ADJUSTED
          </span>
        </div>
      </div>

      {/* ─── Multi-Axis Filtering Control Console ────────────────────────────── */}
      <div className="p-6 sm:p-8 bg-[#111113] border border-[#262626] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Dumbbell size={18} className="text-[#dc2626]" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Filter by Muscle, Movement, or Search
              </h3>
            </div>
            <p className="text-xs text-neutral-400 uppercase mt-1">
              Showing {filteredLibraryExercises.length} of 44 exercises · Click any exercise to view target muscles and test 1RM
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search exercise, muscle, or pattern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-[#262626] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#dc2626]"
            />
          </div>
        </div>

        {/* Muscle Group Filter Chips */}
        <div className="space-y-2 pt-2 border-t border-[#222226]">
          <span className="text-[10px] font-black text-neutral-400 uppercase block tracking-wider">
            Target Muscle Anatomy:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {MUSCLE_GROUPS.map((group) => {
              const isSelected = muscleGroupFilter === group;
              return (
                <button
                  key={group}
                  onClick={() => setMuscleGroupFilter(group)}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider whitespace-nowrap cursor-pointer border transition-colors ${
                    isSelected
                      ? 'bg-[#dc2626] text-white border-[#dc2626]'
                      : 'bg-[#18181b] text-neutral-400 border-[#262626] hover:text-white hover:bg-[#222226]'
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>

        {/* Movement Pattern Filter Chips */}
        <div className="space-y-2 pt-2 border-t border-[#222226]">
          <span className="text-[10px] font-black text-neutral-400 uppercase block tracking-wider">
            Kinetic Movement Pattern:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {MOVEMENT_PATTERN_CATEGORIES.map((pattern) => {
              const isSelected = patternFilter === pattern;
              return (
                <button
                  key={pattern}
                  onClick={() => setPatternFilter(pattern)}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider whitespace-nowrap cursor-pointer border transition-colors ${
                    isSelected
                      ? 'bg-[#b91c1c] text-white border-[#ef4444]'
                      : 'bg-[#141417] text-neutral-400 border-[#262626] hover:text-white hover:bg-[#1f1f23]'
                  }`}
                >
                  {pattern}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mechanics & Logged Only Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#222226]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-neutral-400 uppercase mr-1">Mechanics:</span>
            {(['All', 'Compound', 'Isolation'] as const).map((mech) => (
              <button
                key={mech}
                onClick={() => setMechanicsFilter(mech)}
                className={`px-3 py-1 text-[10px] font-black uppercase border cursor-pointer transition-colors ${
                  mechanicsFilter === mech
                    ? 'bg-white text-black border-white font-black'
                    : 'bg-[#18181b] text-neutral-400 border-[#262626] hover:text-white'
                }`}
              >
                {mech}
              </button>
            ))}
          </div>

          {/* Only Logged / PRs Toggle */}
          <button
            onClick={() => setOnlyLoggedFilter(!onlyLoggedFilter)}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black uppercase border cursor-pointer transition-colors ${
              onlyLoggedFilter
                ? 'bg-[#3b0d0c] text-red-400 border-[#7f1d1d]'
                : 'bg-[#18181b] text-neutral-400 border-[#262626] hover:text-white'
            }`}
          >
            {onlyLoggedFilter ? <CheckSquare size={14} className="text-[#ef4444]" /> : <Square size={14} />}
            <span>Only With Tested 1RM / Logs</span>
          </button>
        </div>
      </div>

      {/* ─── Movements Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {filteredLibraryExercises.map((ex) => {
          const stats = getExerciseStats(ex.idKey);
          const label = EXERCISE_LABELS[ex.idKey] || ex.idKey;
          const image = EXERCISE_IMAGES[ex.idKey];
          const isCompound = ex.mechanics === 'Compound';
          const hasHistory = stats.sessionCount > 0 || stats.latest1RM > 0;
          const tierColor = TIER_COLORS[stats.tier];
          const analysis = stats.analysis;

          return (
            <div
              key={ex.idKey}
              onClick={() => openExerciseHistory(ex.idKey)}
              className={`border transition-all cursor-pointer flex flex-col justify-between gap-0 overflow-hidden ${
                hasHistory
                  ? 'bg-[#111113] border-[#262626] hover:border-neutral-500'
                  : 'bg-[#0d0d0f] border-[#1a1a1e] hover:border-[#333338] opacity-80'
              }`}
            >
              {/* Top: image strip + muscle diagram */}
              <div className="flex items-stretch">
                {/* Exercise photo — tall crop */}
                <div className="relative w-24 sm:w-28 flex-shrink-0">
                  <img
                    src={image}
                    alt={label}
                    className="w-full h-full object-cover"
                    style={{ minHeight: '110px' }}
                  />
                  {/* Compound/Iso overlay badge */}
                  <span className={`absolute top-2 left-2 text-[8px] font-black px-1.5 py-0.5 uppercase ${
                    isCompound ? 'bg-[#dc2626] text-white' : 'bg-black/70 text-neutral-400'
                  }`}>
                    {isCompound ? 'CMP' : 'ISO'}
                  </span>
                  {hasHistory && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#dc2626]" />
                  )}
                </div>

                {/* Centre: name + stats */}
                <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white truncate uppercase mb-0.5">{label}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase font-bold">
                      <span className="text-[#dc2626]">{ex.movementPattern}</span>
                      <span>·</span>
                      <span>{ex.equipment}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-neutral-300">{ex.primaryMuscle}</p>
                    {ex.secondaryMuscles.length > 0 && (
                      <p className="text-[10px] text-neutral-600 truncate mt-0.5">+{ex.secondaryMuscles.join(', ')}</p>
                    )}
                  </div>
                </div>

                {/* Right: muscle diagram */}
                <div className="flex-shrink-0 flex items-center justify-center px-2 bg-[#0a0a0c] border-l border-[#1a1a1e]">
                  <MuscleDiagram
                    exerciseId={ex.idKey}
                    muscleGroup={ex.primaryMuscle}
                    size={65}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#1a1a1e] bg-[#0c0c0e]">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-white">
                    {stats.latest1RM > 0 ? `${stats.latest1RM} kg` : '—'}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    {TIER_LABELS[stats.tier]}
                  </span>
                  <TierBadge tier={stats.tier} showLabel={false} size="sm" />
                  {analysis?.percentileFormatted && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#18181b] border border-[#27272a] text-neutral-300 font-bold">
                      {analysis.percentileFormatted}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-white uppercase font-semibold">
                  <span>Details</span>
                  <ChevronRight size={11} className="text-[#dc2626]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Detailed Drill-Down Modal ───────────────────────────────────────── */}
      <ExerciseHistoryModal
        exerciseId={selectedExerciseId}
        onClose={closeExerciseHistory}
        exerciseStats={selectedStats}
        exerciseDetails={selectedDetails}
        userDemographic={{
          gender: profile.gender,
          age: parseInt(profile.age, 10) || 25,
          currentWeight: parseFloat(profile.currentWeight) || 78.5,
        }}
        onSave1RM={update1RM}
      />
    </div>
  );
}
