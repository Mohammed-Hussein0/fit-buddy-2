export interface PREntry {
  oneRM: number; // Epley calculated 1RM (kg)
  rpe: number;   // RPE at which it was achieved (1–10)
}

export type PRRecord = Record<string, PREntry>;
