import { useRef, useState } from 'react';
import { Card, Button, Modal } from '../components/ui';
import { useAdviceController } from '../../controllers/useAdviceController';
import {
  Camera,
  Upload,
  Trash2,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Cpu,
  Zap,
  ArrowRight,
  Check,
  Calendar,
  Flame,
  ShieldCheck,
  Sliders,
  Plus,
  X,
  Dumbbell,
} from 'lucide-react';

const AVAILABLE_MUSCLES = [
  { key: 'arms', label: 'Arms' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'triceps', label: 'Triceps' },
  { key: 'forearms', label: 'Forearms' },
  { key: 'upper_chest', label: 'Upper Chest' },
  { key: 'chest', label: 'Chest' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'side_delts', label: 'Side Delts' },
  { key: 'rear_delts', label: 'Rear Delts' },
  { key: 'back', label: 'Back' },
  { key: 'lats', label: 'Lats' },
  { key: 'upper_back', label: 'Upper Back' },
  { key: 'traps', label: 'Traps' },
  { key: 'legs', label: 'Legs' },
  { key: 'quads', label: 'Quads' },
  { key: 'hamstrings', label: 'Hamstrings' },
  { key: 'calves', label: 'Calves' },
  { key: 'glutes', label: 'Glutes' },
  { key: 'abs', label: 'Abs / Core' },
];

