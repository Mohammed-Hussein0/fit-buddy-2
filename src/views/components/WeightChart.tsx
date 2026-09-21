import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface WeightEntry {
  date: string;
  weight: number;
}

interface WeightChartProps {
  currentWeight: number;
  goalWeight: number;
  height?: number;
}

export function WeightChart({ currentWeight, goalWeight, height = 200 }: WeightChartProps) {
  const data: WeightEntry[] = [
    { date: 'Nov 25', weight: currentWeight + 4.2 },
    { date: 'Dec 25', weight: currentWeight + 3.0 },
    { date: 'Jan 26', weight: currentWeight + 2.1 },
    { date: 'Feb 26', weight: currentWeight + 1.4 },
    { date: 'Mar 26', weight: currentWeight + 0.8 },
    { date: 'Apr 26', weight: currentWeight + 0.2 },
    { date: 'Today', weight: currentWeight },
  ];

  const minW = Math.min(...data.map((d) => d.weight), goalWeight) - 2;
  const maxW = Math.max(...data.map((d) => d.weight), goalWeight) + 2;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
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
                    <p className="text-[10px] text-neutral-500 mt-1">Goal: {goalWeight} kg</p>
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
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
