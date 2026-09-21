import { WorkoutSession } from '../types/WorkoutHistory';

export interface WeeklyVolumeItem {
  key: string;
  label: string;
  volume: number; // kg
}

export interface VolumeSummary {
  weeklyData: WeeklyVolumeItem[];
  thisWeekVolume: number;
  lastWeekVolume: number;
  percentChange: number | null;
}

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function weekLabel(key: string): string {
  const [year, wStr] = key.split('-W');
  const week = parseInt(wStr, 10);
  const jan1 = new Date(parseInt(year, 10), 0, 1);
  const dayOfWeek = jan1.getDay() || 7;
  const offset = (week - 1) * 7 - dayOfWeek + 1;
  const mon = new Date(parseInt(year, 10), 0, 1 + offset);
  return mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function computeVolumeSummary(sessions: WorkoutSession[], numWeeks = 8): VolumeSummary {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    const key = isoWeekKey(new Date(s.date));
    map[key] = (map[key] ?? 0) + s.totalVolume;
  }

  const weeklyData: WeeklyVolumeItem[] = [];
  const now = new Date();
  for (let i = numWeeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const key = isoWeekKey(d);
    weeklyData.push({
      key,
      label: weekLabel(key),
      volume: map[key] ?? 0,
    });
  }

  const thisWeekVolume = weeklyData[weeklyData.length - 1]?.volume ?? 0;
  const lastWeekVolume = weeklyData[weeklyData.length - 2]?.volume ?? 0;
  const percentChange =
    lastWeekVolume > 0
      ? Math.round(((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100)
      : null;

  return {
    weeklyData,
    thisWeekVolume,
    lastWeekVolume,
    percentChange,
  };
}
