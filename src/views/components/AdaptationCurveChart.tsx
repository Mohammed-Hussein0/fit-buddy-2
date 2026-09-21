import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { HorizonDataPoint } from '../../models/services/ProgressDiagnosticEngine';

interface AdaptationCurveChartProps {
  data: HorizonDataPoint[];
  height?: number;
  activeTimeframe?: string;
}

export function AdaptationCurveChart({
  data,
  height = 240,
  activeTimeframe,
}: AdaptationCurveChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    isActive: d.timeframe === activeTimeframe,
  }));

  return (
    <div style={{ width: '100%', height }} className="font-mono-stat">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 25, left: -5, bottom: 8 }}>
          <defs>
            <linearGradient id="expectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#facc15" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#facc15" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} opacity={0.6} />
          <XAxis
            dataKey="shortLabel"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#27272a' }}
            tick={{ fill: '#a1a1aa', fontWeight: 700 }}
            dy={8}
          />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `+${val}%`}
            tick={{ fill: '#71717a' }}
            dx={-4}
          />
          <Tooltip
            cursor={{ stroke: '#dc2626', strokeWidth: 1, strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as HorizonDataPoint & { isActive: boolean };
                const isOptimal = item.actualRate >= item.expectedRate;
                return (
                  <div className="bg-[#0e0e10] border-l-4 border-l-[#dc2626] border-y border-r border-[#27272a] p-4 text-xs font-mono-stat shadow-2xl space-y-2.5 min-w-[240px]">
                    <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                      <span className="font-black text-white text-xs uppercase">
                        {item.label}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 uppercase ${
                        isOptimal ? 'bg-[#14532d] text-[#4ade80]' : 'bg-[#78350f] text-[#fde047]'
                      }`}>
                        {isOptimal ? 'OPTIMAL' : 'UNDER TARGET'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#facc15] font-bold">REQUIRED CEILING:</span>
                      <span className="text-white font-black">+{item.expectedRate}% (ΔAS: +{item.expectedDeltaAS})</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#22c55e] font-bold">ACTUAL TRAJECTORY:</span>
                      <span className="text-white font-black">+{item.actualRate}% (ΔAS: +{item.actualDeltaAS})</span>
                    </div>

                    <div className="pt-1.5 border-t border-[#222226] text-[10px] text-neutral-400">
                      Delta: <strong className={item.actualRate >= item.expectedRate ? 'text-[#4ade80]' : 'text-[#f87171]'}>
                        {(item.actualRate - item.expectedRate).toFixed(1)}% vs Ceiling
                      </strong>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {/* Expected Adaptation Ceiling Area */}
          <Area
            type="monotone"
            dataKey="expectedRate"
            stroke="#facc15"
            strokeWidth={2}
            fill="url(#expectedGradient)"
            name="Required Biological Ceiling"
            dot={{ fill: '#facc15', r: 4, stroke: '#000', strokeWidth: 1.5 }}
            activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
          />
          {/* Actual User Trajectory Line */}
          <Line
            type="monotone"
            dataKey="actualRate"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ fill: '#22c55e', r: 4, stroke: '#000', strokeWidth: 1.5 }}
            activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
            name="Actual Lifter Trajectory"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
