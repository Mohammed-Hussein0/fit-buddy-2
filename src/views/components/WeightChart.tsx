import { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { apiClient } from '../../models/services/ApiClient';
import { Scale } from 'lucide-react';

export interface WeightEntry {
  date: string;
  weight: number;
}

interface WeightChartProps {
  currentWeight: number;
  goalWeight: number;
  height?: number;
}

export function WeightChart({ currentWeight, goalWeight, height = 200 }: WeightChartProps) {
  const [logs, setLogs] = useState<WeightEntry[]>([]);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .getWeightLogs(60)
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          // Sort ascending chronologically
          const sorted = [...items].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setLogs(sorted);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentWeight]);

  // Build chart data strictly from real data
  let data: WeightEntry[] = [];
  if (logs.length > 0) {
    let foundToday = false;
    data = logs.map((it) => {
      const d = new Date(it.date);
      const isToday = new Date().toDateString() === d.toDateString();
      if (isToday) foundToday = true;
      const formatted = isToday
        ? 'Today'
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: formatted,
        weight: isToday && currentWeight > 0 ? currentWeight : it.weight,
      };
    });
    // If user has set currentWeight today and it's not yet in logs, append it
    if (!foundToday && currentWeight > 0) {
      data.push({ date: 'Today', weight: currentWeight });
    }
  } else if (currentWeight > 0) {
    // Only 1 real entry: the user's current weight
    data = [{ date: 'Today', weight: currentWeight }];
  }

  // If user hasn't entered anything yet, do not render fabricated charts
  if (data.length === 0) {
    return (
      <div
        style={{ width: '100%', height }}
        className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#27272a] rounded-xl bg-[#141416]/40 font-mono-stat"
      >
        <Scale size={28} className="text-neutral-600 mb-2.5" />
        <p className="text-xs font-black uppercase tracking-wider text-neutral-400">No Weight History Recorded</p>
        <p className="text-[11px] text-neutral-500 mt-1 max-w-[260px] leading-relaxed">
          Update your current weight in the card above to plot your real weight progress.
        </p>
      </div>
    );
  }

  const weights = data.map((d) => d.weight);
  const refWeights = goalWeight > 0 ? [...weights, goalWeight] : weights;
  const minW = refWeights.length > 0 ? Math.min(...refWeights) - 2 : 50;
  const maxW = refWeights.length > 0 ? Math.max(...refWeights) + 2 : 100;

  return (
    <div style={{ width: '100%', height }} className="font-mono-stat">
      {data.length <= 1 && (
        <div className="text-[11px] text-neutral-500 mb-2 flex items-center justify-between">
          <span>Real weigh-in history</span>
          <span className="text-neutral-400">1 entry recorded ({currentWeight} kg)</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={data.length <= 1 ? height - 20 : height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="weightGradRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} opacity={0.6} />
          <XAxis
            dataKey="date"
            stroke="#71717a"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: '#27272a' }}
            tick={{ fill: '#a1a1aa', fontWeight: 600 }}
          />
          <YAxis
            stroke="#71717a"
            fontSize={10}
            domain={[Math.floor(minW), Math.ceil(maxW)]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}kg`}
            tick={{ fill: '#71717a' }}
          />
          {goalWeight > 0 && (
            <ReferenceLine
              y={goalWeight}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: `Goal: ${goalWeight}kg`,
                fill: '#ef4444',
                fontSize: 10,
                position: 'right',
              }}
            />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as WeightEntry;
                return (
                  <div className="bg-[#121214] border-l-2 border-l-[#dc2626] border-y border-r border-[#27272a] rounded-lg p-2.5 shadow-2xl text-xs font-mono-stat">
                    <p className="font-bold text-neutral-400 mb-0.5 text-[10px] uppercase">{item.date}</p>
                    <p className="font-black text-white text-sm">
                      {item.weight} <span className="text-xs font-normal text-neutral-400">kg</span>
                    </p>
                    {goalWeight > 0 && (
                      <p className="text-[10px] text-neutral-500 mt-1">Goal: {goalWeight} kg</p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#dc2626"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#weightGradRed)"
            dot={{ fill: '#dc2626', r: 4, stroke: '#000', strokeWidth: 1.5 }}
            activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
