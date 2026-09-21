import { useState, useMemo, useEffect } from 'react';
import { Modal, Card } from '../components/ui';
import { TierBadge } from '../components/TierBadge';
import { HistoryChart } from '../components/HistoryChart';
import { MuscleDiagram } from '../components/MuscleDiagram';
import { EXERCISE_LABELS, EXERCISE_IMAGES, ExerciseId, LibraryExercise } from '../../models/types/Exercise';
import { ExerciseMediaService } from '../../models/services/ExerciseMediaService';
import { TIER_LABELS, TIER_COLORS, Tier, getPercentileColor } from '../../models/types/StrengthStandards';
import { calculateLifterPercentile, calculateEpley1RM } from '../../models/services/StrengthEngine';
import { ArrowUpCircle, Trophy, Dumbbell, Target, Check, Shield, Users, Activity, Play, ExternalLink, RotateCw, BookOpen, Video } from 'lucide-react';

interface ExerciseHistoryModalProps {
  exerciseId: ExerciseId | null;
  onClose: () => void;
  exerciseStats: any;
  exerciseDetails?: LibraryExercise;
  userDemographic?: {
    gender: string;
    age: number;
    currentWeight: number;
  };
  onSave1RM?: (exerciseId: string, oneRM: number) => void;
}

export function ExerciseHistoryModal({
  exerciseId,
  onClose,
  exerciseStats,
  exerciseDetails,
  userDemographic,
  onSave1RM,
}: ExerciseHistoryModalProps) {
  if (!exerciseId || !exerciseStats) return null;

  const label = EXERCISE_LABELS[exerciseId] || exerciseId;
  const image = EXERCISE_IMAGES[exerciseId];

  // Free-Exercise-DB media & instructions + YouTube Video Tutorial
  const media = useMemo(() => (exerciseId ? ExerciseMediaService.getMedia(exerciseId) : null), [exerciseId]);
  const images = useMemo(() => (media?.images && media.images.length > 0 ? media.images : image ? [image] : []), [media, image]);
  const instructions = useMemo(() => media?.instructions || [], [media]);
  const videoTutorialUrl = useMemo(() => ExerciseMediaService.getVideoTutorialUrl(label), [label]);

  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play interval alternating between setup & peak contraction frames
  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFrameIdx((prev) => (prev + 1) % images.length);
    }, 900);
    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length]);

  const defaultBW = userDemographic?.currentWeight || 78.5;
  const defaultAge = userDemographic?.age || 25;
  const defaultGender = userDemographic?.gender || 'Male';

  // Interactive 1RM Benchmarking states
  const [testWeight, setTestWeight] = useState<string>(
    exerciseStats.latest1RM > 0 ? String(exerciseStats.latest1RM) : '80'
  );
  const [testReps, setTestReps] = useState<string>('1');
  const [inputMode, setInputMode] = useState<'direct' | 'reps'>('direct');
  const [customBW, setCustomBW] = useState<string>(String(defaultBW));
  const [customAge, setCustomAge] = useState<string>(String(defaultAge));
  const [customGender, setCustomGender] = useState<string>(defaultGender);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Compute tested 1RM
  const parsedWeight = parseFloat(testWeight) || 0;
  const parsedReps = parseInt(testReps, 10) || 1;
  const computed1RM = useMemo(() => {
    if (inputMode === 'direct') {
      return parsedWeight;
    }
    return calculateEpley1RM(parsedWeight, parsedReps);
  }, [inputMode, parsedWeight, parsedReps]);

  // Compute demographic strength analysis with active inputs
  const testedBW = parseFloat(customBW) || defaultBW;
  const testedAge = parseInt(customAge, 10) || defaultAge;
  const activeAnalysis = useMemo(() => {
    return calculateLifterPercentile(
      exerciseId,
      computed1RM > 0 ? computed1RM : exerciseStats.latest1RM,
      testedBW,
      customGender,
      testedAge
    );
  }, [exerciseId, computed1RM, exerciseStats.latest1RM, testedBW, customGender, testedAge]);

  const {
    latest1RM,
    tier,
    thresholds,
    allometricScore,
    gainPct,
    history,
  } = exerciseStats;

  const tierColor = TIER_COLORS[activeAnalysis.tier as Tier];

  const handleSavePR = () => {
    if (computed1RM > 0 && onSave1RM) {
      onSave1RM(exerciseId, computed1RM);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <Modal isOpen={!!exerciseId} onClose={onClose} title={label} maxWidth="max-w-4xl">
      <div className="space-y-6 sm:space-y-8 font-mono-stat text-neutral-200">
        {/* ─── Hero Overview Card (Strict Brutalist + Anatomy Vector) ─── */}
        <div className="p-5 sm:p-6 bg-[#111113] border-l-4 border-l-[#dc2626] border-y border-r border-[#262626] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            {image && (
              <img
                src={image}
                alt={label}
                className="w-16 h-16 sm:w-18 sm:h-18 object-cover bg-neutral-950 border border-[#262626] flex-shrink-0"
              />
            )}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#1f1f23] text-neutral-300 border border-[#2e2e34]">
                  {exerciseDetails?.mechanics || 'COMPOUND'}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#3b0d0c] text-red-400 border border-[#7f1d1d]">
                  {exerciseDetails?.movementPattern || 'MOVEMENT'}
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                {TIER_LABELS[activeAnalysis.tier as Tier]} LEVEL
              </h4>
              <TierBadge tier={activeAnalysis.tier} showLabel={false} size="sm" className="items-start mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-right sm:text-left flex-wrap">
            <div className="p-3 bg-[#09090b] border border-[#262626]">
              <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">CURRENT 1RM</p>
              <p className="text-base sm:text-lg font-black text-white mt-0.5">{latest1RM > 0 ? `${latest1RM} kg` : 'UNTESTED'}</p>
            </div>
            <div className="p-3 bg-[#09090b] border border-[#262626] flex flex-col justify-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">STRENGTH RATING</p>
              <div className="mt-1 flex items-center justify-start">
                <TierBadge tier={activeAnalysis.tier} showLabel={false} size="sm" />
              </div>
            </div>
            <div className="p-3 bg-[#09090b] border border-[#262626]">
              <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">PERCENTILE</p>
              <p className="text-base sm:text-lg font-black text-white mt-0.5">
                {activeAnalysis.percentileFormatted}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Anatomical Classification Section (Simplified Language) ─── */}
        <div className="p-5 sm:p-6 bg-[#141417] border border-[#262626] space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div className="flex items-center gap-2.5">
              <Shield size={16} className="text-[#dc2626]" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Muscles Worked & Exercise Details
              </h4>
            </div>
            <span className="text-[10px] text-neutral-400 uppercase font-mono-stat">
              MUSCLE MAP
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            {/* Visual Muscle Silhouette */}
            <div className="p-4 bg-[#0a0a0c] border border-[#262626] flex flex-col items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">
                TARGET MUSCLES
              </span>
              <MuscleDiagram
                exerciseId={exerciseId}
                muscleGroup={exerciseDetails?.primaryMuscle || ''}
                size={130}
                showTooltip={true}
              />
              <span className="text-[10px] font-black uppercase text-[#ef4444] mt-2">
                {exerciseDetails?.primaryMuscle}
              </span>
            </div>

            {/* Primary Main Muscle */}
            <div className="p-4 sm:p-5 bg-[#0a0a0c] border-l-4 border-l-[#dc2626] border-y border-r border-[#262626] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Target size={15} className="text-[#dc2626]" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-red-400">
                    MAIN MUSCLE
                  </p>
                </div>
                <p className="text-base font-black text-white uppercase tracking-tight">
                  {exerciseDetails?.primaryMuscle || 'Primary Driver'}
                </p>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Does most of the work during this exercise.
                </p>
              </div>
              <div className="pt-3 border-t border-[#1e1e22] mt-3">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">
                  Pattern: {exerciseDetails?.movementPattern}
                </span>
              </div>
            </div>

            {/* Secondary Muscles */}
            <div className="p-4 sm:p-5 bg-[#0a0a0c] border-l-4 border-l-[#facc15] border-y border-r border-[#262626] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Activity size={15} className="text-[#facc15]" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#facc15]">
                    SUPPORTING MUSCLES
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {exerciseDetails?.secondaryMuscles && exerciseDetails.secondaryMuscles.length > 0 ? (
                    exerciseDetails.secondaryMuscles.map((muscle, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[#18181b] border border-[#2e2e34] text-xs font-bold text-neutral-200 uppercase"
                      >
                        {muscle}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-500">None logged</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-3 pt-3 border-t border-[#1e1e22]">
                Help stabilize the weight and assist the movement.
              </p>
            </div>
          </div>

          {/* Movement Details & Form Cues */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#222226] text-xs">
            <div className="p-3 bg-[#09090b] border border-[#222226]">
              <span className="text-[9px] font-black text-neutral-400 uppercase block">Movement Pattern</span>
              <span className="font-bold text-white uppercase text-xs truncate block mt-0.5">
                {exerciseDetails?.movementPattern || 'Compound'}
              </span>
            </div>
            <div className="p-3 bg-[#09090b] border border-[#222226]">
              <span className="text-[9px] font-black text-neutral-400 uppercase block">Mechanics</span>
              <span className="font-bold text-white uppercase text-xs block mt-0.5">
                {exerciseDetails?.mechanics || 'Compound'}
              </span>
            </div>
            <div className="p-3 bg-[#09090b] border border-[#222226]">
              <span className="text-[9px] font-black text-neutral-400 uppercase block">Equipment</span>
              <span className="font-bold text-white uppercase text-xs block mt-0.5">
                {exerciseDetails?.equipment || 'Free Weight'}
              </span>
            </div>
            <div className="p-3 bg-[#09090b] border border-[#222226]">
              <span className="text-[9px] font-black text-neutral-400 uppercase block">Movement Type</span>
              <span className="font-bold text-white uppercase text-xs block mt-0.5">
                {exerciseDetails?.forceType || 'Push'}
              </span>
            </div>
          </div>

          {exerciseDetails?.description && (
            <p className="text-xs text-neutral-300 bg-[#09090b] p-3.5 border border-[#222226] leading-relaxed">
              <strong className="text-white uppercase font-black">Form Tip: </strong>
              {exerciseDetails.description}
            </p>
          )}
        </div>

        {/* ─── HD Form Execution & Video Tutorial (Free-Exercise-DB + YouTube) ─── */}
        <div className="p-5 sm:p-6 bg-[#141417] border border-[#262626] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
            <div className="flex items-center gap-2.5">
              <Video size={16} className="text-[#dc2626]" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                HD Movement Form & Video Coaching
              </h4>
            </div>
            <a
              href={videoTutorialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-black uppercase tracking-wider transition-colors border border-[#dc2626] shadow-sm cursor-pointer"
            >
              <Play size={13} fill="currentColor" />
              <span>Watch Video Tutorial</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Visual Frame / Motion Demo Player */}
            <div className="md:col-span-5 flex flex-col space-y-2.5">
              <div className="relative aspect-[4/3] w-full bg-black border border-[#262626] overflow-hidden flex items-center justify-center">
                {images.length > 0 ? (
                  <img
                    src={images[activeFrameIdx] || images[0]}
                    alt={`${label} Frame ${activeFrameIdx + 1}`}
                    className="w-full h-full object-contain transition-all duration-200"
                  />
                ) : (
                  <span className="text-neutral-500 text-xs uppercase font-bold">No Image Available</span>
                )}

                {/* Frame indicator badge */}
                {images.length > 1 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 border border-[#333338] text-[9px] font-black uppercase text-white font-mono-stat">
                    {activeFrameIdx === 0 ? 'Phase 1: Setup' : 'Phase 2: Contraction'}
                  </div>
                )}

                {/* Animated Loop Status */}
                {images.length > 1 && (
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`absolute bottom-2 right-2 px-2 py-1 text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isAutoPlaying
                        ? 'bg-[#dc2626] text-white border-[#dc2626]'
                        : 'bg-black/80 text-neutral-400 border-[#333338] hover:text-white'
                    }`}
                  >
                    <RotateCw size={10} className={isAutoPlaying ? 'animate-spin' : ''} />
                    <span>{isAutoPlaying ? 'Looping' : 'Paused'}</span>
                  </button>
                )}
              </div>

              {/* Frame selector pills */}
              {images.length > 1 && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setActiveFrameIdx(0);
                      setIsAutoPlaying(false);
                    }}
                    className={`px-2.5 py-1.5 text-[10px] font-black uppercase border transition-all cursor-pointer ${
                      activeFrameIdx === 0 && !isAutoPlaying
                        ? 'bg-[#dc2626] text-white border-[#dc2626]'
                        : 'bg-[#18181b] text-neutral-400 border-[#262626] hover:text-white'
                    }`}
                  >
                    1. Setup
                  </button>
                  <button
                    onClick={() => {
                      setActiveFrameIdx(1);
                      setIsAutoPlaying(false);
                    }}
                    className={`px-2.5 py-1.5 text-[10px] font-black uppercase border transition-all cursor-pointer ${
                      activeFrameIdx === 1 && !isAutoPlaying
                        ? 'bg-[#dc2626] text-white border-[#dc2626]'
                        : 'bg-[#18181b] text-neutral-400 border-[#262626] hover:text-white'
                    }`}
                  >
                    2. Contraction
                  </button>
                </div>
              )}
            </div>

            {/* Step-by-Step Instructions & Coaching Cues */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-[#dc2626]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    Step-by-Step Execution
                  </span>
                </div>

                {instructions.length > 0 ? (
                  <ol className="space-y-2 text-xs text-neutral-300 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                    {instructions.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 bg-[#09090b] p-2.5 border border-[#222226] leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-[#18181b] border border-[#333338] text-[10px] font-black text-[#dc2626] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-neutral-400 bg-[#09090b] p-3 border border-[#222226]">
                    Maintain a solid foundation, control the eccentric portion for 2-3 seconds, and execute with full range of motion.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Interactive 1RM Benchmark & Demographic Strength Test ─── */}
        <div className="p-5 sm:p-6 bg-[#111113] border-2 border-[#333338] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3.5">
            <div className="flex items-center gap-2.5">
              <Dumbbell size={18} className="text-[#dc2626]" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Estimate Your 1RM & Compare With Others
              </h4>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-[#3b0d0c] text-red-400 border border-[#7f1d1d]">
              AGE · WEIGHT · GENDER ADJUSTED
            </span>
          </div>

          {/* Mode Switcher: Direct 1RM vs Weight × Reps */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setInputMode('direct')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider border cursor-pointer transition-colors ${
                inputMode === 'direct'
                  ? 'bg-[#dc2626] text-white border-[#dc2626]'
                  : 'bg-[#18181b] text-neutral-400 border-[#262626] hover:text-white'
              }`}
            >
              Direct 1RM (KG)
            </button>
            <button
              onClick={() => setInputMode('reps')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider border cursor-pointer transition-colors ${
                inputMode === 'reps'
                  ? 'bg-[#dc2626] text-white border-[#dc2626]'
                  : 'bg-[#18181b] text-neutral-400 border-[#262626] hover:text-white'
              }`}
            >
              Weight × Reps Calculator
            </button>
          </div>

          {/* Input Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#09090b] border border-[#222226]">
            {inputMode === 'direct' ? (
              <div className="sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5 flex items-center justify-between">
                  <span>1RM Lifted</span>
                  <span className="text-[9px] text-[#facc15] font-mono normal-case tracking-normal">({activeAnalysis.unitLabel})</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={testWeight}
                  onChange={(e) => setTestWeight(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#333338] px-3.5 py-2.5 text-base font-black text-white focus:outline-none focus:border-[#dc2626]"
                  placeholder="e.g. 100"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5 flex items-center justify-between">
                    <span>Load Lifted</span>
                    <span className="text-[9px] text-[#facc15] font-mono normal-case tracking-normal">({activeAnalysis.unitLabel})</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={testWeight}
                    onChange={(e) => setTestWeight(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#333338] px-3.5 py-2.5 text-base font-black text-white focus:outline-none focus:border-[#dc2626]"
                    placeholder="e.g. 85"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Reps Completed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={testReps}
                    onChange={(e) => setTestReps(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#333338] px-3.5 py-2.5 text-base font-black text-white focus:outline-none focus:border-[#dc2626]"
                    placeholder="e.g. 6"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Calculated 1RM (Epley)
                  </label>
                  <div className="px-3.5 py-2.5 bg-[#141416] border border-[#333338] text-base font-black text-[#facc15]">
                    {computed1RM.toFixed(1)} KG
                  </div>
                </div>
              </>
            )}

            {/* Demographic Tweaker */}
            <div className={inputMode === 'direct' ? 'sm:col-span-2' : 'sm:col-span-3'}>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Sex
                  </label>
                  <select
                    value={customGender}
                    onChange={(e) => setCustomGender(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#333338] px-3 py-2.5 text-xs sm:text-sm font-black text-white focus:outline-none"
                  >
                    <option value="Male">Male (1.00x)</option>
                    <option value="Female">Female (0.70x)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    value={customAge}
                    onChange={(e) => setCustomAge(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#333338] px-3 py-2.5 text-xs sm:text-sm font-black text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5">
                    BW (KG)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={customBW}
                    onChange={(e) => setCustomBW(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#333338] px-3 py-2.5 text-xs sm:text-sm font-black text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── Live Demographic Strength Analysis Result Card ─── */}
          {/* ─── Live Demographic Strength Analysis Result Card (Minimalist Segmented Gauge) ─── */}
          <div className="p-5 sm:p-6 bg-[#0c0c0e] border border-[#27272a] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#dc2626]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    WHERE YOU RANK
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight mt-1">
                  STRONGER THAN <span className="text-[#ef4444] font-black">{activeAnalysis.percentileFormatted}</span> OF LIFTERS
                </h3>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  STRENGTH LEVEL
                </span>
                <span className="text-base font-black uppercase tracking-wide text-white">
                  {activeAnalysis.ratingTitle}
                </span>
                <div className="flex justify-end mt-1">
                  <TierBadge tier={activeAnalysis.tier} showLabel={false} size="sm" />
                </div>
              </div>
            </div>

            {/* Minimalist Segmented Gauge: 5 Dark Pill Segments */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {[
                  { tier: 1, name: 'Beginner', min: 0, max: 15 },
                  { tier: 2, name: 'Novice', min: 15, max: 45 },
                  { tier: 3, name: 'Intermediate', min: 45, max: 75 },
                  { tier: 4, name: 'Advanced', min: 75, max: 92 },
                  { tier: 5, name: 'Elite', min: 92, max: 100 },
                ].map((item) => {
                  const isAchieved = activeAnalysis.percentile >= item.max;
                  const isCurrent = activeAnalysis.percentile >= item.min && activeAnalysis.percentile < item.max;
                  const fillPct = isAchieved
                    ? 100
                    : isCurrent
                    ? Math.max(8, Math.min(95, ((activeAnalysis.percentile - item.min) / (item.max - item.min)) * 100))
                    : 0;

                  return (
                    <div key={item.tier} className="space-y-2">
                      {/* Segment Pill Track */}
                      <div className={`w-full h-3 rounded-xs border relative overflow-hidden transition-all ${
                        isCurrent 
                          ? 'bg-[#18181b] border-[#dc2626]' 
                          : isAchieved 
                          ? 'bg-[#1c1917] border-[#dc2626]/50' 
                          : 'bg-[#121214] border-[#222226]'
                      }`}>
                        {fillPct > 0 && (
                          <div
                            className={`h-full transition-all duration-300 ${
                              isAchieved ? 'bg-[#dc2626]' : 'bg-[#ef4444]'
                            }`}
                            style={{ width: `${fillPct}%` }}
                          />
                        )}
                        {isCurrent && (
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_6px_#ffffff] -ml-0.5"
                            style={{ left: `${fillPct}%` }}
                          />
                        )}
                      </div>

                      {/* Text Details */}
                      <div className="text-center">
                        <p
                          className={`text-[10px] font-black uppercase tracking-wider truncate ${
                            isCurrent ? 'text-white' : isAchieved ? 'text-neutral-300' : 'text-neutral-600'
                          }`}
                        >
                          {item.name}
                        </p>
                        <span
                          className={`text-[9px] font-mono block mt-0.5 ${
                            isCurrent ? 'text-[#ef4444] font-bold' : 'text-neutral-600'
                          }`}
                        >
                          {item.min}–{item.max}%
                        </span>
                        {isCurrent && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#dc2626] text-white text-[8px] font-black uppercase tracking-wider font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparison Text */}
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed border-t border-[#222226] pt-3">
              {activeAnalysis.comparisonSummary}
            </p>

            {/* Save 1RM Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
              <div className="text-xs text-neutral-400">
                Strength Level: <strong className="text-white font-mono-stat">{activeAnalysis.tierLabel}</strong> ({activeAnalysis.tier} of 5 Stars)
              </div>
              <div className="flex items-center gap-3">
                {savedSuccess && (
                  <span className="text-xs font-black text-green-400 flex items-center gap-1.5">
                    <Check size={15} /> SAVED AS OFFICIAL 1RM!
                  </span>
                )}
                <button
                  onClick={handleSavePR}
                  className="px-5 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-black uppercase tracking-wider cursor-pointer border border-[#ef4444] transition-colors flex items-center gap-2"
                >
                  <Trophy size={15} />
                  <span>Save as Official 1RM / PR</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Next Tier Advice Banner */}
        {activeAnalysis.kgToNextTier !== null && activeAnalysis.kgToNextTier > 0 && (
          <div className="flex items-center gap-3 p-4 bg-[#111113] border-l-2 border-l-[#dc2626] border-y border-r border-[#262626] text-xs sm:text-sm text-neutral-300">
            <ArrowUpCircle size={18} className="text-[#dc2626] flex-shrink-0" />
            <span className="text-xs sm:text-sm">
              Need <strong className="text-white font-black">{activeAnalysis.kgToNextTier.toFixed(1)} kg</strong> to advance to{' '}
              <strong className="text-white font-bold">
                {activeAnalysis.nextTierLabel}
              </strong>.
            </span>
          </div>
        )}

        {activeAnalysis.tier === 5 && (
          <div className="flex items-center gap-3 p-4 bg-red-950/60 border border-red-800/60 text-xs sm:text-sm text-[#ef4444]">
            <Trophy size={18} className="flex-shrink-0" />
            <span className="text-xs sm:text-sm">
              <strong>Elite Level Achieved.</strong> You meet the top 1.5% competitive lifter threshold for this movement.
            </span>
          </div>
        )}

        {/* ─── Standards Table ─── */}
        {activeAnalysis.thresholds && (
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span>Strength Standards by Level (Age {testedAge} · Weight {testedBW}kg · {customGender})</span>
              <span className="text-neutral-400 font-mono normal-case tracking-normal text-[10px]">[{activeAnalysis.unitLabel}]</span>
            </h4>
            <div className="grid grid-cols-5 gap-2.5 text-center text-xs">
              {(['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'] as const).map((lvl, idx) => {
                const tNum = (idx + 1) as Tier;
                const isCurrent = tNum === activeAnalysis.tier;
                return (
                  <div
                    key={lvl}
                    className={`p-3 border transition-all ${
                      isCurrent
                        ? 'bg-[#18181b] border-[#dc2626] text-white font-black ring-1 ring-[#dc2626]'
                        : 'bg-[#121214] border-[#27272a] text-neutral-400'
                    }`}
                  >
                    <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isCurrent ? 'text-[#ef4444]' : 'text-neutral-400'}`}>
                      {lvl.slice(0, 5)}
                    </p>
                    <p className="text-sm font-black">{activeAnalysis.thresholds[idx]} kg</p>
                    {isCurrent && (
                      <span className="inline-block mt-1.5 text-[8px] font-black px-1.5 py-0.5 bg-[#dc2626] text-white uppercase font-mono">
                        YOU
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── 1RM Progression Line Chart ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              1RM History & Overload Progression
            </h4>
            {gainPct !== null && (
              <span className={`text-xs font-black ${gainPct >= 0 ? 'text-[#ef4444]' : 'text-neutral-400'}`}>
                {gainPct >= 0 ? '+' : ''}{gainPct}% Total Gain
              </span>
            )}
          </div>
          <Card className="p-5 bg-black/70 border border-[#262626]">
            <HistoryChart data={history} color={tierColor} height={220} />
          </Card>
        </div>

        {/* ─── Recent Session Logs ─── */}
        {history.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Historical Session Logs
              </h4>
              <span className="text-[9px] text-neutral-500 font-bold uppercase">
                Recorded session dates & years
              </span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {history.map((s: any, idx: number) => {
                const sessionDate = new Date(s.date);
                const formattedDate = sessionDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-[#18181b] border border-[#27272a] text-xs font-mono-stat"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-[11px]">
                          {formattedDate} · {s.workoutTitle || 'Workout'}
                        </p>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {s.sets ? `${s.sets.length} sets` : '1 set'} · Vol: {s.totalVolume || s.bestEpley1RM} kg
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-white text-xs">{s.bestEpley1RM} kg</span>
                      <span className="text-[#ef4444] text-[9px] block font-bold">1RM</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
