import React, { useState } from 'react';
import { Card, Button } from './ui';
import { ExperienceLevel } from '../../models/types/User';
import { BodyMeasurement } from '../../models/types/Measurement';
import { Calendar, Ruler, Scale, Target, Sparkles, AlertCircle, ArrowRight, ArrowLeft, LogOut } from 'lucide-react';
import { preventMinusKeyDown, sanitizePositiveNumber } from '../../utils/numberInputUtils';

interface OnboardingModalProps {
  username: string;
  onSubmit: (data: {
    username?: string;
    birth_date: string;
    gender: 'male' | 'female';
    height: number;
    current_weight: number;
    goal_weight: number;
    experience_level: ExperienceLevel;
    measurements?: Partial<BodyMeasurement>;
  }) => Promise<void>;
  onSignOut?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function OnboardingModal({ username, onSubmit, onSignOut, loading = false, error = null }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Athlete Biometrics & Info
  const [athleteName, setAthleteName] = useState(username || 'Athlete');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState('175');
  const [currentWeight, setCurrentWeight] = useState('78');
  const [goalWeight, setGoalWeight] = useState('75');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Step 2: Optional Body Circumferences (Tape Measurements)
  const [shoulders, setShoulders] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [arms, setArms] = useState('');
  const [neck, setNeck] = useState('');
  const [hips, setHips] = useState('');
  const [thighs, setThighs] = useState('');
  const [calves, setCalves] = useState('');

  const validateStep1 = (): {
    cleanName: string;
    hNum: number;
    wNum: number;
    gwNum: number;
  } | null => {
    setValidationError(null);

    const cleanName = athleteName.trim();
    if (!cleanName) {
      setValidationError('Please enter an athlete name.');
      return null;
    }

    if (!birthDate) {
      setValidationError('Please enter your birth date.');
      return null;
    }

    const birth = new Date(birthDate);
    const now = new Date();
    const ageDiffMs = now.getTime() - birth.getTime();
    const ageDate = new Date(ageDiffMs);
    const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (calculatedAge < 13 || calculatedAge > 120) {
      setValidationError('Please enter a valid birth date (must be at least 13 years old).');
      return null;
    }

    const hNum = parseFloat(height);
    const wNum = parseFloat(currentWeight);
    const gwNum = parseFloat(goalWeight);

    if (isNaN(hNum) || hNum < 100 || hNum > 250) {
      setValidationError('Height must be between 100cm and 250cm.');
      return null;
    }
    if (isNaN(wNum) || wNum < 30 || wNum > 300) {
      setValidationError('Weight must be between 30kg and 300kg.');
      return null;
    }
    if (isNaN(gwNum) || gwNum < 30 || gwNum > 300) {
      setValidationError('Goal weight must be between 30kg and 300kg.');
      return null;
    }

    return { cleanName, hNum, wNum, gwNum };
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = validateStep1();
    if (valid) {
      setStep(2);
    }
  };

  const handleFinish = async (includeMeasurements: boolean) => {
    const valid = validateStep1();
    if (!valid) {
      setStep(1);
      return;
    }

    const measurementsData: Partial<BodyMeasurement> = {};
    if (includeMeasurements) {
      if (shoulders) measurementsData.shoulders_cm = parseFloat(shoulders);
      if (chest) measurementsData.chest_cm = parseFloat(chest);
      if (waist) measurementsData.waist_cm = parseFloat(waist);
      if (arms) measurementsData.arm_cm = parseFloat(arms);
      if (neck) measurementsData.neck_cm = parseFloat(neck);
      if (hips) measurementsData.hip_cm = parseFloat(hips);
      if (thighs) measurementsData.thigh_cm = parseFloat(thighs);
      if (calves) measurementsData.calf_cm = parseFloat(calves);
    }

    await onSubmit({
      username: valid.cleanName,
      birth_date: birthDate,
      gender,
      height: valid.hNum,
      current_weight: valid.wNum,
      goal_weight: valid.gwNum,
      experience_level: experienceLevel,
      measurements: Object.keys(measurementsData).length > 0 ? measurementsData : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg">
        <Card className="p-6 sm:p-8 border border-neutral-800 shadow-2xl relative overflow-hidden bg-[#0e0e11]">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-crimson to-neutral-700" />

          {/* Top-right Sign Out Button */}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="absolute top-4 right-4 flex items-center gap-1.5 text-[11px] font-mono-stat text-neutral-400 hover:text-white bg-[#18181b] border border-[#27272a] hover:border-neutral-600 px-2.5 py-1 rounded transition-colors cursor-pointer z-10"
              title="Sign out / Switch account"
            >
              <LogOut size={12} />
              <span>Switch Account</span>
            </button>
          )}

          {/* Stepper Header */}
          <div className="text-center space-y-1.5 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-[#ef4444] text-[11px] font-black uppercase tracking-wider font-mono-stat">
              <Sparkles size={12} />
              <span>ATHLETE ONBOARDING · STEP {step} OF 2</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              {step === 1 ? `Welcome, ${athleteName || 'Athlete'}` : 'Body Measurements (Optional)'}
            </h2>
            <p className="text-xs text-neutral-400">
              {step === 1
                ? 'Configure your baseline biometric & training data to calculate exact 1RM standards and BMI.'
                : 'Log your baseline tape measurements in cm to calculate your Adonis Index & V-Taper ratio from day one.'}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-4">
              {/* Athlete Name */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                  Athlete Name <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={athleteName}
                  maxLength={50}
                  onChange={(e) => setAthleteName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-black/60 border border-[#27272a] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                  Birth Date <span className="text-[#dc2626]">*</span>
                </label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="date"
                    required
                    value={birthDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-black/60 border border-[#27272a] rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#dc2626] font-mono-stat"
                  />
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                  Gender <span className="text-[#dc2626]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                        gender === g
                          ? 'bg-[#dc2626] border-[#dc2626] text-white shadow-md shadow-red-900/20'
                          : 'bg-black/50 border-[#27272a] text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      {g === 'male' ? 'Male' : 'Female'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercise Experience */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center justify-between">
                  <span>Exercise Experience <span className="text-[#dc2626]">*</span></span>
                  <span className="text-[10px] text-neutral-500 font-mono-stat font-normal">Standardizes PR tiers</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'beginner', title: 'Beginner', subtitle: '< 1 year' },
                    { id: 'intermediate', title: 'Intermediate', subtitle: '1-3 years' },
                    { id: 'advanced', title: 'Advanced', subtitle: '3+ years' },
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setExperienceLevel(tier.id as ExperienceLevel)}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        experienceLevel === tier.id
                          ? 'bg-[#18181b] border-[#dc2626] text-white ring-1 ring-[#dc2626]'
                          : 'bg-black/40 border-[#27272a] text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-black uppercase tracking-wider">{tier.title}</div>
                      <div className="text-[10px] text-neutral-500 font-mono-stat mt-0.5">{tier.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Biometrics Grid (Height, Current Weight, Goal Weight) */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Height (cm)
                  </label>
                  <div className="relative">
                    <Ruler size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      value={height}
                      onKeyDown={preventMinusKeyDown}
                      onChange={(e) => setHeight(sanitizePositiveNumber(e.target.value, true))}
                      placeholder="175"
                      className="w-full bg-black/60 border border-[#27272a] rounded-lg pl-8 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626] font-mono-stat"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Weight (kg)
                  </label>
                  <div className="relative">
                    <Scale size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      value={currentWeight}
                      onKeyDown={preventMinusKeyDown}
                      onChange={(e) => setCurrentWeight(sanitizePositiveNumber(e.target.value, true))}
                      placeholder="78"
                      className="w-full bg-black/60 border border-[#27272a] rounded-lg pl-8 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626] font-mono-stat"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Goal (kg)
                  </label>
                  <div className="relative">
                    <Target size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      value={goalWeight}
                      onKeyDown={preventMinusKeyDown}
                      onChange={(e) => setGoalWeight(sanitizePositiveNumber(e.target.value, true))}
                      placeholder="75"
                      className="w-full bg-black/60 border border-[#27272a] rounded-lg pl-8 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626] font-mono-stat"
                    />
                  </div>
                </div>
              </div>

              {(validationError || error) && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{validationError || error}</span>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full uppercase tracking-wider font-black text-xs inline-flex items-center justify-center gap-2"
                >
                  <span>Continue to Measurements (Optional)</span>
                  <ArrowRight size={14} />
                </Button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleFinish(false)}
                  className="w-full text-center text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer py-1 font-mono-stat"
                >
                  {loading ? 'Finalizing Profile...' : 'Skip tape measurements & finish setup'}
                </button>

                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="w-full text-center text-[11px] text-neutral-500 hover:text-red-400 transition-colors cursor-pointer pt-2 border-t border-neutral-800/80 font-mono-stat flex items-center justify-center gap-1.5"
                  >
                    <LogOut size={12} />
                    <span>Wrong account? Sign out and try another</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3 text-xs font-mono-stat">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Shoulders (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={shoulders}
                    onKeyDown={preventMinusKeyDown}
                    onChange={(e) => setShoulders(sanitizePositiveNumber(e.target.value, true))}
                    placeholder="e.g. 122"
                    className="w-full bg-black/60 border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Chest (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={chest}
                    onKeyDown={preventMinusKeyDown}
                    onChange={(e) => setChest(sanitizePositiveNumber(e.target.value, true))}
                    placeholder="e.g. 104"
                    className="w-full bg-black/60 border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Waist (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={waist}
                    onKeyDown={preventMinusKeyDown}
                    onChange={(e) => setWaist(sanitizePositiveNumber(e.target.value, true))}
                    placeholder="e.g. 80"
                    className="w-full bg-black/60 border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Arms / Bicep (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={arms}
                    onKeyDown={preventMinusKeyDown}
                    onChange={(e) => setArms(sanitizePositiveNumber(e.target.value, true))}
                    placeholder="e.g. 38"
                    className="w-full bg-black/60 border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Neck (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={neck}
                    onKeyDown={preventMinusKeyDown}
                    onChange={(e) => setNeck(sanitizePositiveNumber(e.target.value, true))}
                    placeholder="e.g. 39"
                    className="w-full bg-black/60 border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Hips (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={hips}
                    onKeyDown={preventMinusKeyDown}
                    onChange={(e) => setHips(sanitizePositiveNumber(e.target.value, true))}
                    placeholder="e.g. 95"
                    className="w-full bg-black/60 border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Thighs (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={thighs}
                    onKeyDown={preventMinusKeyDown}
                    onChange={(e) => setThighs(sanitizePositiveNumber(e.target.value, true))}
                    placeholder="e.g. 59"
                    className="w-full bg-black/60 border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Calves (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={calves}
                    onKeyDown={preventMinusKeyDown}
                    onChange={(e) => setCalves(sanitizePositiveNumber(e.target.value, true))}
                    placeholder="e.g. 38"
                    className="w-full bg-black/60 border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>
              </div>

              {(validationError || error) && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{validationError || error}</span>
                </div>
              )}

              <div className="pt-3 space-y-2">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  onClick={() => handleFinish(true)}
                  className="w-full uppercase tracking-wider font-black text-xs"
                >
                  {loading ? 'Saving Setup...' : 'Save Measurements & Enter Gym'}
                </Button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1 font-mono-stat"
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Biometrics</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleFinish(false)}
                    className="text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer font-mono-stat"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
