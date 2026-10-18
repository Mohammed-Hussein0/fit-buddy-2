import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { HorizonDataPoint } from '../../models/services/ProgressDiagnosticEngine';

interface AdaptationCurveChartProps {
  data: HorizonDataPoint[];
  height?: number;
  activeTimeframe?: string;
  loggedDurationLabel?: string;
}

export function AdaptationCurveChart({
  data,
  height = 280,
  activeTimeframe,
  loggedDurationLabel,
}: AdaptationCurveChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    isActive: d.timeframe === activeTimeframe,
  }));

  const activeItem = chartData.find((d) => d.timeframe === activeTimeframe);

  return (
    <div style={{ width: '100%', height }} className="font-mono-stat relative">
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
            tick={(props: any) => {
              const { x, y, payload } = props;
              const item = chartData.find((d) => d.shortLabel === payload.value);
              const isActive = item?.isActive;
              const isCur = item?.isCurrent;
              return (
                <text
                  x={x}
                  y={y + 12}
                  textAnchor="middle"
                  fill={isActive ? '#ef4444' : isCur ? '#4ade80' : '#a1a1aa'}
                  fontWeight={isActive || isCur ? 900 : 700}
                  fontSize={10}
                >
                  {payload.value}
                </text>
              );
            }}
          />

          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `+${val}%`}
            tick={{ fill: '#71717a' }}
            domain={[0, (dataMax: number) => Math.max(105, Math.ceil(dataMax / 10) * 10)]}
            dx={-4}
          />

          {activeItem && (
            <ReferenceLine
              x={activeItem.shortLabel}
              stroke="#dc2626"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />
          )}

          <Tooltip
            cursor={{ stroke: '#dc2626', strokeWidth: 1, strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as HorizonDataPoint & { isActive: boolean };
                const hasActual = item.actualRate !== null && item.actualRate !== undefined;
                const isOptimal = hasActual && item.actualRate! >= item.expectedRate;

                return (
                  <div className="bg-[#0e0e10] border-l-4 border-l-[#dc2626] border-y border-r border-[#27272a] p-4 text-xs font-mono-stat shadow-2xl space-y-2.5 min-w-[260px]">
                    <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                      <span className="font-black text-white text-xs uppercase">
                        {item.label}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 uppercase ${
                          !hasActual
                            ? 'bg-[#27272a] text-neutral-400'
                            : isOptimal
                            ? 'bg-[#14532d] text-[#4ade80]'
                            : 'bg-[#78350f] text-[#fde047]'
                        }`}
                      >
                        {!hasActual ? 'UPCOMING' : isOptimal ? 'OPTIMAL' : 'UNDER TARGET'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#facc15] font-bold">REQUIRED CEILING:</span>
                      <span className="text-white font-black">
                        +{item.expectedRate}% (ΔAS: +{item.expectedDeltaAS})
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#22c55e] font-bold">ACTUAL TRAJECTORY:</span>
                      <span className="text-white font-black">
                        {hasActual
                          ? `+${item.actualRate}% (ΔAS: +${item.actualDeltaAS})`
                          : 'Not reached yet (future horizon)'}
                      </span>
                    </div>

                    {hasActual ? (
                      <div className="pt-1.5 border-t border-[#222226] text-[10px] text-neutral-400">
                        Delta vs Ceiling:{' '}
                        <strong
                          className={
                            item.actualRate! >= item.expectedRate ? 'text-[#4ade80]' : 'text-[#f87171]'
                          }
                        >
                          {(item.actualRate! - item.expectedRate).toFixed(1)}%
                        </strong>
                      </div>
                    ) : (
                      <div className="pt-1.5 border-t border-[#222226] text-[10px] text-neutral-500 italic">
                        Logged history: {loggedDurationLabel || 'Ongoing'}
                      </div>
                    )}
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

          {/* Actual User Trajectory Line (Strictly bounds to real logged history via connectNulls={false}) */}
          <Line
            type="monotone"
            dataKey="actualRate"
            stroke="#22c55e"
            strokeWidth={2.5}
            connectNulls={false}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.actualRate === null || payload.actualRate === undefined) return null;
              const isCur = payload.isCurrent;
              return (
                <circle
                  key={`dot-${payload.shortLabel || props.index}`}
                  cx={cx}
                  cy={cy}
                  r={isCur ? 5.5 : 4}
                  fill={isCur ? '#4ade80' : '#22c55e'}
                  stroke={isCur ? '#ffffff' : '#000'}
                  strokeWidth={isCur ? 2 : 1.5}
                />
              );
            }}
            activeDot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.actualRate === null || payload.actualRate === undefined) return null;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={7}
                  fill="#22c55e"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              );
            }}
            name="Actual Lifter Trajectory"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
