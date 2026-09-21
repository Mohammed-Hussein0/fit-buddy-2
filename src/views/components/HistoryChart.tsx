import { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Award, Layers } from 'lucide-react';

export interface HistoryPoint {
  date: string;
  bestEpley1RM: number;
  workoutTitle?: string;
  totalVolume?: number;
}

interface HistoryChartProps {
  data: HistoryPoint[];
  color?: string;
  height?: number;
}

interface ProcessedPoint extends HistoryPoint {
  formattedDate: string; // e.g. "Aug 3, '26"
  fullDate: string;      // e.g. "Mon, Aug 3, 2026"
  gainKg: number;
  isPRIncrease: boolean;
  index: number;
}

export function HistoryChart({ data, color = '#ef4444', height = 230 }: HistoryChartProps) {
  const [filterMode, setFilterMode] = useState<'increases' | 'all'>('increases');

  // Process data chronologically and consolidate same-day records into a single peak PR per calendar day
  const { increasePoints, allPoints, totalGainKg } = useMemo(() => {
    // 1. Filter valid entries and sort chronologically
    const valid = [...data]
      .filter((d) => d && d.date && !isNaN(new Date(d.date).getTime()) && Number(d.bestEpley1RM) > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 2. Consolidate same-day records: On any given calendar day, keep the highest 1RM achieved
    const dayMap = new Map<string, ProcessedPoint>();

    valid.forEach((item) => {
      const val = Math.round(Number(item.bestEpley1RM) * 10) / 10;
      const d = new Date(item.date);
      // Local calendar day key (YYYY-MM-DD)
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate();
      const yr = String(d.getFullYear()).slice(-2); // e.g. '26
      const formattedDate = `${month} ${day}, '${yr}`;
      const fullDate = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const existing = dayMap.get(dayKey);
      if (!existing || val > existing.bestEpley1RM) {
        dayMap.set(dayKey, {
          ...item,
          bestEpley1RM: val,
          formattedDate,
          fullDate,
          gainKg: 0,
          isPRIncrease: false,
          index: 0,
        });
      }
    });

    // 3. Convert consolidated daily peaks to a sorted array
    const dailyPoints = Array.from(dayMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 4. Compute 1RM progressive overload increases across days
    const incs: ProcessedPoint[] = [];
    const all: ProcessedPoint[] = [];
    let runningPeak = 0;

    dailyPoints.forEach((point) => {
      const isIncrease = point.bestEpley1RM > runningPeak;
      const gainKg = runningPeak > 0 && isIncrease ? Math.round((point.bestEpley1RM - runningPeak) * 10) / 10 : 0;

      const processedPoint: ProcessedPoint = {
        ...point,
        gainKg,
        isPRIncrease: isIncrease,
        index: all.length + 1,
      };

      all.push(processedPoint);

      if (isIncrease) {
        runningPeak = point.bestEpley1RM;
        incs.push({
          ...processedPoint,
          index: incs.length + 1,
        });
      }
    });

    const baseline = incs[0]?.bestEpley1RM || 0;
    const currentPeak = incs[incs.length - 1]?.bestEpley1RM || 0;
    const totalGain = Math.max(0, Math.round((currentPeak - baseline) * 10) / 10);

    return {
      increasePoints: incs,
      allPoints: all,
      totalGainKg: totalGain,
    };
  }, [data]);

  if (allPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-44 text-neutral-500 text-xs font-mono-stat uppercase tracking-wider space-y-2">
        <TrendingUp size={22} className="text-neutral-600" />
        <p>No progression history logged yet.</p>
        <span className="text-[10px] text-neutral-600">Complete workouts or benchmark your 1RM to build your overload curve.</span>
      </div>
    );
  }

  const activePoints = filterMode === 'increases' ? increasePoints : allPoints;
  const displayData = activePoints.length > 0 ? activePoints : allPoints;

  const minVal = Math.min(...displayData.map((d) => d.bestEpley1RM));
  const maxVal = Math.max(...displayData.map((d) => d.bestEpley1RM));
  const yDomain =
    minVal === maxVal
      ? [Math.max(0, Math.floor(minVal * 0.85)), Math.ceil(maxVal * 1.15)]
      : [Math.max(0, Math.floor(minVal * 0.92)), Math.ceil(maxVal * 1.06)];

  return (
    <div className="space-y-3 font-mono-stat">
      {/* ─── Chart Mode Filter & Stat Header ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#222226]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1">
            <Award size={13} className="text-[#dc2626]" />
            {filterMode === 'increases' ? (
              <>
                <strong className="text-white">{increasePoints.length}</strong> PR INCREASES
              </>
            ) : (
              <>
                <strong className="text-white">{allPoints.length}</strong> LOGGED SESSIONS
              </>
            )}
          </span>
          {totalGainKg > 0 && filterMode === 'increases' && (
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800">
              +{totalGainKg} kg Progression
            </span>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilterMode('increases')}
            className={`px-2 py-1 text-[10px] font-black uppercase transition-all border cursor-pointer ${
              filterMode === 'increases'
                ? 'bg-[#dc2626] text-white border-[#dc2626]'
                : 'bg-[#141416] text-neutral-400 border-[#27272a] hover:text-white'
            }`}
          >
            ★ 1RM Increases Only ({increasePoints.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2 py-1 text-[10px] font-black uppercase transition-all border cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#dc2626] text-white border-[#dc2626]'
                : 'bg-[#141416] text-neutral-400 border-[#27272a] hover:text-white'
            }`}
          >
            All Sessions ({allPoints.length})
          </button>
        </div>
      </div>

      {/* ─── Recharts SVG Line Chart ────────────────────────────────────────── */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} opacity={0.6} />
            <XAxis
              dataKey="formattedDate"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
              tick={{ fill: '#a1a1aa', fontWeight: 700 }}
            />
            <YAxis
              stroke="#71717a"
              fontSize={10}
              domain={yDomain}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}kg`}
              tick={{ fill: '#71717a' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as ProcessedPoint;
                  return (
                    <div className="bg-[#121214] border-l-2 border-l-[#dc2626] border-y border-r border-[#27272a] p-3 shadow-2xl text-xs font-mono-stat min-w-[190px]">
                      <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#222226] mb-1.5">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">
                          {item.fullDate}
                        </span>
                        {item.isPRIncrease && (
                          <span className="text-[8px] font-black uppercase px-1 py-0.2 bg-[#dc2626] text-white">
                            NEW PR
                          </span>
                        )}
                      </div>

                      <p className="font-black text-white text-base leading-tight">
                        {item.bestEpley1RM}{' '}
                        <span className="text-xs font-normal text-neutral-400">kg</span>
                        <span className="text-[#ef4444] text-[10px] ml-1.5 uppercase font-bold">1RM</span>
                      </p>

                      {item.isPRIncrease && item.gainKg > 0 && (
                        <p className="text-[10px] text-emerald-400 font-bold mt-1">
                          ▲ +{item.gainKg} kg Overload Increase
                        </p>
                      )}

                      <p className="text-[10px] text-neutral-500 mt-1 truncate">
                        {item.workoutTitle || 'Logged Workout'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="bestEpley1RM"
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 4, fill: color, stroke: '#09090b', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#ffffff', stroke: color, strokeWidth: 2.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[9px] text-neutral-500 uppercase tracking-wider">
        {filterMode === 'increases'
          ? 'Only milestone one-rep max increases are charted to track your progressive overload.'
          : 'Viewing every recorded workout date for this exercise.'}
      </p>
    </div>
  );
}