export function AdviceView() {
  const {
    frontImage,
    backImage,
    isAnalyzing,
    analysisResult,
    error,
    showGuide,
    backendStatus,
    lackingMuscles,
    excellingMuscles,
    actionPlan,
    toggleLackingMuscle,
    toggleExcellingMuscle,
    isAdapting,
    adaptationResult,
    adaptationError,
    isAdaptingProgram,
    programAdaptationResult,
    programAdaptationError,
    programAppliedSuccess,
    getActiveProgram,
    getActiveWorkouts,
    activeExerciseMap,
    setPhoto,
    removePhoto,
    toggleGuide,
    submitAnalysis,
    resetAnalysis,
    adaptActiveProgram,
    applyAdaptedProgram,
    triggerAdaptationEngine,
    applyAdaptedRoutine,
    clearAdaptation,
  } = useAdviceController();

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const [singleAppliedSuccess, setSingleAppliedSuccess] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState(0);
  const [showMusclePicker, setShowMusclePicker] = useState<'lacking' | 'excelling' | null>(null);

  const activeProgram = getActiveProgram();
  const activeWorkouts = getActiveWorkouts().filter((w) => (activeExerciseMap[w.id] || []).length > 0);

  const handleFileChange = (slot: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(slot, file);
    }
  };

  const handleApplySingleAdapted = () => {
    const ok = applyAdaptedRoutine();
    if (ok) {
      setSingleAppliedSuccess(true);
      setTimeout(() => {
        setSingleAppliedSuccess(false);
        clearAdaptation();
      }, 3000);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-3 border-b-2 border-[#222226]">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-2.5 h-8 bg-[#dc2626] flex-shrink-0" />
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Physique & Symmetry Assessment
            </h2>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-xs sm:text-sm text-neutral-400 font-mono-stat">
              AI multi-modal vision analysis & Python routine adaptation engine
            </p>
            {/* Backend connection pill */}
            <span
              className={`px-2.5 py-0.5 text-[10px] font-mono-stat font-black uppercase tracking-wider border ${
                backendStatus.online
                  ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400'
                  : 'bg-[#18181b] border-[#27272a] text-neutral-400'
              }`}
            >
              {backendStatus.online
                ? backendStatus.llmReady
                  ? `● FASTAPI + ${backendStatus.provider === 'gemini' ? 'GEMINI 3.6 FLASH' : 'CLAUDE 3.5'} VISION ACTIVE`
                  : '● FASTAPI ACTIVE (KEY PENDING)'
                : '○ CLIENT SIMULATION MODE'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="secondary" size="md" onClick={toggleGuide} className="flex-1 sm:flex-none">
            <HelpCircle size={15} /> Photo Standards
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => triggerAdaptationEngine()}
            disabled={isAdapting}
            className="flex-1 sm:flex-none border-red-900/40 text-red-400 hover:text-white"
          >
            {isAdapting ? <RefreshCw size={15} className="animate-spin" /> : <Cpu size={15} />}
            Adapt Routine
          </Button>
        </div>
      </div>

      {/* ─── Photo Upload Area ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Front Photo Card */}
        <Card className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[320px] text-center border-dashed border-2 hover:border-[#dc2626] transition-colors relative group">
          <input
            type="file"
            ref={frontInputRef}
            accept="image/*"
            onChange={(e) => handleFileChange('front', e)}
            className="hidden"
          />

          {frontImage ? (
            <div className="relative w-full h-full min-h-[280px] rounded-lg overflow-hidden">
              <img
                src={frontImage}
                alt="Front View"
                className="w-full h-full object-cover max-h-[360px] rounded-lg"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => frontInputRef.current?.click()}
                >
                  <Upload size={15} /> Replace
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => removePhoto('front')}
                >
                  <Trash2 size={15} /> Delete
                </Button>
              </div>
              <div className="absolute top-3 left-3 bg-black/80 border border-[#27272a] px-2.5 py-1 rounded text-xs font-black uppercase text-white font-mono-stat">
                Front Shot
              </div>
            </div>
          ) : (
            <div
              onClick={() => frontInputRef.current?.click()}
              className="flex flex-col items-center cursor-pointer p-6 w-full h-full justify-center"
            >
              <div className="w-14 h-14 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-neutral-400 mb-3 group-hover:text-[#ef4444] transition-all">
                <Camera size={28} />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-wider">Front View</h4>
              <p className="text-xs text-neutral-400 mt-1.5 max-w-[220px] leading-relaxed">
                Neutral standing posture, shoulder to waist visible
              </p>
              <Button variant="secondary" size="md" className="mt-4 pointer-events-none">
                <Upload size={14} /> Select Image
              </Button>
            </div>
          )}
        </Card>

        {/* Back Photo Card */}
        <Card className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[320px] text-center border-dashed border-2 hover:border-[#dc2626] transition-colors relative group">
          <input
            type="file"
            ref={backInputRef}
            accept="image/*"
            onChange={(e) => handleFileChange('back', e)}
            className="hidden"
          />

          {backImage ? (
            <div className="relative w-full h-full min-h-[280px] rounded-lg overflow-hidden">
              <img
                src={backImage}
                alt="Back View"
                className="w-full h-full object-cover max-h-[360px] rounded-lg"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => backInputRef.current?.click()}
                >
                  <Upload size={15} /> Replace
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => removePhoto('back')}
                >
                  <Trash2 size={15} /> Delete
                </Button>
              </div>
              <div className="absolute top-3 left-3 bg-black/80 border border-[#27272a] px-2.5 py-1 rounded text-xs font-black uppercase text-white font-mono-stat">
                Back Shot
              </div>
            </div>
          ) : (
            <div
              onClick={() => backInputRef.current?.click()}
              className="flex flex-col items-center cursor-pointer p-6 w-full h-full justify-center"
            >
              <div className="w-14 h-14 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-neutral-400 mb-3 group-hover:text-[#ef4444] transition-all">
                <Camera size={28} />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-wider">Back View</h4>
              <p className="text-xs text-neutral-400 mt-1.5 max-w-[220px] leading-relaxed">
                Rear lat spread or neutral back silhouette
              </p>
              <Button variant="secondary" size="md" className="mt-4 pointer-events-none">
                <Upload size={14} /> Select Image
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Submit Action ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Button
          size="lg"
          onClick={submitAnalysis}
          disabled={!frontImage || !backImage || isAnalyzing}
          className="w-full sm:w-auto min-w-[280px]"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw size={18} className="animate-spin" /> Evaluating Proportions...
            </>
          ) : (
            <>
              <Layers size={18} /> Run Symmetry Evaluation
            </>
          )}
        </Button>
      </div>

      {/* ─── Results Card: Critique ──────────────────────────────────────── */}
      {analysisResult && (
        <Card className="p-6 sm:p-8 border-l-4 border-l-[#dc2626] animate-fade-in space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#27272a]">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-4 bg-[#dc2626] rounded-sm" />
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Physique Critique & Symmetry Breakdown
              </h3>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="ghost" size="md" onClick={resetAnalysis}>
                Clear
              </Button>
            </div>
          </div>

          <div className="text-xs sm:text-sm leading-relaxed space-y-3.5 whitespace-pre-wrap font-medium text-neutral-300 font-mono-stat">
            {analysisResult}
          </div>
        </Card>
      )}

      {/* ─── AI Routine Adaptation Blueprint Card ───────────────────────────── */}
      {analysisResult && (
        <Card className="p-6 sm:p-8 border border-[#27272a] bg-[#0c0c0e] animate-fade-in space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-950/40 text-red-400 border border-red-800/40 rounded">
                <Sliders size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wider">
                  AI Routine Adaptation Blueprint
                </h3>
                <p className="text-xs text-neutral-400 font-mono-stat mt-0.5">
                  Rebalances your currently running {activeWorkouts.length}-day split ({activeProgram?.title || 'Active Routine'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] text-[10px] font-mono-stat text-neutral-400 uppercase">
                {activeWorkouts.length} Days Split
              </span>
            </div>
          </div>

          {/* Pinpointed Weak / Lacking Areas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-[#ef4444]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Pinpointed Lacking Areas (Weak Muscles)
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-neutral-400 hover:text-white"
                onClick={() => setShowMusclePicker('lacking')}
              >
                <Plus size={13} /> Add Muscle
              </Button>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-mono-stat">
              The engine will inject compound movements on matching days and scale weekly isolation volume up to MEV.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {lackingMuscles.map((muscle) => {
                const label = AVAILABLE_MUSCLES.find((m) => m.key === muscle)?.label || muscle.replace('_', ' ').toUpperCase();
                return (
                  <span
                    key={muscle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 border border-red-700/60 text-red-300 text-xs font-bold font-mono-stat rounded"
                  >
                    <span>{label}</span>
                    <button
                      onClick={() => toggleLackingMuscle(muscle)}
                      className="hover:text-white text-red-400 ml-1"
                      title="Remove muscle"
                    >
                      <X size={13} />
                    </button>
                  </span>
                );
              })}
              {lackingMuscles.length === 0 && (
                <span className="text-xs text-neutral-500 italic">No lacking muscles selected. Click + Add Muscle to define focus areas.</span>
              )}
            </div>
          </div>

          {/* Pinpointed Dominant / Excelling Areas */}
          <div className="space-y-2 pt-2 border-t border-[#1f1f23]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#22c55e]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Pinpointed Excelling Areas (Dominant Muscles)
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-neutral-400 hover:text-white"
                onClick={() => setShowMusclePicker('excelling')}
              >
                <Plus size={13} /> Add Muscle
              </Button>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-mono-stat">
              Muscles with strong development where sets are reduced or capped to optimize recovery and prevent systemic fatigue.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {excellingMuscles.map((muscle) => {
                const label = AVAILABLE_MUSCLES.find((m) => m.key === muscle)?.label || muscle.replace('_', ' ').toUpperCase();
                return (
                  <span
                    key={muscle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-xs font-bold font-mono-stat rounded"
                  >
                    <span>{label}</span>
                    <button
                      onClick={() => toggleExcellingMuscle(muscle)}
                      className="hover:text-white text-emerald-400 ml-1"
                      title="Remove muscle"
                    >
                      <X size={13} />
                    </button>
                  </span>
                );
              })}
              {excellingMuscles.length === 0 && (
                <span className="text-xs text-neutral-500 italic">No dominant muscles selected.</span>
              )}
            </div>
          </div>

          {/* AI Action Plan Prescribed Movements */}
          {actionPlan && actionPlan.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#1f1f23]">
              <div className="flex items-center gap-2">
                <Dumbbell size={14} className="text-amber-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Prescribed Movements from Action Plan
                </h4>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-mono-stat">
                Specific exercises extracted from your physique critique that the engine will integrate into your routine:
              </p>
              <div className="space-y-2">
                {actionPlan.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#141416] border border-[#27272a] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-bold text-amber-400 font-mono-stat uppercase tracking-wide">
                        {item.exerciseName}
                      </span>
                      {item.cue && (
                        <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                          {item.cue}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] uppercase font-mono-stat px-2 py-0.5 bg-amber-950/40 text-amber-300 border border-amber-800/40 rounded whitespace-nowrap self-start sm:self-center">
                      Auto-Assigned
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Currently Running Routine Split Overview */}
          <div className="space-y-2.5 pt-2 border-t border-[#1f1f23]">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-neutral-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300">
                Current Active Routine ({activeWorkouts.length} Days)
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 font-mono-stat">
              {activeWorkouts.map((w, idx) => {
                const exCount = (activeExerciseMap[w.id] || []).length;
                return (
                  <div key={w.id} className="p-2.5 bg-[#141416] border border-[#27272a] rounded">
                    <p className="text-[10px] text-neutral-500 uppercase font-black">Day {idx + 1}</p>
                    <p className="text-xs font-bold text-white truncate mt-0.5">{w.title}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">{exCount} exercises</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {programAdaptationError && (
            <div className="p-3.5 rounded bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{programAdaptationError}</span>
            </div>
          )}

          {/* CTA: Run Multi-Day Adaptation */}
          <div className="pt-2">
            <Button
              size="lg"
              onClick={adaptActiveProgram}
              disabled={isAdaptingProgram}
              className="w-full justify-center text-sm font-black uppercase tracking-wider"
            >
              {isAdaptingProgram ? (
                <>
                  <RefreshCw size={17} className="animate-spin" /> Adapting All {activeWorkouts.length} Days with Engine...
                </>
              ) : (
                <>
                  <Zap size={17} /> Adapt Full {activeWorkouts.length}-Day Routine with Engine
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* ─── Multi-Day Program Adaptation Result Panel ───────────────────────── */}
      {programAdaptationResult && (
        <Card className="p-6 sm:p-8 border border-[#27272a] animate-fade-in bg-[#0f0f12] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#262626]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-950/40 text-red-400 border border-red-800/40 rounded">
                <Cpu size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wider">
                    Program Adaptation Decision Tree
                  </h3>
                  <span className="px-2 py-0.5 bg-[#18181b] border border-[#27272a] text-[10px] font-mono-stat text-neutral-400">
                    /api/engine/adapt-program
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono-stat mt-1">
                  Algorithmic changes applied across: {programAdaptationResult.program_name} ({programAdaptationResult.modified_days.length} Days)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {programAppliedSuccess ? (
                <span className="px-3.5 py-2 bg-[#14532d] text-[#4ade80] border border-[#22c55e] text-xs font-black uppercase font-mono-stat flex items-center gap-2 rounded">
                  <Check size={16} /> ALL {programAdaptationResult.modified_days.length} DAYS UPDATED
                </span>
              ) : (
                <Button size="md" onClick={applyAdaptedProgram}>
                  Apply Changes to Active Routine <ArrowRight size={15} />
                </Button>
              )}
            </div>
          </div>

          {/* Modifications Applied Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              Modifications Executed Across Split ({programAdaptationResult.modifications_applied.length})
            </h4>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {programAdaptationResult.modifications_applied.map((mod, idx) => {
                const badgeColors =
                  mod.action === 'COMPOUND_INJECTED'
                    ? 'bg-amber-950/50 text-[#facc15] border-amber-800/40'
                    : mod.action === 'VOLUME_INCREASE'
                    ? 'bg-emerald-950/50 text-[#4ade80] border-emerald-800/40'
                    : mod.action === 'VOLUME_DECREASE'
                    ? 'bg-red-950/50 text-[#ef4444] border-red-800/40'
                    : 'bg-blue-950/50 text-[#60a5fa] border-blue-800/40';

                return (
                  <div
                    key={idx}
                    className="p-3 bg-[#141416] border border-[#27272a] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-stat"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase border rounded ${badgeColors}`}>
                        {mod.action.replace('_', ' ')}
                      </span>
                      <span className="font-bold text-white uppercase">{mod.muscle_group}</span>
                    </div>
                    <span className="text-neutral-400 text-xs">{mod.details}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day-by-Day Adapted Split Preview */}
          <div className="space-y-4 pt-2 border-t border-[#1f1f23]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                Adapted Schedule (Day-by-Day)
              </h4>
              <span className="text-[11px] font-mono-stat text-neutral-500">
                Showing Day {selectedDayTab + 1} of {programAdaptationResult.modified_days.length}
              </span>
            </div>

            {/* Day Tabs */}
            <div className="flex flex-wrap gap-2">
              {programAdaptationResult.modified_days.map((day, idx) => (
                <button
                  key={day.day_id}
                  onClick={() => setSelectedDayTab(idx)}
                  className={`px-3 py-2 text-xs font-mono-stat font-bold uppercase transition-all rounded border ${
                    selectedDayTab === idx
                      ? 'bg-red-950/60 border-[#dc2626] text-white shadow-sm'
                      : 'bg-[#141416] border-[#27272a] text-neutral-400 hover:border-neutral-500 hover:text-neutral-200'
                  }`}
                >
                  Day {idx + 1}: {day.day_title} ({day.exercises.length})
                </button>
              ))}
            </div>

            {/* Selected Day Exercises */}
            {(() => {
              const currentDay = programAdaptationResult.modified_days[selectedDayTab] || programAdaptationResult.modified_days[0];
              if (!currentDay) return null;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 text-xs text-neutral-400 font-mono-stat">
                    <span>{currentDay.day_title} — Exercises</span>
                    <span>Total Exercises: {currentDay.exercises.length}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono-stat text-xs">
                    {currentDay.exercises.map((ex, i) => {
                      const isFirst = i === 0;
                      return (
                        <div
                          key={i}
                          className="p-3.5 bg-[#141416] border border-[#27272a] rounded flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-neutral-500 font-bold">{i + 1}.</span>
                              <p className="font-black text-white text-xs sm:text-sm">{ex.name}</p>
                            </div>
                            <p className="text-[10px] text-neutral-400 uppercase mt-0.5 ml-4">
                              {ex.muscle_group || 'Compound'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-white text-xs sm:text-sm">
                              {ex.sets} × {ex.reps}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Apply Button Footer */}
          <div className="pt-4 border-t border-[#1f1f23] flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-mono-stat">
              Ready to sync the adapted program to your active routine?
            </span>
            {programAppliedSuccess ? (
              <span className="px-4 py-2.5 bg-[#14532d] text-[#4ade80] border border-[#22c55e] text-xs font-black uppercase font-mono-stat flex items-center gap-2 rounded">
                <Check size={16} /> ACTIVE ROUTINE UPDATED
              </span>
            ) : (
              <Button size="md" onClick={applyAdaptedProgram}>
                Apply Changes to Active Routine <ArrowRight size={15} />
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ─── Single-Day Adaptation Result Panel (Legacy Fallback) ──────────── */}
      {adaptationResult && !programAdaptationResult && (
        <Card className="p-6 sm:p-8 border border-[#27272a] animate-fade-in bg-[#0f0f12] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#262626]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-950/40 text-red-400 border border-red-800/40 rounded">
                <Cpu size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wider">
                    Single-Day Routine Adaptation
                  </h3>
                  <span className="px-2 py-0.5 bg-[#18181b] border border-[#27272a] text-[10px] font-mono-stat text-neutral-400">
                    /api/engine/adapt-routine
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono-stat mt-1">
                  Algorithmic modifications applied to: {adaptationResult.routine_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {singleAppliedSuccess ? (
                <span className="px-3.5 py-2 bg-[#14532d] text-[#4ade80] border border-[#22c55e] text-xs font-black uppercase font-mono-stat flex items-center gap-2 rounded">
                  <Check size={16} /> ROUTINE UPDATED
                </span>
              ) : (
                <Button size="md" onClick={handleApplySingleAdapted}>
                  Apply Adapted Routine <ArrowRight size={15} />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              Modifications Executed ({adaptationResult.modifications_applied.length})
            </h4>

            {adaptationResult.modifications_applied.map((mod, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 bg-[#141416] border border-[#27272a] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-mono-stat"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 text-[10px] font-black uppercase border rounded bg-amber-950/50 text-[#facc15] border-amber-800/40">
                    {mod.action.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-white uppercase">{mod.muscle_group}</span>
                </div>
                <span className="text-neutral-400 text-xs sm:text-sm">{mod.details}</span>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3">
              Adapted Exercise Schedule ({adaptationResult.modified_routine.exercises.length} Exercises)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 font-mono-stat text-xs sm:text-sm">
              {adaptationResult.modified_routine.exercises.map((ex, i) => (
                <div
                  key={i}
                  className="p-3.5 sm:p-4 bg-[#141416] border border-[#27272a] rounded flex items-center justify-between"
                >
                  <div>
                    <p className="font-black text-white text-xs sm:text-sm">{ex.name}</p>
                    <p className="text-[10px] text-neutral-400 uppercase mt-0.5">{ex.muscle_group || 'Compound'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs sm:text-sm">{ex.sets} × {ex.reps}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ─── Muscle Picker Modal ───────────────────────────────────────────── */}
      {showMusclePicker && (
        <Modal
          isOpen={!!showMusclePicker}
          onClose={() => setShowMusclePicker(null)}
          title={showMusclePicker === 'lacking' ? 'Add Lacking Muscle (Weak Area)' : 'Add Excelling Muscle (Dominant Area)'}
        >
          <div className="space-y-3">
            <p className="text-xs text-neutral-400">
              Select a muscle to add to your {showMusclePicker === 'lacking' ? 'lacking / focus' : 'excelling / dominant'} target list:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_MUSCLES.map((m) => {
                const isLacking = lackingMuscles.includes(m.key);
                const isExcelling = excellingMuscles.includes(m.key);
                const isSelected = showMusclePicker === 'lacking' ? isLacking : isExcelling;
                return (
                  <button
                    key={m.key}
                    onClick={() => {
                      if (showMusclePicker === 'lacking') {
                        toggleLackingMuscle(m.key);
                      } else {
                        toggleExcellingMuscle(m.key);
                      }
                      setShowMusclePicker(null);
                    }}
                    className={`p-2.5 text-xs font-bold text-left border rounded transition-all ${
                      isSelected
                        ? 'bg-neutral-800 border-white text-white'
                        : 'bg-[#141416] border-[#27272a] text-neutral-300 hover:border-neutral-500'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* Guidelines Modal */}
      <Modal isOpen={showGuide} onClose={toggleGuide} title="Photo Protocol">
        <div className="space-y-3.5 text-xs text-neutral-300">
          <p className="font-bold text-white">Guidelines for consistent physique monitoring:</p>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="text-[#ef4444] flex-shrink-0 mt-0.5" />
              <span><strong>Directional Light:</strong> Soft front lighting without intense top-down downlighting.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="text-[#ef4444] flex-shrink-0 mt-0.5" />
              <span><strong>Distance:</strong> 2 to 3 meters back, camera positioned around mid-chest height.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="text-[#ef4444] flex-shrink-0 mt-0.5" />
              <span><strong>Stance:</strong> Feet shoulder width, arms slightly away from sides to reveal the waist-to-shoulder taper.</span>
            </li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}
