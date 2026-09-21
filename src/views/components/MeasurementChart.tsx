import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { BodyMeasurement } from '../../models/types/Measurement';

export type MeasurementMetric = 'vTaper' | 'shoulders' | 'waist' | 'chest' | 'arm';

interface MeasurementChartProps {
  measurements: BodyMeasurement[];
  height?: number;
}

interface MetricConfig {
  key: MeasurementMetric;
  label: string;
  unit: string;
  color: string;
  target?: number;
  targetLabel?: string;
  getValue: (m: BodyMeasurement) => number | null;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'vTaper',
    label: 'V-Taper Ratio',
    unit: '',
    color: '#facc15', // Gold
    target: 1.618,
    targetLabel: '1.618 Golden Ratio',
    getValue: (m) =>
      m.shoulders_cm && m.waist_cm && m.waist_cm > 0
        ? parseFloat((m.shoulders_cm / m.waist_cm).toFixed(3))
        : null,
  },
  {
    key: 'shoulders',
    label: 'Shoulders',
    unit: 'cm',
    color: '#dc2626', // Red
    getValue: (m) => m.shoulders_cm ?? null,
  },
  {
    key: 'waist',
    label: 'Waist',
    unit: 'cm',
    color: '#ef4444', // Red-Orange
    getValue: (m) => m.waist_cm ?? null,
  },
  {
    key: 'chest',
    label: 'Chest',
    unit: 'cm',
    color: '#3b82f6', // Blue
    getValue: (m) => m.chest_cm ?? null,
  },
  {
    key: 'arm',
    label: 'Arms',
    unit: 'cm',
    color: '#a855f7', // Purple
    getValue: (m) => m.arm_cm ?? null,
  },
];

export function MeasurementChart({ measurements, height = 220 }: MeasurementChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MeasurementMetric>('vTaper');

  const activeConfig = useMemo(
    () => METRIC_CONFIGS.find((c) => c.key === selectedMetric) || METRIC_CONFIGS[0],
    [selectedMetric]
  );

  // Format data chronological (oldest to newest)
  const chartData = useMemo(() => {
    if (!measurements || measurements.length === 0) return [];

    const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date));

    return sorted
      .map((m) => {
        const val = activeConfig.getValue(m);
        if (val === null) return null;

        // Format date: e.g. "Sep 18"
        const d = new Date(m.date);
        const formattedDate = isNaN(d.getTime())
          ? m.date
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return {
          date: formattedDate,
          fullDate: m.date,
          value: val,
        };
      })
      .filter((item): item is { date: string; fullDate: string; value: number } => item !== null);
  }, [measurements, activeConfig]);

  const { minVal, maxVal } = useMemo(() => {
    if (chartData.length === 0) return { minVal: 0, maxVal: 100 };
    const values = chartData.map((d) => d.value);
    if (activeConfig.target) values.push(activeConfig.target);

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (activeConfig.key === 'vTaper') {
      return {
        minVal: parseFloat(Math.max(1.0, min - 0.08).toFixed(2)),
        maxVal: parseFloat((max + 0.08).toFixed(2)),
      };
    }

    return {
      minVal: Math.floor(min - 2),
      maxVal: Math.ceil(max + 2),
    };
  }, [chartData, activeConfig]);

  return (
    <div className="space-y-3">
      {/* Metric Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {METRIC_CONFIGS.map((config) => {
            const isSelected = selectedMetric === config.key;
            return (
              <button
                key={config.key}
                onClick={() => setSelectedMetric(config.key)}
                className={`px-2.5 py-1 text-[10px] font-black uppercase font-mono-stat border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#dc2626] text-white border-[#dc2626]'
                    : 'bg-[#18181b] text-neutral-400 border-[#27272a] hover:text-white hover:bg-[#222226]'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {chartData.length > 0 && (
          <div className="text-[10px] font-mono-stat text-neutral-400">
            LATEST: <span className="font-black text-white">{chartData[chartData.length - 1].value} {activeConfig.unit}</span>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div style={{ width: '100%', height }}>
        {chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center border border-dashed border-[#27272a] text-xs font-mono-stat text-neutral-500">
            NO MEASUREMENT DATA RECORDED YET
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${activeConfig.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0.0} />
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
                domain={[minVal, maxVal]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}${activeConfig.unit}`}
                tick={{ fill: '#71717a' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as { date: string; fullDate: string; value: number };
                    return (
                      <div className="bg-[#121214] border-l-2 border-l-[#dc2626] border-y border-r border-[#27272a] p-2.5 shadow-2xl text-xs font-mono-stat">
                        <p className="font-bold text-neutral-400 mb-0.5 text-[10px] uppercase">{item.fullDate}</p>
                        <p className="font-black text-white text-sm">
                          {activeConfig.label}: {item.value}{' '}
                          <span className="text-xs font-normal text-neutral-400">{activeConfig.unit}</span>
                        </p>
                        {activeConfig.target && (
                          <p className="text-[10px] text-[#facc15] mt-1 font-bold">
                            Target: {activeConfig.target} ({activeConfig.targetLabel})
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {activeConfig.target && (
                <ReferenceLine
                  y={activeConfig.target}
                  stroke="#facc15"
                  strokeDasharray="3 3"
                  opacity={0.7}
                  label={{
                    value: `GOLDEN ${activeConfig.target}`,
                    fill: '#facc15',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke={activeConfig.color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#grad-${activeConfig.key})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
