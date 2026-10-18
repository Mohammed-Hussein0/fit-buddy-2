import React, { useState, useMemo } from 'react';
import { Modal, Button, Card } from './ui';
import {
  THE_BIG_4_MOVEMENTS,
  CompoundMovementKey,
  PeriodAssessmentFormState,
  evaluatePeriodProgress,
  applyPeriodAssessmentToAccount,
  PeriodAssessmentResult,
} from '../../models/services/PeriodProgressService';
import { calculateEpley1RM } from '../../models/services/StrengthEngine';
import { ExperienceLevel } from '../../models/services/ProgressDiagnosticEngine';
import { useProfileController } from '../../controllers/useProfileController';
import { TierBadge } from './TierBadge';
import { preventMinusKeyDown, sanitizePositiveNumber } from '../../utils/numberInputUtils';
import {
  Calendar,
  Dumbbell,
  Ruler,
  Scale,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  ChevronRight,
  Info,
  Check,
  Zap,
  Activity,
  Layers,
  Award,
  Sliders,
  AlertTriangle,
} from 'lucide-react';

interface PeriodProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PeriodProgressModal({ isOpen, onClose }: PeriodProgressModalProps) {
  const { profile, saveEdit } = useProfileController();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Default dates: 90 days ago -> today
  const defaultEndDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split('T')[0];
  }, []);

  const [form, setForm] = useState<PeriodAssessmentFormState>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    startBodyweightKg: '',
    endBodyweightKg: profile.currentWeight || '',
    startMeasurements: {
      waist_cm: '',
      chest_cm: '',
      arm_cm: '',
      thigh_cm: '',
      shoulders_cm: '',
      hip_cm: '',
    },
    endMeasurements: {
      waist_cm: '',
      chest_cm: '',
      arm_cm: '',
      thigh_cm: '',
      shoulders_cm: '',
      hip_cm: '',
    },
    lifts: {
      bench: {
        enabled: true,
        startWeight: '',
        startReps: '',
        start1RM: 0,
        endWeight: '',
        endReps: '',
        end1RM: 0,
      },
      squat: {
        enabled: true,
        startWeight: '',
        startReps: '',
        start1RM: 0,
        endWeight: '',
        endReps: '',
        end1RM: 0,
      },
      deadlift: {
        enabled: false,
        startWeight: '',
        startReps: '',
        start1RM: 0,
        endWeight: '',
        endReps: '',
        end1RM: 0,
      },
      row: {
        enabled: false,
        startWeight: '',
        startReps: '',
        start1RM: 0,
        endWeight: '',
        endReps: '',
        end1RM: 0,
      },
    },
  });

  // Quick preset helper
  const handleApplyPreset = (daysAgo: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysAgo);
    setForm((prev) => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }));
  };

  // Helper to count valid entered compound lifts
  const validLiftsCount = useMemo(() => {
    let count = 0;
    const keys: CompoundMovementKey[] = ['bench', 'squat', 'deadlift', 'row'];
    for (const k of keys) {
      const l = form.lifts[k];
      if (!l || !l.enabled) continue;
      const s1RM = l.start1RM > 0 ? l.start1RM : (parseFloat(l.startWeight) > 0 && parseInt(l.startReps, 10) > 0 ? calculateEpley1RM(parseFloat(l.startWeight), parseInt(l.startReps, 10)) : 0);
      const e1RM = l.end1RM > 0 ? l.end1RM : (parseFloat(l.endWeight) > 0 && parseInt(l.endReps, 10) > 0 ? calculateEpley1RM(parseFloat(l.endWeight), parseInt(l.endReps, 10)) : 0);
      if (s1RM > 0 && e1RM > 0) count++;
    }
    return count;
  }, [form.lifts]);

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(() => {
    const raw = (profile.experienceLevel || '').toLowerCase();
    if (raw === 'intermediate') return 'Intermediate';
    if (raw === 'advanced') return 'Advanced';
    if (raw === 'elite') return 'Elite';
    return 'Novice';
  });

  // Run evaluation
  const evaluationResult = useMemo(() => {
    const age = parseInt(profile.age, 10) || 25;
    const gender = profile.gender || 'Male';

    return evaluatePeriodProgress(form, {
      experienceLevel,
      age,
      gender,
    });
  }, [form, profile, experienceLevel]);

  // Lift toggle & change handlers
  const handleToggleLift = (key: CompoundMovementKey) => {
    setForm((prev) => ({
      ...prev,
      lifts: {
        ...prev.lifts,
        [key]: {
          ...prev.lifts[key],
          enabled: !prev.lifts[key].enabled,
        },
      },
    }));
  };

  const handleLiftFieldChange = (
    key: CompoundMovementKey,
    field: 'startWeight' | 'startReps' | 'start1RM' | 'endWeight' | 'endReps' | 'end1RM',
    value: string
  ) => {
    setForm((prev) => {
      const current = prev.lifts[key];
      const updated = { ...current };

      if (field === 'start1RM' || field === 'end1RM') {
        const num = Math.max(0, parseFloat(value) || 0);
        updated[field] = isNaN(num) ? 0 : num;
      } else {
        const allowDecimals = field === 'startWeight' || field === 'endWeight';
        const cleanedValue = sanitizePositiveNumber(value, allowDecimals);
        updated[field] = cleanedValue;
        // If user typed weight & reps, auto-calculate 1RM
        if (field === 'startWeight' || field === 'startReps') {
          const w = field === 'startWeight' ? parseFloat(cleanedValue) : parseFloat(current.startWeight);
          const r = field === 'startReps' ? parseInt(cleanedValue, 10) : parseInt(current.startReps, 10);
          if (w > 0 && r > 0) {
            updated.start1RM = calculateEpley1RM(w, r);
          }
        }
        if (field === 'endWeight' || field === 'endReps') {
          const w = field === 'endWeight' ? parseFloat(cleanedValue) : parseFloat(current.endWeight);
          const r = field === 'endReps' ? parseInt(cleanedValue, 10) : parseInt(current.endReps, 10);
          if (w > 0 && r > 0) {
            updated.end1RM = calculateEpley1RM(w, r);
          }
        }
      }

      return {
        ...prev,
        lifts: {
          ...prev.lifts,
          [key]: updated,
        },
      };
    });
  };

  const handleApplyToAccount = async () => {
    if (!evaluationResult.result) return;
    setIsApplying(true);
    try {
      const ok = await applyPeriodAssessmentToAccount(
        form,
        evaluationResult.result,
        (w) => saveEdit('currentWeight', w)
      );
      if (ok) {
        saveEdit('experienceLevel', experienceLevel.toLowerCase());
        setAppliedSuccess(true);
      }
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assess Progress Over Period" maxWidth="max-w-3xl">
      <div className="space-y-6 font-mono-stat text-neutral-200">
        {/* ─── Guided Step Indicator ────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pb-3 border-b border-[#262626]">
          {[
            { step: 1 as const, label: '1. Dates & BW', icon: Calendar },
            {
              step: 2 as const,
              label: `2. Big 4 (${validLiftsCount}/2)`,
              icon: Dumbbell,
              badge: validLiftsCount >= 2 ? 'ready' : undefined,
            },
            { step: 3 as const, label: '3. Measures', icon: Ruler },
            { step: 4 as const, label: '4. Evaluation', icon: TrendingUp },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.step;
            const isCompleted = activeStep > s.step;

            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStep(s.step)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2 text-center transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#dc2626]/20 border-[#dc2626] text-white'
                    : isCompleted
                    ? 'bg-[#18181b] border-[#27272a] text-neutral-300 hover:text-white'
                    : 'bg-[#121214] border-[#1e1e22] text-neutral-500 hover:text-neutral-400'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#ef4444]' : isCompleted ? 'text-[#22c55e]' : ''} />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                  {s.label}
                </span>
                {s.badge === 'ready' && (
                  <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                )}
              </button>
            );
          })}
        </div>

        {/* ─── STEP 1: DATES & BODYWEIGHT ───────────────────────────────────── */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-[#141416] border border-[#27272a]">
              <div className="flex items-center gap-2 mb-1.5 text-white">
                <Clock size={16} className="text-[#dc2626]" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  Select Evaluation Timeframe
                </h4>
              </div>
              <p className="text-[11px] text-neutral-400">
                Choose the start and end dates for your training period or pick a quick preset below.
              </p>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#222226]">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider self-center mr-1">
                  Presets:
                </span>
                {[
                  { label: '30 Days', days: 30 },
                  { label: '3 Months (90d)', days: 90 },
                  { label: '6 Months (180d)', days: 180 },
                  { label: '1 Year (365d)', days: 365 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset.days)}
                    className="px-2.5 py-1 text-[10px] uppercase font-bold bg-[#1e1e24] hover:bg-[#282830] text-neutral-300 hover:text-white border border-[#2e2e36] transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#111113] border border-[#262626]">
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-[#18181b] border border-[#333338] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#dc2626]"
                />
              </div>

              <div className="p-4 bg-[#111113] border border-[#262626]">
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-[#18181b] border border-[#333338] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#dc2626]"
                />
              </div>
            </div>

            {/* Bodyweight Inputs */}
            <div className="p-5 bg-[#141416] border border-[#27272a] space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Scale size={16} className="text-[#dc2626]" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  Body Weight Transition
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Start Bodyweight (kg) <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 78.5"
                    value={form.startBodyweightKg}
                    onKeyDown={preventMinusKeyDown}
                    onChange={(e) => setForm((prev) => ({ ...prev, startBodyweightKg: sanitizePositiveNumber(e.target.value, true) }))}
                    className="w-full bg-[#18181b] border border-[#333338] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    End Bodyweight (kg) <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 81.2"
                    value={form.endBodyweightKg}
                    onKeyDown={preventMinusKeyDown}
                    onChange={(e) => setForm((prev) => ({ ...prev, endBodyweightKg: sanitizePositiveNumber(e.target.value, true) }))}
                    className="w-full bg-[#18181b] border border-[#333338] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>
              </div>

              {/* Weight delta preview */}
              {parseFloat(form.startBodyweightKg) > 0 && parseFloat(form.endBodyweightKg) > 0 && (
                <div className="p-3 bg-[#18181c] border border-[#26262b] flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-bold uppercase text-[10px]">Weight Trajectory:</span>
                  <div className="flex items-center gap-2 font-black">
                    <span className="text-neutral-300">{form.startBodyweightKg} kg</span>
                    <ArrowRight size={12} className="text-neutral-500" />
                    <span className="text-white">{form.endBodyweightKg} kg</span>
                    {(() => {
                      const delta = parseFloat((parseFloat(form.endBodyweightKg) - parseFloat(form.startBodyweightKg)).toFixed(1));
                      const pct = parseFloat(((delta / parseFloat(form.startBodyweightKg)) * 100).toFixed(1));
                      const color = delta > 0 ? 'text-[#22c55e]' : delta < 0 ? 'text-[#3b82f6]' : 'text-neutral-400';
                      return (
                        <span className={`px-2 py-0.5 bg-black/40 border border-[#333338] ${color}`}>
                          {delta > 0 ? '+' : ''}{delta} kg ({pct > 0 ? '+' : ''}{pct}%)
                        </span>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Experience Level Selector */}
            <div className="p-5 bg-[#141416] border border-[#27272a] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2 text-white">
                  <Sliders size={16} className="text-[#dc2626]" />
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                    Experience Level
                  </h4>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono-stat">
                  Calibrates biological adaptation benchmark
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['Novice', 'Intermediate', 'Advanced', 'Elite'] as ExperienceLevel[]).map((level) => {
                  const isSelected = experienceLevel === level;
                  const descriptions: Record<ExperienceLevel, { sub: string; target: string }> = {
                    Novice: { sub: '< 1 Year training', target: 'Rapid adaptation standard' },
                    Intermediate: { sub: '1–3 Years training', target: 'Steady progressive overload' },
                    Advanced: { sub: '3–5 Years training', target: 'Refining near genetic limit' },
                    Elite: { sub: '5+ Years training', target: 'Peak competitive threshold' },
                  };
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setExperienceLevel(level)}
                      className={`p-3 border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1e1515] border-[#dc2626] text-white shadow-md'
                          : 'bg-[#18181b] border-[#27272a] text-neutral-400 hover:text-white hover:border-neutral-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-black uppercase ${isSelected ? 'text-[#ef4444]' : 'text-white'}`}>
                          {level}
                        </span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />}
                      </div>
                      <span className="text-[10px] font-bold text-neutral-500 block">
                        {descriptions[level].sub}
                      </span>
                      <span className="text-[9px] text-neutral-400 block mt-1 leading-snug">
                        {descriptions[level].target}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={() => setActiveStep(2)}
                disabled={!form.startDate || !form.endDate || !form.startBodyweightKg || !form.endBodyweightKg}
              >
                Next: The Big 4 Lifts <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: THE BIG 4 COMPOUND LIFTS ─────────────────────────────── */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Rule requirement banner */}
            <div
              className={`p-4 border ${
                validLiftsCount >= 2
                  ? 'bg-[#14532d]/20 border-[#22c55e]/50 text-neutral-200'
                  : 'bg-[#3b0d0c]/30 border-[#7f1d1d] text-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  {validLiftsCount >= 2 ? (
                    <CheckCircle2 size={18} className="text-[#22c55e] flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="text-[#ef4444] flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      Compound Lift Requirement
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Enter at least <strong>2</strong> of the 4 compound movements below. If you enter 2, your strength progression will be judged purely off of them.
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 font-black text-xs uppercase tracking-wider border ${
                    validLiftsCount >= 2
                      ? 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/40'
                      : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40'
                  }`}
                >
                  {validLiftsCount} / 2 Completed
                </div>
              </div>
            </div>

            {/* 4 Lift Cards */}
            <div className="space-y-4">
              {(['bench', 'squat', 'deadlift', 'row'] as CompoundMovementKey[]).map((key) => {
                const config = THE_BIG_4_MOVEMENTS[key];
                const lift = form.lifts[key];
                const s1RM = lift.start1RM > 0 ? lift.start1RM : (parseFloat(lift.startWeight) > 0 && parseInt(lift.startReps, 10) > 0 ? calculateEpley1RM(parseFloat(lift.startWeight), parseInt(lift.startReps, 10)) : 0);
                const e1RM = lift.end1RM > 0 ? lift.end1RM : (parseFloat(lift.endWeight) > 0 && parseInt(lift.endReps, 10) > 0 ? calculateEpley1RM(parseFloat(lift.endWeight), parseInt(lift.endReps, 10)) : 0);
                const isComplete = s1RM > 0 && e1RM > 0;
                const deltaKg = parseFloat((e1RM - s1RM).toFixed(1));
                const gainPct = s1RM > 0 ? parseFloat((((e1RM - s1RM) / s1RM) * 100).toFixed(1)) : 0;

                return (
                  <div
                    key={key}
                    className={`p-4 sm:p-5 border transition-all ${
                      lift.enabled
                        ? isComplete
                          ? 'bg-[#151518] border-[#22c55e]/50'
                          : 'bg-[#151518] border-[#dc2626]/50'
                        : 'bg-[#0f0f11] border-[#222226] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`lift-toggle-${key}`}
                          checked={lift.enabled}
                          onChange={() => handleToggleLift(key)}
                          className="w-4 h-4 rounded-none accent-[#dc2626] cursor-pointer"
                        />
                        <label
                          htmlFor={`lift-toggle-${key}`}
                          className="cursor-pointer select-none"
                        >
                          <span className="text-sm font-black text-white uppercase tracking-tight block">
                            {config.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            {config.category}
                          </span>
                        </label>
                      </div>

                      {lift.enabled && isComplete && (
                        <div className="flex items-center gap-2 text-xs font-black">
                          <span className="text-neutral-400">{s1RM} kg</span>
                          <ArrowRight size={11} className="text-neutral-600" />
                          <span className="text-white">{e1RM} kg</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] border ${
                              deltaKg >= 0
                                ? 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/40'
                                : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40'
                            }`}
                          >
                            {deltaKg >= 0 ? '+' : ''}{deltaKg} kg ({gainPct >= 0 ? '+' : ''}{gainPct}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {lift.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#222226]">
                        {/* Start Lift Entry */}
                        <div className="p-3 bg-[#0d0d0f] border border-[#222226] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                              Starting Baseline
                            </span>
                            {s1RM > 0 && (
                              <span className="text-[10px] font-mono text-[#22c55e] font-black">
                                1RM: {s1RM} kg
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] text-neutral-500 uppercase block mb-1">Weight (kg)</span>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="e.g. 70"
                                value={lift.startWeight}
                                onKeyDown={preventMinusKeyDown}
                                onChange={(e) => handleLiftFieldChange(key, 'startWeight', e.target.value)}
                                className="w-full bg-[#18181b] border border-[#333338] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-neutral-500 uppercase block mb-1">Reps Completed</span>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 5"
                                value={lift.startReps}
                                onKeyDown={preventMinusKeyDown}
                                onChange={(e) => handleLiftFieldChange(key, 'startReps', e.target.value)}
                                className="w-full bg-[#18181b] border border-[#333338] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* End Lift Entry */}
                        <div className="p-3 bg-[#0d0d0f] border border-[#222226] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                              Ending Achievement
                            </span>
                            {e1RM > 0 && (
                              <span className="text-[10px] font-mono text-[#22c55e] font-black">
                                1RM: {e1RM} kg
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] text-neutral-500 uppercase block mb-1">Weight (kg)</span>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="e.g. 82.5"
                                value={lift.endWeight}
                                onKeyDown={preventMinusKeyDown}
                                onChange={(e) => handleLiftFieldChange(key, 'endWeight', e.target.value)}
                                className="w-full bg-[#18181b] border border-[#333338] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-neutral-500 uppercase block mb-1">Reps Completed</span>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 5"
                                value={lift.endReps}
                                onKeyDown={preventMinusKeyDown}
                                onChange={(e) => handleLiftFieldChange(key, 'endReps', e.target.value)}
                                className="w-full bg-[#18181b] border border-[#333338] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="secondary" onClick={() => setActiveStep(1)}>
                <ArrowLeft size={14} className="mr-1" /> Back
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => setActiveStep(3)}
                  disabled={validLiftsCount < 2}
                >
                  Next: Measurements (Optional) <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 3: BODY MEASUREMENTS (OPTIONAL) ─────────────────────────── */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-[#141416] border border-[#27272a]">
              <div className="flex items-center gap-2 mb-1.5 text-white">
                <Ruler size={16} className="text-[#dc2626]" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  Body Circumferences (Optional)
                </h4>
              </div>
              <p className="text-[11px] text-neutral-400">
                Tracking measurements allows the engine to diagnose <strong>Body Recomposition</strong> (fat loss vs muscle gain). If skipped, your strength progress is still fully evaluated purely from your compound lifts!
              </p>
            </div>

            {/* Measurement Grid */}
            <div className="p-5 bg-[#111113] border border-[#262626] space-y-4">
              <div className="grid grid-cols-12 gap-3 pb-2 border-b border-[#222226] text-[10px] font-black uppercase tracking-wider text-neutral-500">
                <div className="col-span-4 sm:col-span-5">Anatomical Site</div>
                <div className="col-span-4 sm:col-span-3 text-center">Start (cm)</div>
                <div className="col-span-4 sm:col-span-4 text-center">End (cm)</div>
              </div>

              {[
                { key: 'waist_cm' as const, label: 'Waist (Navel)', note: 'Key for visceral fat' },
                { key: 'arm_cm' as const, label: 'Biceps / Arms', note: 'Peak flexed' },
                { key: 'chest_cm' as const, label: 'Chest', note: 'Mid-sternum' },
                { key: 'thigh_cm' as const, label: 'Thighs / Quads', note: 'Midpoint' },
                { key: 'shoulders_cm' as const, label: 'Shoulders (Delts)', note: 'Circumference' },
                { key: 'hip_cm' as const, label: 'Hips / Glutes', note: 'Widest point' },
              ].map((site) => (
                <div key={site.key} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4 sm:col-span-5">
                    <span className="text-xs font-bold text-white block">{site.label}</span>
                    <span className="text-[9px] text-neutral-500 uppercase">{site.note}</span>
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="--"
                      value={form.startMeasurements[site.key] || ''}
                      onKeyDown={preventMinusKeyDown}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          startMeasurements: {
                            ...prev.startMeasurements,
                            [site.key]: sanitizePositiveNumber(e.target.value, true),
                          },
                        }))
                      }
                      className="w-full bg-[#18181b] border border-[#333338] px-2.5 py-1.5 text-xs text-white text-center focus:outline-none focus:border-[#dc2626]"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-4">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="--"
                      value={form.endMeasurements[site.key] || ''}
                      onKeyDown={preventMinusKeyDown}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          endMeasurements: {
                            ...prev.endMeasurements,
                            [site.key]: sanitizePositiveNumber(e.target.value, true),
                          },
                        }))
                      }
                      className="w-full bg-[#18181b] border border-[#333338] px-2.5 py-1.5 text-xs text-white text-center focus:outline-none focus:border-[#dc2626]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="secondary" onClick={() => setActiveStep(2)}>
                <ArrowLeft size={14} className="mr-1" /> Back to Lifts
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setActiveStep(4)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Skip measurements
                </Button>
                <Button variant="primary" onClick={() => setActiveStep(4)}>
                  Evaluate Progress <TrendingUp size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 4: DIAGNOSTIC REPORT & ACCOUNT SYNC ─────────────────────── */}
        {activeStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            {evaluationResult.error ? (
              <div className="p-5 bg-[#3b0d0c]/40 border border-[#7f1d1d] space-y-3">
                <div className="flex items-center gap-2 text-[#ef4444]">
                  <AlertCircle size={18} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Evaluation Incomplete</h4>
                </div>
                <p className="text-xs text-neutral-300">{evaluationResult.error}</p>
                <Button variant="secondary" size="sm" onClick={() => setActiveStep(2)}>
                  <ArrowLeft size={12} className="mr-1" /> Return to Lifts
                </Button>
              </div>
            ) : evaluationResult.result ? (
              <div className="space-y-6">
                {/* Applied success banner */}
                {appliedSuccess && (
                  <div className="p-4 bg-[#14532d]/40 border-2 border-[#22c55e] text-white space-y-1">
                    <div className="flex items-center gap-2 text-[#22c55e]">
                      <CheckCircle2 size={18} />
                      <span className="text-xs font-black uppercase tracking-wider">
                        Applied to Account Successfully!
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300">
                      Your starting and ending body weights have been saved to your timeline, measurements recorded, and 1RM benchmarks updated for your compound lifts.
                    </p>
                  </div>
                )}

                {/* Score & Velocity Header Banner */}
                <div className="p-5 bg-[#141417] border border-[#27272a] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222226]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border"
                          style={{
                            color: evaluationResult.result.velocityColor,
                            borderColor: `${evaluationResult.result.velocityColor}60`,
                            backgroundColor: `${evaluationResult.result.velocityColor}15`,
                          }}
                        >
                          {evaluationResult.result.overallVelocity}
                        </span>
                        <span className="text-xs font-bold text-neutral-400">
                          {evaluationResult.result.durationLabel}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                        Period Diagnostic Assessment
                      </h3>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-neutral-400 uppercase font-black block tracking-wider">
                        {evaluationResult.result.phaseType === 'CUT' ? 'Target Benchmark Score' : 'Overall Progression Score'}
                      </span>
                      <div className="flex items-baseline justify-start sm:justify-end gap-1.5">
                        <span
                          className="text-3xl sm:text-4xl font-black font-mono-stat"
                          style={{ color: evaluationResult.result.velocityColor }}
                        >
                          {evaluationResult.result.compositeScorePct}
                        </span>
                        <span className="text-sm text-neutral-400 font-bold uppercase">
                          / 100
                        </span>
                      </div>
                      <span className="text-[11px] text-[#22c55e] font-bold block font-mono-stat mt-0.5">
                        {evaluationResult.result.averageASGainPct >= 0 ? '+' : ''}{evaluationResult.result.averageASGainPct}% Relative Strength ({evaluationResult.result.averageStrengthGainPct >= 0 ? '+' : ''}{evaluationResult.result.averageStrengthGainPct}% 1RM)
                      </span>
                    </div>
                  </div>

                  {/* 3 Metric Summary Boxes */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 bg-[#0a0a0c] border border-[#222226]">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-black block mb-1">
                        Body Weight ({evaluationResult.result.phaseType})
                      </span>
                      <span className="text-sm sm:text-base font-black text-white">
                        {evaluationResult.result.weightDeltaKg >= 0 ? '+' : ''}
                        {evaluationResult.result.weightDeltaKg} kg
                      </span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        ({evaluationResult.result.weightDeltaPct >= 0 ? '+' : ''}
                        {evaluationResult.result.weightDeltaPct}%)
                      </span>
                    </div>

                    <div className="p-3 bg-[#0a0a0c] border border-[#222226]">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-black block mb-1">
                        Strength Trajectory
                      </span>
                      <span className="text-sm sm:text-base font-black text-[#22c55e]">
                        {evaluationResult.result.averageStrengthGainPct >= 0 ? '+' : ''}
                        {evaluationResult.result.averageStrengthGainPct}% 1RM
                      </span>
                      <span className="text-[10px] text-neutral-300 block mt-0.5">
                        {evaluationResult.result.averageASGainPct >= 0 ? '+' : ''}
                        {evaluationResult.result.averageASGainPct}% Relative (AS)
                      </span>
                    </div>

                    <div className="p-3 bg-[#0a0a0c] border border-[#222226]">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-black block mb-1">
                        Phase Benchmark
                      </span>
                      <span className="text-sm sm:text-base font-black text-white">
                        {evaluationResult.result.phaseType === 'CUT'
                          ? evaluationResult.result.averageStrengthGainPct >= -1
                            ? 'MAINTAINED'
                            : `${evaluationResult.result.averageStrengthGainPct}%`
                          : `+${evaluationResult.result.expectedGainRatePct}%`}
                      </span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        {evaluationResult.result.phaseType === 'CUT' ? '1RM Retained in Deficit' : 'Biological Standard'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Missing Measurements Advisory or Multi-Dimensional Banner */}
                {!evaluationResult.result.hasMeasurements ? (
                  <div className="p-4 bg-[#1c1917] border-l-4 border-l-[#facc15] border-y border-r border-[#292524] space-y-2 font-mono-stat">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[#facc15]">
                        <AlertTriangle size={16} className="flex-shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          Partial Progression Assessment • Awaiting Measurements
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-[#facc15]/20 border border-[#facc15]/40 text-[#facc15] font-black uppercase">
                        Performance Approximation
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      {evaluationResult.result.accuracyNote}
                    </p>
                    <div className="p-2.5 bg-[#0e0e10] border border-[#27272a] text-[11px] text-neutral-400">
                      <strong className="text-white">Dynamic Reallocation:</strong> {evaluationResult.result.reallocatedWeightsNote}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#14532d]/20 border-l-4 border-l-[#22c55e] border-y border-r border-[#166534]/40 flex flex-wrap items-center justify-between gap-3 font-mono-stat">
                    <div className="flex items-center gap-2 text-[#22c55e]">
                      <CheckCircle2 size={16} className="flex-shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        {evaluationResult.result.accuracyVerdict}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {evaluationResult.result.reallocatedWeightsNote}
                    </span>
                  </div>
                )}

                {/* The 4 Pillars of Progression Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#dc2626]" />
                      <h4 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">
                        The 4 Pillars of Progression
                      </h4>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono-stat">
                      Overall Composite: {evaluationResult.result.compositeScorePct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 font-mono-stat">
                    {evaluationResult.result.pillars.map((pillar) => {
                      const Icon =
                        pillar.id === 'allometric'
                          ? Dumbbell
                          : pillar.id === 'volume'
                          ? Layers
                          : pillar.id === 'velocity'
                          ? Activity
                          : Ruler;

                      return (
                        <div
                          key={pillar.id}
                          className="p-4 bg-[#121214] border-l-4 border-y border-r border-[#262626] space-y-3 flex flex-col justify-between"
                          style={{ borderLeftColor: pillar.statusColor }}
                        >
                          <div className="space-y-2.5">
                            {/* Header: Icon, Name, Badge, Status */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="p-1.5 border flex items-center justify-center flex-shrink-0"
                                  style={{
                                    borderColor: `${pillar.statusColor}40`,
                                    backgroundColor: `${pillar.statusColor}15`,
                                    color: pillar.statusColor,
                                  }}
                                >
                                  <Icon size={16} />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-black uppercase text-white tracking-wider truncate">
                                    {pillar.name}
                                  </h5>
                                  <span className="text-[9px] text-neutral-500 block truncate">
                                    {pillar.badge} • {pillar.formula}
                                  </span>
                                </div>
                              </div>

                              <span
                                className="text-[9px] font-black px-2 py-0.5 border uppercase flex-shrink-0"
                                style={{
                                  color: pillar.statusColor,
                                  borderColor: `${pillar.statusColor}60`,
                                  backgroundColor: `${pillar.statusColor}15`,
                                }}
                              >
                                {pillar.status}
                              </span>
                            </div>

                            {/* Weight badge */}
                            <div className="flex items-center justify-between text-[9px] pt-1 border-t border-[#222226]">
                              <span className="text-neutral-500 uppercase font-bold">Weight:</span>
                              <span
                                className={`px-1.5 py-0.2 font-black uppercase border ${
                                  pillar.id === 'recomp' && !evaluationResult.result?.hasMeasurements
                                    ? 'bg-neutral-900 text-neutral-500 border-neutral-800'
                                    : !evaluationResult.result?.hasMeasurements && pillar.id !== 'recomp'
                                    ? 'bg-amber-950/40 text-[#facc15] border-amber-800/40'
                                    : 'bg-[#18181b] text-neutral-300 border-[#27272a]'
                                }`}
                              >
                                {pillar.weightBadge}
                              </span>
                            </div>

                            {/* Score & Progress Bar */}
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-neutral-400 font-bold text-[10px] uppercase">
                                  Pillar Score
                                </span>
                                <span
                                  className="font-black text-sm"
                                  style={{ color: pillar.statusColor }}
                                >
                                  {pillar.scorePercent} / 100
                                </span>
                              </div>
                              <div className="w-full bg-[#18181b] h-2 border border-[#27272a] overflow-hidden">
                                <div
                                  className="h-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, pillar.scorePercent)}%`,
                                    backgroundColor: pillar.statusColor,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Target vs Actual */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] p-2 bg-[#0c0c0e] border border-[#1f1f23]">
                              <div>
                                <span className="text-neutral-500 block uppercase text-[8px]">Target</span>
                                <span className="text-white font-bold">{pillar.targetValue}</span>
                              </div>
                              <div>
                                <span className="text-neutral-500 block uppercase text-[8px]">Actual</span>
                                <span className="text-white font-bold truncate block">{pillar.actualValue}</span>
                              </div>
                            </div>

                            {/* Description / Isolation */}
                            <p className="text-[10px] text-neutral-400 leading-snug font-sans">
                              {pillar.whatItIsolates}
                            </p>
                          </div>

                          {pillar.whereLacking && (
                            <div className="mt-2 p-2 bg-[#1c1212] border border-[#3f1d1d] text-[9px] text-red-300 font-sans leading-snug">
                              <strong>Attention:</strong> {pillar.whereLacking}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Evaluated Compound Movements Table */}
                <div className="p-4 bg-[#111113] border border-[#262626] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dumbbell size={15} className="text-[#dc2626]" />
                      <h4 className="text-xs font-black uppercase text-white tracking-wider">
                        Compound Movements Evaluated ({evaluationResult.result.compoundCountUsed})
                      </h4>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Pure Strength Performance
                    </span>
                  </div>

                  <div className="space-y-3">
                    {evaluationResult.result.evaluatedLifts.map((lift) => (
                      <div
                        key={lift.key}
                        className="p-4 bg-[#161619] border border-[#27272a] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-white uppercase">{lift.name}</span>
                              <span
                                className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border font-mono"
                                style={{
                                  color: lift.statusColor,
                                  borderColor: `${lift.statusColor}60`,
                                  backgroundColor: `${lift.statusColor}15`,
                                }}
                              >
                                {lift.status}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-bold uppercase">
                                • {lift.category}
                              </span>
                            </div>
                            {lift.weightContextNote && (
                              <p className="text-[11px] text-neutral-300 font-mono mt-1">
                                {lift.weightContextNote}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono font-bold flex-shrink-0">
                            <div className="text-right">
                              <span className="text-[9px] text-neutral-500 block uppercase">Baseline → Final</span>
                              <span className="text-white">
                                {lift.start1RM} kg → {lift.end1RM} kg
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-neutral-500 block uppercase">1RM Delta</span>
                              <span className={lift.deltaKg >= 0 ? 'text-[#22c55e]' : 'text-neutral-300'}>
                                {lift.deltaKg >= 0 ? '+' : ''}{lift.deltaKg} kg ({lift.gainPct >= 0 ? '+' : ''}{lift.gainPct}%)
                              </span>
                              <span className="text-[9px] text-neutral-400 block font-normal">
                                AS: {lift.deltaAS >= 0 ? '+' : ''}{lift.deltaAS} ({lift.asGainPct >= 0 ? '+' : ''}{lift.asGainPct}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Kilgore Strength Standards Spectrum */}
                        <div className="pt-3 border-t border-[#26262b] space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                <Award size={13} className="text-[#dc2626]" />
                                Kilgore Standard:
                              </span>
                              <TierBadge tier={lift.tier} showLabel={false} size="sm" />
                              <span className="text-[11px] font-bold text-white uppercase">
                                {lift.tierLabel}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400">
                                (Top {Math.max(1, Math.round(100 - lift.percentile))}% · Percentile: {lift.percentileFormatted})
                              </span>
                            </div>

                            {lift.kgToNextTier !== null && lift.nextTierLabel && (
                              <span className="text-[10px] font-mono text-[#dc2626] font-bold bg-[#dc2626]15 px-2 py-0.5 border border-[#dc2626]40">
                                +{lift.kgToNextTier} kg to reach {lift.nextTierLabel} standard
                              </span>
                            )}
                          </div>

                          {/* 5-Tier Kilgore Standard Benchmarks Grid */}
                          <div className="grid grid-cols-5 gap-1.5 text-center">
                            {(['Untrained', 'Novice', 'Intermediate', 'Advanced', 'Elite'] as const).map((tierName, idx) => {
                              const thresholdKg = lift.thresholds[idx];
                              const isCurrentTier = (idx + 1) === lift.tier;

                              return (
                                <div
                                  key={tierName}
                                  className={`p-1.5 border transition-all ${
                                    isCurrentTier
                                      ? 'bg-[#1f1717] border-[#dc2626] ring-1 ring-[#dc2626]/40 shadow-sm'
                                      : 'bg-[#101012] border-[#222226] opacity-75'
                                  }`}
                                >
                                  <div className="flex items-center justify-center gap-1 mb-0.5">
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${
                                      isCurrentTier ? 'text-white' : 'text-neutral-500'
                                    }`}>
                                      {tierName}
                                    </span>
                                    {isCurrentTier && (
                                      <span className="px-1 py-0.2 bg-[#dc2626] text-white text-[8px] font-black">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className={`text-xs font-mono font-bold ${
                                    isCurrentTier ? 'text-[#ef4444]' : 'text-neutral-400'
                                  }`}>
                                    {idx === 0 ? `< ${lift.thresholds[1]} kg` : `≥ ${thresholdKg} kg`}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Comparison Note */}
                          {lift.standardComparisonNote && (
                            <div className="p-2 bg-[#0c0c0e] border border-[#222226] text-[10px] text-neutral-400 font-mono flex items-center gap-2">
                              <Info size={12} className="text-[#dc2626] flex-shrink-0" />
                              <span>{lift.standardComparisonNote}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recomposition & Physiological Analysis */}
                <div className="p-4 bg-[#111113] border border-[#262626] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      Recomposition Diagnosis
                    </span>
                    <span
                      className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border"
                      style={{
                        color: evaluationResult.result.recompColor,
                        borderColor: `${evaluationResult.result.recompColor}60`,
                        backgroundColor: `${evaluationResult.result.recompColor}15`,
                      }}
                    >
                      {evaluationResult.result.recompBadge}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {evaluationResult.result.recompVerdict}
                  </p>
                </div>

                {/* Mathematical Reality & Action Directive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 bg-[#141416] border border-[#222226] space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#dc2626]">
                      Scientific Reality
                    </span>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {evaluationResult.result.mathematicalReality}
                    </p>
                  </div>

                  <div className="p-4 bg-[#141416] border border-[#222226] space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#22c55e]">
                      Coach Directive
                    </span>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {evaluationResult.result.actionDirective}
                    </p>
                  </div>
                </div>

                {/* 1-Click Sync to Account */}
                <div className="p-5 bg-[#18181b] border-2 border-[#dc2626]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      Apply Assessment to Account?
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Syncs weight log, measurements, and 1RM compound benchmark records directly to your profile.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleApplyToAccount}
                    disabled={isApplying || appliedSuccess}
                    className="flex-shrink-0"
                  >
                    {isApplying ? (
                      'Applying Data...'
                    ) : appliedSuccess ? (
                      <>
                        <Check size={14} className="mr-1.5" /> Applied to Profile
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="mr-1.5" /> Apply to Account
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="secondary" onClick={() => setActiveStep(3)}>
                    <ArrowLeft size={14} className="mr-1" /> Adjust Inputs
                  </Button>
                  <Button variant="ghost" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
