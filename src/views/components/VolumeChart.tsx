import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { WeeklyVolumeItem } from '../../models/services/VolumeService';

interface VolumeChartProps {
  data: WeeklyVolumeItem[];
  height?: number;
}

export function VolumeChart({ data, height = 180 }: VolumeChartProps) {
  const chartData = data.map((item, idx) => ({
    ...item,
    volumeTons: Number((item.volume / 1000).toFixed(2)),
    isCurrent: idx === data.length - 1,
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 16, right: 16, left: -10, bottom: 6 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} opacity={0.6} />
          <XAxis
            dataKey="label"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#27272a' }}
            tick={{ fill: '#a1a1aa', fontWeight: 600 }}
            dy={6}
          />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}t`}
            tick={{ fill: '#71717a' }}
            dx={-4}
          />
          <Tooltip
            cursor={{ fill: 'rgba(220, 38, 38, 0.08)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-[#121214] border-l-2 border-l-[#dc2626] border-y border-r border-[#27272a] p-3.5 shadow-2xl text-xs font-mono-stat space-y-1">
                    <p className="font-bold text-neutral-400 text-[11px] uppercase tracking-wider">Week of {item.label}</p>
                    <p className="font-black text-white text-base">
                      {item.volume.toLocaleString()} <span className="text-xs text-neutral-400 font-normal">kg</span>
                      <span className="text-[#ef4444] font-black text-sm ml-2">({item.volumeTons}t)</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="volumeTons" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isCurrent ? '#ef4444' : '#7f1d1d'}
                opacity={entry.isCurrent ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
