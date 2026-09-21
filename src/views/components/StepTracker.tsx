import { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { Card, Button } from './ui';
import { ApiClient } from '../../models/services/ApiClient';

interface StepTrackerProps {
  stepGoal: number;
}

const STORAGE_KEY = 'fitbuddy-daily-steps';

export function StepTracker({ stepGoal }: StepTrackerProps) {
  const [steps, setSteps] = useState<number>(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`${STORAGE_KEY}-${today}`);
    return saved ? parseInt(saved, 10) : 5840;
  });

  const [customInput, setCustomInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`${STORAGE_KEY}-${today}`, steps.toString());
    // Background sync to FastAPI backend (/api/steps)
    ApiClient.logSteps({ date: today, steps }).catch(() => {
      // Graceful offline fallback
    });
  }, [steps]);

  const progress = Math.min(1, steps / (stepGoal || 8000));
  const pct = Math.round(progress * 100);
  const goalReached = steps >= stepGoal;

  const handleAddSteps = (amount: number) => {
    setSteps((prev) => prev + amount);
  };

  const handleSetCustom = () => {
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val >= 0) {
      setSteps(val);
      setCustomInput('');
      setIsAdding(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-[#dc2626]" />
          <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Daily Step Volume</h4>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2 py-0.5 uppercase tracking-wider font-mono-stat border ${
            goalReached
              ? 'bg-[#14532d] text-[#4ade80] border-[#22c55e]'
              : 'bg-[#18181b] text-neutral-400 border-[#27272a]'
          }`}>
            {goalReached ? 'TARGET HIT' : `${pct}% TARGET`}
          </span>
          <button
            onClick={() => setIsAdding((v) => !v)}
            className="px-2 py-0.5 bg-[#18181b] hover:bg-[#27272a] text-neutral-400 hover:text-white transition-colors cursor-pointer border border-[#27272a] text-xs font-mono font-bold"
            title="Log steps"
          >
            [EDIT]
          </button>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2.5 font-mono-stat">
        <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {steps.toLocaleString()}
        </span>
        <span className="text-xs font-bold text-neutral-500 uppercase">
          / {stepGoal.toLocaleString()} STEPS
        </span>
      </div>

      {/* Sharp Flat Bar */}
      <div className="relative w-full h-2 bg-[#18181b] overflow-hidden mb-3 border border-[#27272a]">
        <div
          className={`h-full transition-all duration-200 ${
            goalReached ? 'bg-[#22c55e]' : 'bg-[#dc2626]'
          }`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>

      {/* Quick Increments */}
      <div className="flex items-center justify-between pt-2 border-t border-[#262626] text-xs font-mono-stat">
        <span className="text-neutral-500 font-bold text-[10px] uppercase tracking-wider">INCREMENT:</span>
        <div className="flex items-center gap-1.5">
          {[500, 1000, 2500].map((amt) => (
            <button
              key={amt}
              onClick={() => handleAddSteps(amt)}
              className="px-2.5 py-1 bg-[#18181b] hover:bg-[#222226] text-neutral-300 font-bold transition-colors cursor-pointer text-[11px] border border-[#27272a]"
            >
              +{amt >= 1000 ? `${amt / 1000}K` : amt}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Input Drawer */}
      {isAdding && (
        <div className="mt-3 pt-3 border-t border-[#262626] flex gap-2">
          <input
            type="number"
            placeholder="Enter total steps"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="flex-1 bg-black border border-[#333338] px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#dc2626] font-mono-stat"
          />
          <Button size="sm" onClick={handleSetCustom}>
            <Check size={13} /> Update
          </Button>
        </div>
      )}
    </Card>
  );
}
