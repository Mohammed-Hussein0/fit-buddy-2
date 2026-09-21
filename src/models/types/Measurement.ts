export interface BodyMeasurement {
  id?: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  waist_cm?: number | null;
  chest_cm?: number | null;
  shoulders_cm?: number | null;
  arm_cm?: number | null;
  neck_cm?: number | null;
  hip_cm?: number | null;
  thigh_cm?: number | null;
  calf_cm?: number | null;
  notes?: string | null;
}

export interface VTaperEvaluation {
  ratio: number;
  targetRatio: number;
  percentageToGolden: number;
  category: 'ELITE V-TAPER' | 'STRONG V-TAPER' | 'ATHLETIC' | 'DEVELOPING';
  tierColor: string;
  description: string;
}

/**
 * Calculates the classic Bodybuilding / Classical Greek V-Taper Adonis Index (Shoulder Circumference / Waist Circumference).
 * Golden Ratio benchmark = 1.618.
 */
export function evaluateVTaper(shouldersCm?: number | null, waistCm?: number | null): VTaperEvaluation | null {
  if (!shouldersCm || !waistCm || waistCm <= 0) return null;

  const ratio = parseFloat((shouldersCm / waistCm).toFixed(3));
  const targetRatio = 1.618;
  const percentageToGolden = Math.min(100, Math.round((ratio / targetRatio) * 100));

  if (ratio >= 1.618) {
    return {
      ratio,
      targetRatio,
      percentageToGolden,
      category: 'ELITE V-TAPER',
      tierColor: '#facc15', // Gold
      description: 'Matches or exceeds the Classical Golden Ratio (1.618). Dominant shoulder breadth relative to narrow waist.',
    };
  } else if (ratio >= 1.50) {
    return {
      ratio,
      targetRatio,
      percentageToGolden,
      category: 'STRONG V-TAPER',
      tierColor: '#ef4444', // Red
      description: 'High aesthetic taper. Broad clavicle/lat sweep with tight waistline.',
    };
  } else if (ratio >= 1.38) {
    return {
      ratio,
      targetRatio,
      percentageToGolden,
      category: 'ATHLETIC',
      tierColor: '#3b82f6', // Blue
      description: 'Solid athletic proportions. Continue building lateral delts and lats while maintaining waist circumference.',
    };
  } else {
    return {
      ratio,
      targetRatio,
      percentageToGolden,
      category: 'DEVELOPING',
      tierColor: '#a1a1aa', // Gray
      description: 'Base foundation. Focus on lat width (pullups, pulldowns) and side delt hypertrophic volume.',
    };
  }
}
