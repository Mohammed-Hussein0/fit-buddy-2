import { useState } from 'react';
import { Card, Button, Modal } from './ui';
import { useMeasurementsController } from '../../controllers/useMeasurementsController';
import { BodyMeasurement } from '../../models/types/Measurement';
import { MeasurementChart } from './MeasurementChart';
import { Ruler, Sparkles, TrendingUp, TrendingDown, Trash2, Plus } from 'lucide-react';

export function BodyMeasurementsPanel() {
  const {
    measurements,
    latest,
    previous,
    vTaper,
    deltaShoulders,
    deltaWaist,
    isLoading,
    isSubmitting,
    saveMeasurement,
    removeMeasurement,
  } = useMeasurementsController();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<BodyMeasurement>>({
    date: new Date().toISOString().split('T')[0],
    shoulders_cm: latest?.shoulders_cm || 122,
    chest_cm: latest?.chest_cm || 104,
    waist_cm: latest?.waist_cm || 80,
    arm_cm: latest?.arm_cm || 38,
    neck_cm: latest?.neck_cm || 39,
    hip_cm: latest?.hip_cm || 95,
    thigh_cm: latest?.thigh_cm || 59,
    calf_cm: latest?.calf_cm || 38,
    notes: '',
  });

  const handleInputChange = (field: keyof BodyMeasurement, val: string) => {
    if (field === 'date' || field === 'notes') {
      setFormData((prev) => ({ ...prev, [field]: val }));
    } else {
      const num = parseFloat(val);
      setFormData((prev) => ({ ...prev, [field]: isNaN(num) ? undefined : num }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) return;

    await saveMeasurement(formData as BodyMeasurement);
    setIsModalOpen(false);
  };

  return (
    <Card className="p-6 sm:p-8 border border-[#27272a]">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-950/40 text-red-400 border border-red-800/40">
            <Ruler size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Body Measurements & V-Taper Ratio
              </h3>
              <span className="px-2 py-0.5 bg-[#18181b] border border-[#27272a] text-[10px] font-mono-stat text-neutral-400">
                /api/measurements
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono-stat mt-1">
              Track your tape measurements and shoulder-to-waist ratio
            </p>
          </div>
        </div>

        <Button
          size="md"
          onClick={() => {
            setFormData({
              date: new Date().toISOString().split('T')[0],
              shoulders_cm: latest?.shoulders_cm || 122,
              chest_cm: latest?.chest_cm || 104,
              waist_cm: latest?.waist_cm || 80,
              arm_cm: latest?.arm_cm || 38,
              neck_cm: latest?.neck_cm || 39,
              hip_cm: latest?.hip_cm || 95,
              thigh_cm: latest?.thigh_cm || 59,
              calf_cm: latest?.calf_cm || 38,
              notes: '',
            });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus size={15} /> Log Tape Check-In
        </Button>
      </div>

      {/* ─── V-Taper Scoreboard ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Main Ratio Card */}
        <div className="p-5 sm:p-6 bg-[#141416] border border-[#27272a] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Shoulder-to-Waist (V-Taper)
              </span>
              {vTaper && (
                <span
                  className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono-stat border"
                  style={{
                    backgroundColor: `${vTaper.tierColor}15`,
                    borderColor: `${vTaper.tierColor}40`,
                    color: vTaper.tierColor,
                  }}
                >
                  {vTaper.category}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2.5 font-mono-stat">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {vTaper ? vTaper.ratio.toFixed(3) : '—'}
              </span>
              <span className="text-xs text-neutral-400 font-bold uppercase">
                / 1.618 Target
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs font-mono-stat text-neutral-400 mb-1.5">
              <span>V-TAPER PROGRESS</span>
              <span className="text-white font-bold">{vTaper?.percentageToGolden || 0}%</span>
            </div>
            <div className="w-full h-2 bg-[#18181b] border border-[#27272a] overflow-hidden">
              <div
                className="h-full bg-[#dc2626] transition-all duration-300"
                style={{ width: `${Math.min(100, vTaper?.percentageToGolden || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Shoulders Delta */}
        <div className="p-5 sm:p-6 bg-[#141416] border border-[#27272a] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
              Shoulder Width
            </span>
            {deltaShoulders !== null && (
              <span
                className={`flex items-center gap-1 text-xs font-bold font-mono-stat ${
                  deltaShoulders >= 0 ? 'text-[#22c55e]' : 'text-neutral-400'
                }`}
              >
                {deltaShoulders >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {deltaShoulders > 0 ? `+${deltaShoulders}` : deltaShoulders} cm
              </span>
            )}
          </div>
          <div className="font-mono-stat">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {latest?.shoulders_cm ? `${latest.shoulders_cm} cm` : '—'}
            </span>
            <p className="text-xs text-neutral-500 mt-1 uppercase">
              Across Shoulders
            </p>
          </div>
        </div>

        {/* Waist Delta */}
        <div className="p-5 sm:p-6 bg-[#141416] border border-[#27272a] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
              Waist Size
            </span>
            {deltaWaist !== null && (
              <span
                className={`flex items-center gap-1 text-xs font-bold font-mono-stat ${
                  deltaWaist <= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                }`}
              >
                {deltaWaist <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                {deltaWaist > 0 ? `+${deltaWaist}` : deltaWaist} cm
              </span>
            )}
          </div>
          <div className="font-mono-stat">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {latest?.waist_cm ? `${latest.waist_cm} cm` : '—'}
            </span>
            <p className="text-xs text-neutral-500 mt-1 uppercase">
              Around Waist
            </p>
          </div>
        </div>
      </div>

      {/* ─── Measurement Progression Area Chart ────────────────────────────── */}
      <div className="mb-8 p-6 sm:p-8 bg-[#141416] border border-[#27272a]">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-2 h-4 bg-[#dc2626]" />
          <h4 className="text-sm font-black uppercase tracking-wider text-white font-mono-stat">
            Measurement History & Progress
          </h4>
        </div>
        <MeasurementChart measurements={measurements} height={260} />
      </div>

      {/* ─── Current Anthropometric Matrix (8 Sites) ─────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-2 h-3.5 bg-[#dc2626]" />
          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300">
            Current Measurements ({latest?.date || 'No check-in'})
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs font-mono-stat">
          {[
            { label: 'Shoulders', val: latest?.shoulders_cm },
            { label: 'Chest', val: latest?.chest_cm },
            { label: 'Waist', val: latest?.waist_cm },
            { label: 'Flexed Arm', val: latest?.arm_cm },
            { label: 'Neck', val: latest?.neck_cm },
            { label: 'Hips / Glutes', val: latest?.hip_cm },
            { label: 'Thigh', val: latest?.thigh_cm },
            { label: 'Calf', val: latest?.calf_cm },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3.5 sm:p-4 bg-[#141416] border border-[#27272a] flex flex-col justify-between"
            >
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                {item.label}
              </span>
              <span className="text-base sm:text-lg font-black text-white mt-1.5">
                {item.val !== undefined && item.val !== null ? `${item.val} cm` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Historical Log Table ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-3.5 bg-[#dc2626]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300">
              Tape Measurement Log History
            </h4>
          </div>
          <span className="text-xs font-mono-stat text-neutral-500">
            {measurements.length} RECORD{measurements.length === 1 ? '' : 'S'}
          </span>
        </div>

        <div className="overflow-x-auto border border-[#27272a]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono-stat">
            <thead>
              <tr className="bg-[#121214] text-neutral-400 text-[10px] uppercase font-black border-b border-[#27272a]">
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Shoulders</th>
                <th className="py-3 px-3.5">Chest</th>
                <th className="py-3 px-3.5">Waist</th>
                <th className="py-3 px-3.5">Arm</th>
                <th className="py-3 px-3.5">V-Taper</th>
                <th className="py-3 px-3.5">Notes</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m) => {
                const ratio =
                  m.shoulders_cm && m.waist_cm
                    ? (m.shoulders_cm / m.waist_cm).toFixed(3)
                    : '—';

                return (
                  <tr
                    key={m.date}
                    className="border-b border-[#1f1f23] hover:bg-[#18181b]/60 transition-colors"
                  >
                    <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">{m.date}</td>
                    <td className="py-3 px-3.5 text-neutral-300">{m.shoulders_cm ? `${m.shoulders_cm} cm` : '—'}</td>
                    <td className="py-3 px-3.5 text-neutral-300">{m.chest_cm ? `${m.chest_cm} cm` : '—'}</td>
                    <td className="py-3 px-3.5 text-neutral-300">{m.waist_cm ? `${m.waist_cm} cm` : '—'}</td>
                    <td className="py-3 px-3.5 text-neutral-300">{m.arm_cm ? `${m.arm_cm} cm` : '—'}</td>
                    <td className="py-3 px-3.5 font-black text-[#facc15]">{ratio}</td>
                    <td className="py-3 px-3.5 text-neutral-400 text-xs max-w-[200px] truncate">
                      {m.notes || '—'}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => removeMeasurement(m.date)}
                        className="p-1 text-neutral-500 hover:text-[#ef4444] transition-colors cursor-pointer"
                        title="Delete check-in"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Log Check-In Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="LOG BODY TAPE CHECK-IN"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
              Check-In Date
            </label>
            <input
              type="date"
              value={formData.date || ''}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
              className="w-full bg-[#121214] border border-[#27272a] px-3 py-2 text-xs text-white font-mono-stat focus:outline-none focus:border-[#dc2626]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Shoulders (cm)', field: 'shoulders_cm' as const },
              { label: 'Chest (cm)', field: 'chest_cm' as const },
              { label: 'Waist (cm)', field: 'waist_cm' as const },
              { label: 'Flexed Arm (cm)', field: 'arm_cm' as const },
              { label: 'Neck (cm)', field: 'neck_cm' as const },
              { label: 'Hips (cm)', field: 'hip_cm' as const },
              { label: 'Thigh (cm)', field: 'thigh_cm' as const },
              { label: 'Calf (cm)', field: 'calf_cm' as const },
            ].map((f) => (
              <div key={f.field}>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                  {f.label}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData[f.field] ?? ''}
                  onChange={(e) => handleInputChange(f.field, e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-[#121214] border border-[#27272a] px-3 py-2 text-xs text-white font-mono-stat focus:outline-none focus:border-[#dc2626]"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
              Check-In Notes
            </label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="e.g. Fasted morning check-in"
              className="w-full bg-[#121214] border border-[#27272a] px-3 py-2 text-xs text-white font-mono-stat focus:outline-none focus:border-[#dc2626]"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#27272a]">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Check-In'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
