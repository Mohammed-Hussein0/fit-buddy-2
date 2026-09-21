import { useState } from 'react';
import { Card } from '../components/ui';
import { VolumeChart } from '../components/VolumeChart';
import { TierBadge } from '../components/TierBadge';
import { ProgressDiagnosticPanel } from '../components/ProgressDiagnosticPanel';
import { ExerciseHistoryModal } from './ExerciseHistoryModal';
import { MuscleDiagram } from '../components/MuscleDiagram';
import { useStatsController } from '../../controllers/useStatsController';
import {
  EXERCISE_LABELS,
  EXERCISE_IMAGES,
  COMPOUND_EXERCISES,
  MUSCLE_GROUPS,
  MOVEMENT_PATTERN_CATEGORIES,
} from '../../models/types/Exercise';
import { TIER_COLORS, TIER_LABELS, getPercentileColor } from '../../models/types/StrengthStandards';
import { ChevronRight, ArrowUpRight, Search, Dumbbell, Shield, Activity, Target, CheckSquare, Square, Filter, Scale, TrendingUp, Layers } from 'lucide-react';

interface StatsViewProps {
  userId?: string;
}

export function StatsView({ userId }: StatsViewProps) {
  const {
    volumeSummary,
    top5ExerciseIds,
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

  const [activeTab, setActiveTab] = useState<'diagnostics' | 'compounds' | 'framework'>('diagnostics');
  const selectedStats = selectedExerciseId ? getExerciseStats(selectedExerciseId) : null;
  const selectedDetails = selectedExerciseId ? getExerciseDetails(selectedExerciseId) : undefined;

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in font-mono-stat">

      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#1e1e22]">
        <div className="w-1 h-8 bg-[#dc2626] flex-shrink-0" />
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Statistics</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Volume, strength, and progress over time</p>
        </div>
      </div>

      {/* ─── Volume Card ─────────────────────────────────────────────────────── */}
      <Card className="p-6 sm:p-8 bg-[#111113] border border-[#1e1e22]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-5 border-b border-[#1e1e22]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-white">Weekly volume</h3>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-[#1a1a1e] text-[#dc2626] border border-[#dc2626]/30">
                sets × reps × weight
              </span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {(volumeSummary.thisWeekVolume / 1000).toFixed(1)}
                <span className="text-lg text-neutral-400 font-bold ml-1">t</span>
              </span>
              {volumeSummary.percentChange !== null && (
                <span className={`inline-flex items-center text-xs font-bold px-2 py-1 ${
                  volumeSummary.percentChange >= 0
                    ? 'bg-[#14532d]/50 text-[#4ade80] border border-[#22c55e]/40'
                    : 'bg-[#3b0d0c]/50 text-red-400 border border-[#7f1d1d]/40'
                }`}>
                  <ArrowUpRight size={13} className={volumeSummary.percentChange < 0 ? 'rotate-90' : ''} />
                  {volumeSummary.percentChange >= 0 ? '+' : ''}{volumeSummary.percentChange}%
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-neutral-400">
            <div>
              <span className="text-[10px] uppercase text-neutral-600 block mb-0.5">Last week</span>
              <strong className="text-white text-base">{(volumeSummary.lastWeekVolume / 1000).toFixed(1)}t</strong>
            </div>
            <div className="h-8 w-px bg-[#1e1e22]" />
            <div>
              <span className="text-[10px] uppercase text-neutral-600 block mb-0.5">Trend</span>
              <span className={`font-bold text-base ${
                (volumeSummary.percentChange || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
              }`}>
                {(volumeSummary.percentChange || 0) >= 0 ? 'Up' : 'Down'}
              </span>
            </div>
          </div>
        </div>

        <VolumeChart data={volumeSummary.weeklyData} height={220} />
      </Card>

      {/* ─── Stats Sub-Navigation ────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-[#1e1e22] overflow-x-auto scrollbar-none">
        {[
          { key: 'diagnostics' as const, label: 'Progress' },
          { key: 'compounds' as const, label: 'Top lifts' },
          { key: 'framework' as const, label: 'How it works' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-white border-[#dc2626]'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: PROGRESS ───────────────────────────────────────────────────── */}
      {activeTab === 'diagnostics' && <ProgressDiagnosticPanel />}

      {/* ─── TAB: TOP LIFTS ──────────────────────────────────────────────────── */}
      {activeTab === 'compounds' && (
        <div className="space-y-6 sm:space-y-8">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-white">Top compound lifts</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Your most-trained movements, ranked by strength level</p>
              </div>
              <span className="text-xs font-mono text-neutral-500 hidden sm:block">
                5-Star Strength Rating
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {top5ExerciseIds.map((exerciseId) => {
                const stats = getExerciseStats(exerciseId);
                const label = EXERCISE_LABELS[exerciseId] || exerciseId;
                const image = EXERCISE_IMAGES[exerciseId];
                const tierColor = TIER_COLORS[stats.tier];

                return (
                  <Card
                    key={exerciseId}
                    onClick={() => openExerciseHistory(exerciseId)}
                    className="p-5 sm:p-6 cursor-pointer hover:border-neutral-500 transition-all flex flex-col justify-between gap-4 border border-[#1e1e22] bg-[#111113]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={image}
                            alt={label}
                            className="w-12 h-12 sm:w-14 sm:h-14 object-cover bg-neutral-900 flex-shrink-0 border border-[#1e1e22]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                                {COMPOUND_EXERCISES.has(exerciseId) ? 'Compound' : 'Accessory'}
                              </span>
                              <ChevronRight size={13} className="text-neutral-600 sm:hidden" />
                            </div>
                            <h4 className="text-sm font-bold text-white truncate">{label}</h4>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              {stats.sessionCount} sessions · <span className="text-neutral-400">{getExerciseDetails(exerciseId)?.primaryMuscle}</span>
                            </p>
                          </div>
                        </div>

                        {/* Muscle Anatomy Diagram */}
                        <div className="hidden sm:flex flex-col items-center bg-[#09090b] p-1.5 border border-[#1e1e22] flex-shrink-0">
                          <MuscleDiagram
                            exerciseId={exerciseId}
                            muscleGroup={getExerciseDetails(exerciseId)?.primaryMuscle || ''}
                            size={55}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-3 bg-[#0c0c0e] border border-[#1a1a1e] text-center">
                        <div>
                          <p className="text-[9px] font-semibold text-neutral-500 uppercase mb-1">1RM</p>
                          <p className="text-sm font-black text-white">
                            {stats.latest1RM > 0 ? `${stats.latest1RM}kg` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-neutral-500 uppercase mb-1">Rating</p>
                          <div className="flex items-center justify-center h-5">
                            <TierBadge tier={stats.tier} showLabel={false} size="sm" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-neutral-500 uppercase mb-1">Gain</p>
                          <p className={`text-sm font-black mt-0 ${
                            (stats.gainPct || 0) >= 0 ? 'text-[#22c55e]' : 'text-neutral-500'
                          }`}>
                            {stats.gainPct !== null ? `${stats.gainPct >= 0 ? '+' : ''}${stats.gainPct}%` : '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#1a1a1e] flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        {TIER_LABELS[stats.tier]}
                      </span>
                      {stats.analysis?.percentileFormatted ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#18181b] border border-[#27272a] text-neutral-300 font-bold">
                          {stats.analysis.percentileFormatted}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-600">—</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: HOW IT WORKS ───────────────────────────────────────────────── */}
      {activeTab === 'framework' && (
        <div className="space-y-8 sm:space-y-10">

          {/* Metrics table with Vector Visuals */}
          <div className="overflow-x-auto border border-[#1e1e22]">
            <table className="w-full text-left text-xs sm:text-sm min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-[#161618] text-neutral-400 uppercase font-semibold tracking-wider text-xs">
                  <th className="py-3.5 px-5 w-1/3 border-r border-[#1e1e22]">Metric</th>
                  <th className="py-3.5 px-5 w-1/3 border-r border-[#1e1e22]">What it shows</th>
                  <th className="py-3.5 px-5 w-1/3">Why it matters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1e] bg-[#111113] text-neutral-300 font-sans">
                <tr>
                  <td className="py-4 sm:py-5 px-5 border-r border-[#1a1a1e] align-top">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded bg-red-950/40 text-[#ef4444] border border-red-800/30 flex-shrink-0">
                        <Scale size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">1RM vs body weight</p>
                        <span className="inline-block mt-1.5 text-[9px] font-semibold px-2 py-0.5 bg-[#1a1a1e] text-[#dc2626] border border-[#dc2626]/30 uppercase font-mono-stat">
                          Strength ratio
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5 border-r border-[#1a1a1e] align-top text-xs sm:text-sm leading-relaxed">
                    Estimated 1RM divided by body weight, tracked over time.
                  </td>
                  <td className="py-4 sm:py-5 px-5 align-top text-xs sm:text-sm leading-relaxed">
                    Removes weight class bias. A 2× bodyweight lift means the same regardless of body size.
                  </td>
                </tr>

                <tr>
                  <td className="py-4 sm:py-5 px-5 border-r border-[#1a1a1e] align-top">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded bg-red-950/40 text-[#ef4444] border border-red-800/30 flex-shrink-0">
                        <Target size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">1RM vs measurements</p>
                        <span className="inline-block mt-1.5 text-[9px] font-semibold px-2 py-0.5 bg-[#1a1a1e] text-[#dc2626] border border-[#dc2626]/30 uppercase font-mono-stat">
                          Muscle vs neural
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5 border-r border-[#1a1a1e] align-top text-xs sm:text-sm leading-relaxed">
                    Cross-references 1RM against the corresponding body measurement.
                  </td>
                  <td className="py-4 sm:py-5 px-5 align-top text-xs sm:text-sm leading-relaxed">
                    Measurement up + stalled 1RM = technique gap. 1RM up + no size change = skill adaptation.
                  </td>
                </tr>

                <tr>
                  <td className="py-4 sm:py-5 px-5 border-r border-[#1a1a1e] align-top">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded bg-red-950/40 text-[#ef4444] border border-red-800/30 flex-shrink-0">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Measurements vs scale weight</p>
                        <span className="inline-block mt-1.5 text-[9px] font-semibold px-2 py-0.5 bg-[#1a1a1e] text-[#dc2626] border border-[#dc2626]/30 uppercase font-mono-stat">
                          Recomp indicator
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5 border-r border-[#1a1a1e] align-top text-xs sm:text-sm leading-relaxed">
                    How measurements change relative to scale weight — e.g. waist shrinking while weight is flat.
                  </td>
                  <td className="py-4 sm:py-5 px-5 align-top text-xs sm:text-sm leading-relaxed">
                    The scale hides recomposition. Measurement changes show actual fat loss and muscle gain.
                  </td>
                </tr>

                <tr>
                  <td className="py-4 sm:py-5 px-5 border-r border-[#1a1a1e] align-top">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded bg-red-950/40 text-[#ef4444] border border-red-800/30 flex-shrink-0">
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Upper body vs waist</p>
                        <span className="inline-block mt-1.5 text-[9px] font-semibold px-2 py-0.5 bg-[#1a1a1e] text-[#dc2626] border border-[#dc2626]/30 uppercase font-mono-stat">
                          Shape & V-Taper
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5 border-r border-[#1a1a1e] align-top text-xs sm:text-sm leading-relaxed">
                    Shoulder/chest divided by waist, tracked over time.
                  </td>
                  <td className="py-4 sm:py-5 px-5 align-top text-xs sm:text-sm leading-relaxed">
                    An improving ratio means the physique is changing in the right direction.
                  </td>
                </tr>

                <tr>
                  <td className="py-4 sm:py-5 px-5 border-r border-[#1a1a1e] align-top">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded bg-red-950/40 text-[#ef4444] border border-red-800/30 flex-shrink-0">
                        <Layers size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Volume load over time</p>
                        <span className="inline-block mt-1.5 text-[9px] font-semibold px-2 py-0.5 bg-[#1a1a1e] text-[#dc2626] border border-[#dc2626]/30 uppercase font-mono-stat">
                          Progressive Overload
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5 border-r border-[#1a1a1e] align-top text-xs sm:text-sm leading-relaxed">
                    Weekly sets × reps × weight per muscle group.
                  </td>
                  <td className="py-4 sm:py-5 px-5 align-top text-xs sm:text-sm leading-relaxed">
                    1RM can plateau while volume keeps climbing — that's still real progress.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* How the scoring works */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-[#dc2626]" />
              <h3 className="text-sm font-bold text-white">
                Step 1 — Setting individual targets
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Everyone has a different ceiling. Raw gain benchmarks are adjusted for your sex, age, and training experience before your results are assessed.
            </p>

            <div className="p-4 sm:p-5 bg-[#111113] border-l-2 border-l-[#dc2626] border-y border-r border-[#1e1e22] text-sm font-bold text-white text-center">
              Your ceiling = Base rate × Sex × Age modifier
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 space-y-2 bg-[#111113] border border-[#1e1e22]">
                <p className="text-xs font-bold text-[#dc2626] uppercase tracking-wider">
                  Example A — 20yo male, beginner
                </p>
                <p className="text-xs text-neutral-500">Starts with 100% of the baseline.</p>
                <p className="text-sm font-black text-white pt-1">
                  40% <span className="text-neutral-500 text-xs font-normal">(6-month base)</span> × 1.0 × 1.0 = <span className="text-[#dc2626]">40%</span>
                </p>
              </Card>

              <Card className="p-5 space-y-2 bg-[#111113] border border-[#1e1e22]">
                <p className="text-xs font-bold text-[#dc2626] uppercase tracking-wider">
                  Example B — 42yo female, beginner
                </p>
                <p className="text-xs text-neutral-500">Adjusted for hormonal and recovery differences.</p>
                <p className="text-sm font-black text-white pt-1">
                  40% <span className="text-neutral-500 text-xs font-normal">(6-month base)</span> × 0.70 × 0.85 = <span className="text-[#dc2626]">23.8%</span>
                </p>
              </Card>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-[#dc2626]" />
              <h3 className="text-sm font-bold text-white">
                Step 2 — Stripping out weight gain as a false signal
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Lifting more weight as your body gets heavier is not real progress — it's just leverage. The allometric score removes that distortion.
            </p>

            <div className="p-4 sm:p-5 bg-[#111113] border-l-2 border-l-[#dc2626] border-y border-r border-[#1e1e22] text-lg font-black text-white text-center">
              Score = 1RM / BW<span className="text-[#dc2626]">^0.67</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 space-y-2 bg-[#111113] border border-[#1e1e22]">
                <p className="text-xs font-bold text-[#22c55e] uppercase tracking-wider">
                  Real progress
                </p>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Score increases over time → you built actual muscle, not just mass.
                </p>
              </Card>

              <Card className="p-5 space-y-2 bg-[#111113] border border-[#1e1e22]">
                <p className="text-xs font-bold text-[#ef4444] uppercase tracking-wider">
                  False positive
                </p>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  1RM goes up but score stays flat → you just got heavier, not stronger.
                </p>
              </Card>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-[#dc2626]" />
              <h3 className="text-sm font-bold text-white">
                Step 3 — Reading your result
              </h3>
            </div>

            <div className="space-y-2.5">
              <div className="p-4 sm:p-5 bg-[#111113] border border-[#1e1e22] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="px-3 py-1.5 bg-[#15803d]/50 text-[#4ade80] text-xs font-bold tracking-wider uppercase inline-block sm:w-48 text-center border border-[#22c55e]/40">
                  On track
                </span>
                <span className="text-xs sm:text-sm text-white font-bold">Actual ≥ your target</span>
                <span className="text-xs text-neutral-500 sm:max-w-xs">Progress is at or above your expected pace.</span>
              </div>

              <div className="p-4 sm:p-5 bg-[#111113] border border-[#1e1e22] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="px-3 py-1.5 bg-[#854d0e]/50 text-[#fbbf24] text-xs font-bold tracking-wider uppercase inline-block sm:w-48 text-center border border-[#eab308]/40">
                  Making progress
                </span>
                <span className="text-xs sm:text-sm text-white font-bold">0 &lt; Actual &lt; Target</span>
                <span className="text-xs text-neutral-500 sm:max-w-xs">Gains are positive, but slightly below target. Check workout consistency or intensity.</span>
              </div>

              <div className="p-4 sm:p-5 bg-[#111113] border border-[#1e1e22] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="px-3 py-1.5 bg-[#7f1d1d]/50 text-[#f87171] text-xs font-bold tracking-wider uppercase inline-block sm:w-48 text-center border border-[#ef4444]/40">
                  Plateau
                </span>
                <span className="text-xs sm:text-sm text-white font-bold">Actual ≤ 0</span>
                <span className="text-xs text-neutral-500 sm:max-w-xs">No gains recorded. Take a light deload week or refresh your routine.</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Drill-down Modal */}
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
