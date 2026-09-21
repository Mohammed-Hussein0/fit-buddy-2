import { useState } from 'react';
import { Modal, Button } from './ui';
import { Program } from '../../models/types/Workout';
import { Plus, Check, Trash2, Sliders, Calendar } from 'lucide-react';

export interface RoutineDayConfig {
  title: string;
  dayOfWeek: number; // 7=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  note?: string;
}

interface RoutineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  programs: Program[];
  activeProgramId: string;
  onSwitchProgram: (id: string) => void;
  onCreateProgram: (title: string, days: RoutineDayConfig[]) => void;
  onDeleteProgram: (id: string) => void;
}

export const WEEKDAYS = [
  { value: 7, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const DEFAULT_DAYS_SUNDAY: Record<number, RoutineDayConfig[]> = {
  3: [
    { title: 'Full Body A (Squat & Bench Focus)', dayOfWeek: 7 }, // Sun
    { title: 'Full Body B (Deadlift & OHP Focus)', dayOfWeek: 2 }, // Tue
    { title: 'Full Body C (Leg Press & Hypertrophy)', dayOfWeek: 4 }, // Thu
  ],
  4: [
    { title: 'Upper Heavy (Bench & Barbell Rows)', dayOfWeek: 7 }, // Sun
    { title: 'Lower Heavy (Squats & RDLs)', dayOfWeek: 1 }, // Mon
    { title: 'Upper Hypertrophy (OHP & Arms)', dayOfWeek: 3 }, // Wed
    { title: 'Lower Volume & Core', dayOfWeek: 4 }, // Thu
  ],
  5: [
    { title: 'Push (Chest, Shoulders & Triceps)', dayOfWeek: 7 }, // Sun
    { title: 'Pull (Back, Rear Delts & Biceps)', dayOfWeek: 1 }, // Mon
    { title: 'Legs (Quads, Hamstrings & Calves)', dayOfWeek: 2 }, // Tue
    { title: 'Upper Body Hypertrophy', dayOfWeek: 3 }, // Wed
    { title: 'Lower Body & Core Volume', dayOfWeek: 4 }, // Thu
  ],
  6: [
    { title: 'Push A (Heavy Barbell Press)', dayOfWeek: 7 }, // Sun
    { title: 'Pull A (Deadlift & Thickness)', dayOfWeek: 1 }, // Mon
    { title: 'Legs A (Squat Dominant)', dayOfWeek: 2 }, // Tue
    { title: 'Push B (Incline & Delts Focus)', dayOfWeek: 3 }, // Wed
    { title: 'Pull B (Lat Width & Biceps)', dayOfWeek: 4 }, // Thu
    { title: 'Legs B (Hams & Calves)', dayOfWeek: 5 }, // Fri
  ],
  7: [
    { title: 'Push Focus', dayOfWeek: 7 }, // Sun
    { title: 'Pull Focus', dayOfWeek: 1 }, // Mon
    { title: 'Legs Focus', dayOfWeek: 2 }, // Tue
    { title: 'Upper Body Pump', dayOfWeek: 3 }, // Wed
    { title: 'Lower Body & Posterior', dayOfWeek: 4 }, // Thu
    { title: 'Arms & Shoulders Isolation', dayOfWeek: 5 }, // Fri
    { title: 'Core & Conditioning', dayOfWeek: 6 }, // Sat
  ],
};

const DEFAULT_DAYS_MONDAY: Record<number, RoutineDayConfig[]> = {
  3: [
    { title: 'Full Body A (Squat & Bench Focus)', dayOfWeek: 1 }, // Mon
    { title: 'Full Body B (Deadlift & OHP Focus)', dayOfWeek: 3 }, // Wed
    { title: 'Full Body C (Leg Press & Hypertrophy)', dayOfWeek: 5 }, // Fri
  ],
  4: [
    { title: 'Upper Heavy (Bench & Barbell Rows)', dayOfWeek: 1 }, // Mon
    { title: 'Lower Heavy (Squats & RDLs)', dayOfWeek: 2 }, // Tue
    { title: 'Upper Hypertrophy (OHP & Arms)', dayOfWeek: 4 }, // Thu
    { title: 'Lower Volume & Core', dayOfWeek: 5 }, // Fri
  ],
  5: [
    { title: 'Push (Chest, Shoulders & Triceps)', dayOfWeek: 1 }, // Mon
    { title: 'Pull (Back, Rear Delts & Biceps)', dayOfWeek: 2 }, // Tue
    { title: 'Legs (Quads, Hamstrings & Calves)', dayOfWeek: 3 }, // Wed
    { title: 'Upper Body Hypertrophy', dayOfWeek: 4 }, // Thu
    { title: 'Lower Body & Core Volume', dayOfWeek: 5 }, // Fri
  ],
  6: [
    { title: 'Push A (Heavy Barbell Press)', dayOfWeek: 1 }, // Mon
    { title: 'Pull A (Deadlift & Thickness)', dayOfWeek: 2 }, // Tue
    { title: 'Legs A (Squat Dominant)', dayOfWeek: 3 }, // Wed
    { title: 'Push B (Incline & Delts Focus)', dayOfWeek: 4 }, // Thu
    { title: 'Pull B (Lat Width & Biceps)', dayOfWeek: 5 }, // Fri
    { title: 'Legs B (Hams & Calves)', dayOfWeek: 6 }, // Sat
  ],
  7: [
    { title: 'Push Focus', dayOfWeek: 1 }, // Mon
    { title: 'Pull Focus', dayOfWeek: 2 }, // Tue
    { title: 'Legs Focus', dayOfWeek: 3 }, // Wed
    { title: 'Upper Body Pump', dayOfWeek: 4 }, // Thu
    { title: 'Lower Body & Posterior', dayOfWeek: 5 }, // Fri
    { title: 'Arms & Shoulders Isolation', dayOfWeek: 6 }, // Sat
    { title: 'Core & Conditioning', dayOfWeek: 7 }, // Sun
  ],
};

const SUGGESTED_FOCUS_CHIPS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Arms', 'Full Body', 'Core'];

export function RoutineManagerModal({
  isOpen,
  onClose,
  programs,
  activeProgramId,
  onSwitchProgram,
  onCreateProgram,
  onDeleteProgram,
}: RoutineManagerModalProps) {
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [newTitle, setNewTitle] = useState('Custom 5-Day Protocol');
  const [dayCount, setDayCount] = useState(5);
  const [startDayPreset, setStartDayPreset] = useState<7 | 1>(7); // Default Sunday start
  const [days, setDays] = useState<RoutineDayConfig[]>(() => DEFAULT_DAYS_SUNDAY[5]);

  // Real today's day of week (7=Sun, 1=Mon, ..., 6=Sat)
  const todayDow = (() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  })();

  const handleStartDayPresetChange = (startDow: 7 | 1) => {
    setStartDayPreset(startDow);
    const defaults = startDow === 7 ? DEFAULT_DAYS_SUNDAY : DEFAULT_DAYS_MONDAY;
    const base = defaults[dayCount] || defaults[5];
    setDays([...base]);
  };

  const handleDayCountChange = (count: number) => {
    const clamped = Math.max(3, Math.min(7, count));
    setDayCount(clamped);

    const defaults = startDayPreset === 7 ? DEFAULT_DAYS_SUNDAY : DEFAULT_DAYS_MONDAY;
    const template = defaults[clamped] || defaults[5];

    const updated = [...days];
    if (clamped > updated.length) {
      for (let i = updated.length; i < clamped; i++) {
        updated.push(template[i] || { title: `Day ${i + 1}`, dayOfWeek: ((i % 7) + 1) });
      }
    } else {
      updated.splice(clamped);
    }
    setDays(updated);
  };

  const handleDayFieldChange = (idx: number, field: keyof RoutineDayConfig, val: any) => {
    setDays((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formattedDays = days.map((d, i) => ({
      title: d.title.trim() || `Day ${i + 1}`,
      dayOfWeek: d.dayOfWeek,
      note: d.note || 'Custom program session',
    }));

    onCreateProgram(newTitle.trim(), formattedDays);
    setNewTitle('');
    setViewMode('list');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Training Routines & Programs" maxWidth="max-w-2xl">
      {viewMode === 'list' ? (
        <div className="space-y-4 font-mono-stat">
          <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
            <div>
              <p className="text-xs text-neutral-400">SELECT ACTIVE PROTOCOL</p>
              <p className="text-[10px] text-neutral-500">Switching routines preserves your previous history and PRs.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setViewMode('create')}
            >
              <Plus size={13} /> + Create New Routine
            </Button>
          </div>

          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {programs.map((p) => {
              const isActive = p.id === activeProgramId;
              const isCustom = p.id.startsWith('custom-');

              return (
                <div
                  key={p.id}
                  className={`p-3.5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-[#18181b] border-l-4 border-l-[#dc2626] border-y border-r border-[#dc2626]'
                      : 'bg-[#111113] border-[#262626] hover:border-neutral-500'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-12 h-12 object-cover grayscale flex-shrink-0 border border-[#262626]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white uppercase truncate">{p.title}</h4>
                        {isActive && (
                          <span className="text-[8px] font-black px-1.5 py-0.2 bg-[#dc2626] text-white uppercase">
                            ACTIVE
                          </span>
                        )}
                        {isCustom && (
                          <span className="text-[8px] font-black px-1.5 py-0.2 bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        {p.id === 'ppl-classic' && '5-Day Split · Push, Pull, Legs, Push, Pull'}
                        {p.id === 'upper-lower' && '4-Day Split · Upper, Lower, Upper, Lower'}
                        {p.id === 'full-body' && '3-Day Split · Full Body frequency'}
                        {p.id === 'arnold-split' && '6-Day Split · Chest/Back, Arms, Legs'}
                        {isCustom && 'User Defined Workout Protocol'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-[#4ade80] px-3 py-1 bg-[#14532d]/40 border border-[#22c55e]/40">
                        <Check size={13} /> ACTIVE
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onSwitchProgram(p.id);
                          onClose();
                        }}
                        className="px-3 py-1 bg-[#dc2626] text-white hover:bg-[#b91c1c] text-xs font-black uppercase tracking-wider cursor-pointer border border-[#dc2626]"
                      >
                        ACTIVATE
                      </button>
                    )}

                    {isCustom && (
                      <button
                        onClick={() => onDeleteProgram(p.id)}
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer border border-transparent hover:border-red-900"
                        title="Delete custom routine"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─── Create Custom Routine Form ──────────────────────────────────── */
        <form onSubmit={handleCreateSubmit} className="space-y-4 font-mono-stat">
          <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Configure Custom Routine</h4>
              <p className="text-[10px] text-neutral-500">Customize training frequency, days of the week, and targets.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setViewMode('list')}
            >
              [BACK TO LIST]
            </Button>
          </div>

          {/* Routine Title */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
              ROUTINE TITLE
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 5-Day Hypertrophy Peak"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-black border border-[#27272a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#dc2626] rounded-none font-mono-stat"
            />
          </div>

          {/* Training Days Slider (3 to 7) */}
          <div className="p-3.5 bg-[#141416] border border-[#27272a] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Sliders size={13} className="text-[#dc2626]" />
                TRAINING DAYS SLIDER (3 TO 7 DAYS)
              </label>
              <span className="px-2 py-0.5 bg-[#dc2626] text-white text-xs font-black uppercase tracking-wider">
                {dayCount} {dayCount === 7 ? 'DAYS (DAILY PROTOCOL)' : 'DAYS / WEEK'}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <input
                type="range"
                min={3}
                max={7}
                step={1}
                value={dayCount}
                onChange={(e) => handleDayCountChange(Number(e.target.value))}
                className="w-full accent-[#dc2626] bg-[#27272a] h-2.5 cursor-pointer"
              />
              <div className="grid grid-cols-5 gap-1 pt-1">
                {[3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleDayCountChange(num)}
                    className={`py-1 text-[10px] font-black uppercase cursor-pointer border transition-all ${
                      dayCount === num
                        ? 'bg-[#dc2626] text-white border-[#dc2626]'
                        : 'bg-[#1a1a1e] text-neutral-400 border-[#27272a] hover:text-white'
                    }`}
                  >
                    {num === 7 ? '7 (Daily)' : `${num} Days`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Week Start Preset Options */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#111113] border border-[#262626] gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-[#dc2626]" />
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                SCHEDULE PRESET / START DAY:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartDayPresetChange(7)}
                className={`px-2.5 py-1 text-[10px] font-black uppercase cursor-pointer border transition-all ${
                  startDayPreset === 7
                    ? 'bg-[#dc2626] text-white border-[#dc2626]'
                    : 'bg-[#18181b] text-neutral-400 border-[#27272a] hover:text-white'
                }`}
              >
                1st Day is Sunday (Sun-Start)
              </button>
              <button
                type="button"
                onClick={() => handleStartDayPresetChange(1)}
                className={`px-2.5 py-1 text-[10px] font-black uppercase cursor-pointer border transition-all ${
                  startDayPreset === 1
                    ? 'bg-[#dc2626] text-white border-[#dc2626]'
                    : 'bg-[#18181b] text-neutral-400 border-[#27272a] hover:text-white'
                }`}
              >
                1st Day is Monday (Mon-Start)
              </button>
            </div>
          </div>

          {/* Individual Day Configuration Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400">
                ASSIGN DAYS OF WEEK & WORKOUT FOCUS
              </label>
              <span className="text-[9px] text-neutral-500 uppercase">You can customize each day however you please</span>
            </div>

            <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
              {days.map((d, idx) => {
                const isTodayDay = d.dayOfWeek === todayDow;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 bg-[#111113] border flex flex-col gap-2 transition-all ${
                      isTodayDay ? 'border-[#dc2626]' : 'border-[#262626]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* Day Label & Today Badge */}
                      <div className="flex items-center gap-1.5 sm:w-28 flex-shrink-0">
                        <span className="text-[10px] font-black text-white">DAY 0{idx + 1}:</span>
                        {isTodayDay && (
                          <span className="text-[8px] font-black uppercase px-1 py-0.2 bg-[#dc2626] text-white">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Day of Week Selector */}
                      <div className="flex items-center gap-1.5 sm:w-44 flex-shrink-0">
                        <label className="text-[9px] text-neutral-500 font-bold uppercase">DAY:</label>
                        <select
                          value={d.dayOfWeek}
                          onChange={(e) => handleDayFieldChange(idx, 'dayOfWeek', Number(e.target.value))}
                          className="flex-1 bg-black border border-[#27272a] px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-[#dc2626] rounded-none cursor-pointer"
                        >
                          {WEEKDAYS.map((w) => (
                            <option key={w.value} value={w.value} className="bg-neutral-900 text-white">
                              {w.label} {w.value === todayDow ? '(Today)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Workout Focus Name */}
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={d.title}
                          onChange={(e) => handleDayFieldChange(idx, 'title', e.target.value)}
                          placeholder={`Day ${idx + 1} focus (e.g. Push)`}
                          className="w-full bg-black border border-[#27272a] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#dc2626] rounded-none font-mono-stat"
                        />
                      </div>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                      <span className="text-[9px] text-neutral-600 uppercase font-bold flex-shrink-0">Focus:</span>
                      {SUGGESTED_FOCUS_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleDayFieldChange(idx, 'title', `${chip} Session`)}
                          className="px-1.5 py-0.5 bg-[#18181b] hover:bg-[#27272a] text-neutral-400 hover:text-white text-[9px] font-bold uppercase transition-colors flex-shrink-0 border border-[#27272a]"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Weekly Calendar Schedule Matrix Preview */}
          <div className="p-3 bg-[#111113] border border-[#262626] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                <Calendar size={12} className="text-[#dc2626]" />
                LIVE 7-DAY WEEKLY SCHEDULE MATRIX
              </span>
              <span className="text-[9px] text-neutral-500 font-bold">
                TODAY IS {WEEKDAYS.find((w) => w.value === todayDow)?.label.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center font-mono-stat">
              {WEEKDAYS.map((w) => {
                const assignedDay = days.find((d) => d.dayOfWeek === w.value);
                const isToday = w.value === todayDow;

                return (
                  <div
                    key={w.value}
                    className={`p-1.5 border flex flex-col justify-between min-h-[52px] ${
                      assignedDay
                        ? isToday
                          ? 'bg-[#2a0e0e] border-[#dc2626]'
                          : 'bg-[#18181b] border-neutral-700'
                        : isToday
                        ? 'bg-[#1f1111] border-[#dc2626]/40'
                        : 'bg-black/50 border-[#262626]'
                    }`}
                  >
                    <div>
                      <span className={`text-[9px] font-black block uppercase ${isToday ? 'text-[#ef4444]' : 'text-neutral-400'}`}>
                        {w.short} {isToday ? '★' : ''}
                      </span>
                    </div>

                    <div className="mt-1">
                      {assignedDay ? (
                        <p className="text-[9px] font-black text-white truncate leading-tight" title={assignedDay.title}>
                          {assignedDay.title.split(' ')[0]}
                        </p>
                      ) : (
                        <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-wide">
                          REST
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#262626] flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setViewMode('list')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              Build & Activate Routine ({dayCount} Days)
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
