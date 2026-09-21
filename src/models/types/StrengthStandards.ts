export type Tier = 1 | 2 | 3 | 4 | 5;

export const TIER_LABELS: Record<Tier, string> = {
  1: 'Untrained',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Elite',
};

export const TIER_COLORS: Record<Tier, string> = {
  1: '#71717a', // zinc-500 (Untrained / Beginner)
  2: '#a1a1aa', // zinc-400 (Novice)
  3: '#d4d4d8', // zinc-300 (Intermediate)
  4: '#ffffff', // crisp white (Advanced)
  5: '#ef4444', // crimson red (Elite)
};

export function getPercentileColor(percentile: number): string {
  if (percentile >= 92) return '#ef4444';
  if (percentile >= 75) return '#ffffff';
  if (percentile >= 45) return '#d4d4d8';
  if (percentile >= 15) return '#a1a1aa';
  return '#71717a';
}

