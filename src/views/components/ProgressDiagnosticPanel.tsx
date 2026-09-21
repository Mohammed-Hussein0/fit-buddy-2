import { useState, useMemo } from 'react';
import { Card } from './ui';
import {
  TimeFrame,
  ExperienceLevel,
  evaluateUserProgress,
} from '../../models/services/ProgressDiagnosticEngine';
import { usePRStore } from '../../models/repositories/PRStore';
import { useMeasurementStore } from '../../models/repositories/MeasurementStore';
import { useProfileController } from '../../controllers/useProfileController';
import { AdaptationCurveChart } from './AdaptationCurveChart';
import {
  Activity,
  Zap,
  Sliders,
  Layers,
  Dumbbell,
  Maximize2,
  Clock,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export function ProgressDiagnosticPanel() {
  const { profile } = useProfileController();
  const personalRecords = usePRStore((s) => s.personalRecords);
  const measurements = useMeasurementStore((s) => s.measurements);

  const [timeframe, setTimeframe] = useState<TimeFrame>('6m');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Novice');
  const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);

  const ageNum = parseInt(profile.age, 10) || 25;
  const currentWeightNum = parseFloat(profile.currentWeight) || 78.5;
  const gender = profile.gender || 'Male';

  const diagnostic = useMemo(() => {
    return evaluateUserProgress({
      gender,
      age: ageNum,
      bodyweightKg: currentWeightNum,
      experienceLevel,
      timeframe,
      personalRecords,
      measurements,
    });
  }, [gender, ageNum, currentWeightNum, experienceLevel, timeframe, personalRecords, measurements]);

  const bwPow = Math.pow(currentWeightNum, 0.67).toFixed(2);

  return (
    <Card className="p-6 sm:p-8 lg:p-10 border border-[#27272a] space-y-8 sm:space-y-10">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="pb-6 border-b border-[#262626] space-y-3.5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="p-2.5 sm:p-3 bg-red-950/40 text-[#ef4444] border border-red-800/40 flex-shrink-0 flex items-center justify-center">
              <Activity size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <h3 className="text-sm sm:text-base lg:text-lg font-black uppercase text-white tracking-wider font-mono-stat">
                Progress Engine
              </h3>
              <span className="px-2.5 py-0.5 bg-[#18181b] border border-[#27272a] text-[10px] font-mono-stat text-[#dc2626] font-bold uppercase whitespace-nowrap">
                Tailored to your body
              </span>
            </div>
          </div>

          {/* How This Works: Opens the Scientific Methodology Popup Modal */}
          <button
            onClick={() => setShowMethodologyModal(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-[#141416] hover:bg-[#1a1a1d] text-white border border-[#27272a] hover:border-[#dc2626] text-xs font-mono-stat font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex-shrink-0 self-start xl:self-center"
          >
            <HelpCircle size={15} className="text-[#dc2626]" />
            <span>How it works</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-neutral-500 pl-0 sm:pl-[60px]">
          Personalized to your age, sex, and experience level. Tracks your strength, workout volume, pace of progress, and body shape.
        </p>
      </div>

      {/* ─── Controls: Timeframe Horizon & Training Age Sensitivity Matrix ────── */}
      <div className="space-y-6 p-6 sm:p-8 bg-[#121214] border border-[#262626]">
        {/* Timeframe Selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono-stat flex items-center gap-2">
              <Clock size={14} className="text-[#dc2626]" />
              Timeframe
            </label>
            <span className="text-xs text-neutral-500 font-mono-stat">
              <strong className="text-white uppercase">{diagnostic.timeframeLabel}</strong>
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 text-xs font-mono-stat">
            {(
              [
                { key: '1m', label: '1 MO', sub: 'Recent' },
                { key: '3m', label: '3 MO', sub: 'Quarter' },
                { key: '6m', label: '6 MO', sub: 'Standard' },
                { key: '1y', label: '1 YR', sub: 'Annual' },
                { key: 'lifetime', label: 'LIFE', sub: 'All Time' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeframe(t.key)}
                className={`py-3 sm:py-3.5 px-2 text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
                  timeframe === t.key
                    ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-md shadow-red-950/50'
                    : 'bg-[#18181b] text-neutral-400 border-[#27272a] hover:text-white hover:border-neutral-500'
                }`}
              >
                <span>{t.label}</span>
                <span className={`text-[9px] font-normal ${timeframe === t.key ? 'text-red-200' : 'text-neutral-500'}`}>
                  {t.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Training Age Sensitivity Matrix */}
        <div className="pt-5 border-t border-[#262626]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono-stat flex items-center gap-2">
              <Sliders size={14} className="text-[#dc2626]" />
              Experience level
            </label>
            <span className="text-[10px] font-bold uppercase text-neutral-500 font-mono-stat">
              Adjusts your expected rate of progress
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 font-mono-stat">
            {diagnostic.trainingAgeMatrix.map((item) => {
              const isSelected = experienceLevel === item.level;
              return (
                <button
                  key={item.level}
                  onClick={() => setExperienceLevel(item.level)}
                  className={`p-5 text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[220px] ${
                    isSelected
                      ? 'bg-[#1a0f0f] border-l-4 border-l-[#dc2626] border-y border-r border-[#dc2626] shadow-lg shadow-red-950/40'
                      : 'bg-[#18181b] border-[#27272a] hover:border-neutral-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
                        isSelected ? 'text-[#ef4444]' : 'text-white'
                      }`}>
                        {item.level}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 border ${
                        isSelected
                          ? 'bg-[#dc2626] text-white border-[#dc2626]'
                          : 'bg-[#27272a] text-neutral-300 border-[#3f3f46]'
                      }`}>
                        ×{item.modifier.toFixed(2)} MULTIPLIER
                      </span>
                    </div>

                    <div className="p-3 bg-[#0d0d0f] border border-[#222226] mb-3 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-neutral-400">Target for {timeframe.toUpperCase()}:</span>
                        <span className="font-black text-[#facc15] text-sm">+{item.expectedRateForCurrentTimeframe}%</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-neutral-500">
                        <span>6M: +{item.expected6mRate}%</span>
                        <span>1Y: +{item.expected1yRate}%</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                      {item.biologicalRationale}
                    </p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-[#262626] flex items-center justify-between text-[10px]">
                    <span className={isSelected ? 'text-[#ef4444] font-black' : 'text-neutral-500'}>
                      {isSelected ? 'ACTIVE SELECTION' : 'CLICK TO SELECT'}
                    </span>
                    <ArrowRight size={12} className={isSelected ? 'text-[#ef4444]' : 'text-neutral-600'} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dynamic Math Explainer Bar */}
          <div className="mt-4 p-4 sm:p-5 bg-[#0d0d0f] border-l-2 border-l-[#dc2626] border-y border-r border-[#262626] text-xs font-mono-stat space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                Your expected progress target
              </span>
              <span className="text-[11px] text-neutral-500">
                {diagnostic.baseGainRate}% base × {diagnostic.genderModifier.toFixed(2)} (sex) × {diagnostic.ageModifier.toFixed(2)} (age) × {diagnostic.experienceModifier.toFixed(2)} (experience)
              </span>
            </div>
            <p className="text-white font-black text-sm sm:text-base">
              = <span className="text-[#dc2626] font-black">+{diagnostic.expectedGainRate}%</span> over {diagnostic.timeframeLabel}
            </p>
            <p className="text-xs text-neutral-500 leading-relaxed font-sans">
              More experienced lifters naturally make progress in smaller, steady steps because they are closer to their natural potential — so expectations are adjusted accordingly.
            </p>
          </div>
        </div>
      </div>

      {/* ─── OVERVIEW & PROGRESSION DASHBOARD ─────────────────────────── */}
      <div className="space-y-8 sm:space-y-10">
          {/* Main Comparison Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Actual Gain Rate */}
            <div className="p-5 sm:p-6 bg-[#141416] border border-[#27272a] flex flex-col justify-between min-h-[170px]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Your progress
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 font-mono-stat">
                    Actual
                  </span>
                </div>
                <div className="font-mono-stat">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    +{diagnostic.actualGainRate}%
                  </span>
                  <p className="text-xs text-neutral-500 mt-1.5">
                    Strength score gain: <span className="text-white font-bold">+{diagnostic.actualDeltaAS} pts</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 w-full bg-[#18181b] h-2.5 border border-[#27272a] overflow-hidden">
                <div
                  className="h-full bg-[#22c55e] transition-all duration-300"
                  style={{ width: `${Math.min(100, (diagnostic.actualGainRate / (diagnostic.expectedGainRate || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Expected Ceiling Rate */}
            <div className="p-5 sm:p-6 bg-[#141416] border border-[#27272a] flex flex-col justify-between min-h-[170px]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Expected target
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#facc15]/10 text-[#facc15] border border-[#facc15]/30 font-mono-stat">
                    Target
                  </span>
                </div>
                <div className="font-mono-stat">
                  <span className="text-3xl sm:text-4xl font-black text-[#facc15] tracking-tight">
                    +{diagnostic.expectedGainRate}%
                  </span>
                  <p className="text-xs text-neutral-500 mt-1.5">
                    Based on: <span className="text-white font-bold">{gender}, {ageNum}y, {experienceLevel}</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 w-full bg-[#18181b] h-2.5 border border-[#27272a] overflow-hidden">
                <div className="h-full bg-[#facc15]" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Biological Modifiers Applied */}
            <div className="p-5 sm:p-6 bg-[#141416] border border-[#27272a] flex flex-col justify-between text-xs font-mono-stat min-h-[170px]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-3">
                  Adjustments applied
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Sex:</span>
                    <span className="text-white font-bold">{gender} (×{diagnostic.genderModifier.toFixed(2)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Age:</span>
                    <span className="text-white font-bold">{ageNum} yrs (×{diagnostic.ageModifier.toFixed(2)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Experience:</span>
                    <span className="text-white font-bold">{experienceLevel} (×{diagnostic.experienceModifier.toFixed(2)})</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#262626]">
                    <span className="text-neutral-500">Weight factor:</span>
                    <span className="text-[#dc2626] font-bold">{currentWeightNum}kg scale factor: {bwPow}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── THE PROGRESSION CURVE CHART ─── */}
          <div className="p-6 sm:p-8 bg-[#121214] border border-[#27272a] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262626]">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-[#facc15]" />
                  <h4 className="text-sm sm:text-base font-black uppercase text-white tracking-wider font-mono-stat">
                    TARGET PROGRESS VS. YOUR ACTUAL GAINS
                  </h4>
                  <span className="px-2.5 py-0.5 bg-[#262626] text-[10px] font-mono-stat text-neutral-300 font-bold uppercase">
                    1M · 3M · 6M · 1Y · LIFE
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 font-mono-stat mt-1.5">
                  Yellow Area = Target progress for your level ({experienceLevel}, {gender}, {ageNum} yrs). Green Line = Your actual progress.
                </p>
              </div>

              <div className="flex items-center gap-5 text-xs font-mono-stat">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-[#facc15] border border-black" />
                  <span className="text-[#facc15] font-black text-xs uppercase">Target Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-[#22c55e] border border-black" />
                  <span className="text-[#22c55e] font-black text-xs uppercase">Your Actual Gains</span>
                </div>
              </div>
            </div>

            {/* Chart Canvas with Expanded Height */}
            <AdaptationCurveChart data={diagnostic.curveData} activeTimeframe={timeframe} height={320} />

            {/* 5 Horizon Clickable Milestone Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 pt-3 border-t border-[#262626] text-center font-mono-stat">
              {diagnostic.curveData.map((pt) => {
                const isSelected = pt.timeframe === timeframe;
                const isOptimal = pt.actualRate >= pt.expectedRate;
                return (
                  <button
                    key={pt.timeframe}
                    onClick={() => setTimeframe(pt.timeframe)}
                    className={`p-3.5 border cursor-pointer text-left transition-all ${
                      isSelected
                        ? 'bg-[#1e1e24] border-[#dc2626] shadow-md'
                        : 'bg-[#161618] border-[#27272a] hover:border-neutral-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black mb-1.5">
                      <span className={isSelected ? 'text-[#ef4444]' : 'text-neutral-400'}>{pt.shortLabel}</span>
                      <span className={isOptimal ? 'text-[#22c55e]' : 'text-[#facc15]'}>
                        {isOptimal ? 'ON TRACK' : 'BEHIND'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-[#facc15]">Target: +{pt.expectedRate}%</p>
                    <p className="text-xs sm:text-sm font-black text-[#22c55e]">Actual: +{pt.actualRate}%</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Velocity Classification Card */}
          <div
            className="p-6 sm:p-8 border-l-4 bg-[#111113] border-y border-r border-[#262626] space-y-5"
            style={{ borderLeftColor: diagnostic.velocityColor }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-black uppercase tracking-wider font-mono-stat text-black"
                  style={{ backgroundColor: diagnostic.velocityColor }}
                >
                  {diagnostic.velocity}
                </span>
                <span className="text-xs sm:text-sm font-mono-stat text-neutral-500 font-bold">
                  Progress verdict
                </span>
              </div>

              <span className="text-xs sm:text-sm font-mono-stat text-neutral-500">
                Over <span className="text-white font-black">{diagnostic.timeframeLabel}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-[#262626] text-xs font-mono-stat">
              <div>
                <p className="text-[11px] font-bold uppercase text-neutral-500 tracking-wider">
                  Summary
                </p>
                <p className="text-sm sm:text-base font-black text-white mt-1">
                  {diagnostic.mathematicalReality}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase text-neutral-500 tracking-wider">
                  In plain terms
                </p>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1 leading-relaxed font-sans">
                  {diagnostic.physiologicalMeaning}
                </p>
              </div>
            </div>

            {/* Action Directive */}
            <div className="p-4 sm:p-5 bg-[#18181b] border border-[#27272a] text-xs sm:text-sm font-mono-stat flex items-start gap-3.5">
              <Zap size={18} className="text-[#dc2626] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white uppercase text-[11px] block">
                  Recommended next steps:
                </span>
                <p className="text-neutral-300 mt-1 leading-relaxed font-sans">{diagnostic.actionDirective}</p>
              </div>
            </div>
          </div>

          {/* ─── WHAT WE USE TO MEASURE PROGRESSION (THE 4 PILLARS) ─────────────────── */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#262626]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 bg-[#dc2626]" />
                <div>
                  <h4 className="text-sm sm:text-base font-black uppercase text-white tracking-wider font-mono-stat">
                    How you are progressing
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono-stat mt-0.5 block">
                    4 key areas tracked — strength gains, workout volume, pace of progress, and body shape
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-black uppercase px-2.5 py-1 bg-[#18181b] border border-[#27272a] text-white font-mono-stat">
                  Overall: <span className="text-[#dc2626]">{diagnostic.compositeWeightedScore}%</span>
                </span>
                <span className="text-[10px] text-neutral-600 font-mono-stat">
                  (30% strength · 25% volume · 20% pace · 25% body shape)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 font-mono-stat">
              {diagnostic.pillars.map((pillar) => {
                const Icon =
                  pillar.id === 'allometric'
                    ? Dumbbell
                    : pillar.id === 'volume'
                    ? Layers
                    : pillar.id === 'velocity'
                    ? Activity
                    : Maximize2;

                return (
                  <div
                    key={pillar.id}
                    className="p-5 sm:p-6 bg-[#121214] border-l-4 border-y border-r border-[#262626] space-y-4 font-mono-stat flex flex-col justify-between"
                    style={{ borderLeftColor: pillar.statusColor }}
                  >
                    <div className="space-y-4">
                      {/* Header: Name, Badge, Formula & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="p-2 border flex items-center justify-center"
                            style={{
                              borderColor: `${pillar.statusColor}40`,
                              backgroundColor: `${pillar.statusColor}15`,
                              color: pillar.statusColor,
                            }}
                          >
                            <Icon size={18} />
                          </div>
                          <div>
                            <h5 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">
                              {pillar.name}
                            </h5>
                            <span className="text-[10px] text-neutral-500 block mt-0.5 font-bold">
                              {pillar.badge} • {pillar.formula}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span
                            className="text-[10px] font-black px-2.5 py-1 border uppercase flex-shrink-0"
                            style={{
                              color: pillar.statusColor,
                              borderColor: `${pillar.statusColor}60`,
                              backgroundColor: `${pillar.statusColor}15`,
                            }}
                          >
                            {pillar.status}
                          </span>
                        </div>
                      </div>

                      {/* Diagnostic Weight Indicator */}
                      <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-[#222226]">
                        <span className="text-neutral-400 font-bold uppercase">WEIGHT IN OVERALL SCORE:</span>
                        <span
                          className={`px-2 py-0.5 font-black uppercase border ${
                            pillar.isSkeletallyConstrained
                              ? 'bg-blue-950/40 text-[#60a5fa] border-blue-800/40'
                              : 'bg-[#18181b] text-[#facc15] border-[#27272a]'
                          }`}
                        >
                          {pillar.weightBadge}
                        </span>
                      </div>

                      {/* Progress Scoreboard Box */}
                      <div className="p-4 bg-[#0d0d0f] border border-[#222226] space-y-2.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] text-neutral-400 uppercase font-black tracking-wider">
                            PROGRESS SCORE:
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className="text-2xl sm:text-3xl font-black tracking-tight"
                              style={{ color: pillar.statusColor }}
                            >
                              {pillar.scorePercent}%
                            </span>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase">
                              OF TARGET
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#18181b] h-2.5 border border-[#27272a] overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, pillar.scorePercent)}%`,
                              backgroundColor: pillar.statusColor,
                            }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] sm:text-[11px] text-neutral-400 pt-0.5">
                          <span>
                            Target: <strong className="text-white">{pillar.targetValue}</strong>
                          </span>
                          <span>
                            Actual: <strong style={{ color: pillar.statusColor }}>{pillar.actualValue}</strong>
                          </span>
                        </div>
                      </div>

                      {/* What It Isolates */}
                      <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                        <strong className="text-white">What this tracks:</strong> {pillar.whatItIsolates}
                      </p>

                       {/* Skeletal Frame / Measurement Info Note */}
                       {pillar.structuralNote && (
                         <div className="p-3 bg-[#0d1318] border border-blue-900/30 text-[11px] text-blue-300/80 font-sans space-y-1">
                           <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                             How this is measured
                           </span>
                           <p className="leading-relaxed text-neutral-400">
                             {pillar.structuralNote}
                           </p>
                         </div>
                       )}

                       {/* Where You Are Lacking — only shown when actually lacking */}
                       {(pillar.status === 'LACKING' || pillar.status === 'DEVELOPING') && pillar.whereLacking && (
                         <div className="p-3.5 bg-[#181212] border-l-2 border-l-[#ef4444] border-y border-r border-red-900/30 space-y-1">
                           <span className="text-[10px] font-semibold uppercase tracking-wider text-[#ef4444] flex items-center gap-1.5">
                             <AlertCircle size={11} className="text-[#ef4444]" />
                             Where to improve
                           </span>
                           <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                             {pillar.whereLacking}
                           </p>
                         </div>
                       )}
                     </div>

                     {/* Action Required — only shown when not surpassing */}
                     {pillar.status !== 'SURPASSING' && pillar.actionRequired && (
                       <div className="p-3.5 bg-[#0f1712] border-l-2 border-l-[#22c55e] border-y border-r border-green-900/30 space-y-1 mt-2">
                         <span className="text-[10px] font-semibold uppercase tracking-wider text-[#22c55e] flex items-center gap-1.5">
                           <Zap size={11} className="text-[#22c55e]" />
                           What to do
                         </span>
                         <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                           {pillar.actionRequired}
                         </p>
                       </div>
                     )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── INTEGRATED PHYSIOLOGY METRICS (6 CORE VARIABLES) ──────────────── */}
          <div className="space-y-6 pt-4 border-t border-[#262626]">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 bg-[#dc2626]" />
                <h4 className="text-sm font-black uppercase tracking-wider text-white font-mono-stat">
                  Key Fitness Indicators (What We Track)
                </h4>
              </div>
              <span className="text-xs font-mono-stat text-neutral-500">
                6 CORE MEASUREMENTS & SIGNALS
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 font-mono-stat text-xs">
              {diagnostic.metricsCorrelation.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-6 bg-[#121214] border border-[#262626] flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                >
                  <div className="space-y-1.5 md:max-w-[45%]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-white text-sm sm:text-base uppercase">{item.metric}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-red-950/60 text-red-400 border border-red-800/40">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-neutral-400 text-xs sm:text-[13px] leading-relaxed font-sans">{item.whatItShows}</p>
                  </div>

                  <div className="space-y-1.5 md:max-w-[35%]">
                    <p className="text-[11px] text-neutral-500 uppercase font-bold">Why It Matters:</p>
                    <p className="text-neutral-300 text-xs sm:text-[13px] leading-relaxed font-sans">{item.whyItMatters}</p>
                  </div>

                  <div className="text-right w-full md:w-auto flex md:flex-col justify-between items-center md:items-end border-t md:border-t-0 pt-3 md:pt-0 border-[#262626]">
                    <span className="text-lg font-black text-white tracking-tight">{item.userValue}</span>
                    <span
                      className="px-2.5 py-1 text-[10px] font-black uppercase mt-1.5 border"
                      style={{
                        color: item.statusColor,
                        borderColor: `${item.statusColor}50`,
                        backgroundColor: `${item.statusColor}15`,
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* ─── POPUP MODAL: SCIENTIFIC PROGRESSION & ADAPTATION METHODOLOGY ───── */}
      {showMethodologyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111113] border-2 border-[#dc2626] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-xs sm:text-sm font-mono-stat">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#262626]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-950/40 text-[#ef4444] border border-red-800/40">
                  <Activity size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wider">
                      How Your Progress Is Calculated
                    </h3>
                    <span className="px-2 py-0.5 bg-[#18181b] border border-[#27272a] text-[10px] text-[#facc15] font-black">
                      HOW IT WORKS
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Personalized benchmarks adjusted for your age, sex, and training background
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#27272a] transition-all cursor-pointer"
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: The 3-Step Mathematical Framework */}
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="p-5 bg-[#141416] border-l-4 border-l-[#dc2626] border-y border-r border-[#262626] space-y-3">
                <h4 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
                  STEP 1: PERSONALIZING YOUR TARGETS
                </h4>
                <p className="text-neutral-400 text-xs leading-relaxed font-sans">
                  Comparing every lifter against the exact same benchmark is not realistic. The system personalizes your progress targets based on your biological sex, age, and experience before evaluating your workouts.
                </p>
                <div className="p-3.5 bg-[#0a0a0c] border border-[#222226] text-white font-bold text-xs sm:text-sm text-center">
                  Expected Target = Base Rate × Sex Factor × Age Factor × Experience Factor
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 text-neutral-300">
                  <div className="p-3 bg-[#18181b] border border-[#27272a]">
                    <span className="font-bold text-[#ef4444] block mb-1">CASE A: 20-Year-Old Male Beginner</span>
                    <span>40% (6-Month Base) × 1.0 × 1.0 × 1.0 = <strong className="text-white font-black">40.0% Target</strong></span>
                  </div>
                  <div className="p-3 bg-[#18181b] border border-[#27272a]">
                    <span className="font-bold text-[#ef4444] block mb-1">CASE B: 42-Year-Old Female Beginner</span>
                    <span>40% (6-Month Base) × 0.70 × 0.85 × 1.0 = <strong className="text-white font-black">23.8% Target</strong></span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 bg-[#141416] border-l-4 border-l-[#22c55e] border-y border-r border-[#262626] space-y-3">
                <h4 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                  STEP 2: ADJUSTING FOR BODYWEIGHT (TRUE STRENGTH)
                </h4>
                <p className="text-neutral-400 text-xs leading-relaxed font-sans">
                  Adding weight to the bar while your body fat climbs isn't real strength progress—it's just extra body mass leverage. The system calculates a Strength Score by adjusting your 1RM relative to your bodyweight.
                </p>
                <div className="p-3.5 bg-[#0a0a0c] border border-[#222226] text-white font-bold text-center text-sm sm:text-base">
                  Strength Score = 1RM / Bodyweight^0.67
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-[#18181b] border border-[#27272a]">
                    <span className="font-bold text-[#22c55e] block mb-1">REAL MUSCLE & STRENGTH:</span>
                    <span className="text-neutral-300 font-sans">When your Strength Score climbs, you are building genuine muscle and force relative to your size.</span>
                  </div>
                  <div className="p-3 bg-[#18181b] border border-[#27272a]">
                    <span className="font-bold text-[#ef4444] block mb-1">FALSE PROGRESS:</span>
                    <span className="text-neutral-300 font-sans">If 1RM climbs but the score stays flat, gains are coming from scale weight rather than new muscle.</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 bg-[#141416] border-l-4 border-l-[#facc15] border-y border-r border-[#262626] space-y-3">
                <h4 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
                  STEP 3: READING YOUR PROGRESS STATUS
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#18181b] text-neutral-400 uppercase font-black border-b border-[#27272a]">
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Criteria</th>
                        <th className="p-2.5">Meaning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222226]">
                      <tr>
                        <td className="p-2.5 text-[#22c55e] font-black">ON TRACK</td>
                        <td className="p-2.5 text-white">Actual Gains ≥ Target</td>
                        <td className="p-2.5 text-neutral-300 font-sans">Your strength and muscle gains are moving at an excellent pace.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-[#eab308] font-black">MAKING PROGRESS</td>
                        <td className="p-2.5 text-white">Gains positive, below target</td>
                        <td className="p-2.5 text-neutral-300 font-sans">Making progress, but small tweaks to effort or nutrition will help.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-[#ef4444] font-black">PLATEAU / STALLED</td>
                        <td className="p-2.5 text-white">No measurable gains</td>
                        <td className="p-2.5 text-neutral-300 font-sans">Progress has leveled off. A short deload or routine change will help restart gains.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#262626] flex justify-end">
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="px-5 py-2.5 bg-[#dc2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all"
              >
                GOT IT, CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
