import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BodyMeasurement } from '../types/Measurement';
import { ApiClient } from '../services/ApiClient';

interface MeasurementState {
  measurements: BodyMeasurement[];
  isLoading: boolean;
  error: string | null;
  saveMeasurement: (entry: BodyMeasurement) => Promise<boolean>;
  removeMeasurement: (date: string) => Promise<boolean>;
  fetchMeasurements: () => Promise<void>;
}

const DEFAULT_MEASUREMENTS: BodyMeasurement[] = [
  {
    date: '2026-09-18',
    shoulders_cm: 122.5,
    chest_cm: 104.0,
    waist_cm: 80.5,
    arm_cm: 38.5,
    neck_cm: 39.5,
    hip_cm: 95.0,
    thigh_cm: 59.5,
    calf_cm: 38.0,
    notes: 'Morning tape check-in fasted. Waist down 0.5cm, shoulder breadth up.',
  },
  {
    date: '2026-09-04',
    shoulders_cm: 121.0,
    chest_cm: 102.5,
    waist_cm: 81.5,
    arm_cm: 38.0,
    neck_cm: 39.5,
    hip_cm: 95.5,
    thigh_cm: 59.0,
    calf_cm: 38.0,
    notes: 'Post-workout measurement. Delts pumped.',
  },
  {
    date: '2026-08-20',
    shoulders_cm: 119.5,
    chest_cm: 101.0,
    waist_cm: 82.5,
    arm_cm: 37.2,
    neck_cm: 39.0,
    hip_cm: 96.0,
    thigh_cm: 58.5,
    calf_cm: 37.5,
    notes: 'Initial mesocycle baseline.',
  },
];

export const useMeasurementStore = create<MeasurementState>()(
  persist(
    (set, get) => ({
      measurements: DEFAULT_MEASUREMENTS,
      isLoading: false,
      error: null,

      fetchMeasurements: async () => {
        set({ isLoading: true, error: null });
        try {
          const remote = await ApiClient.getMeasurements();
          if (Array.isArray(remote) && remote.length > 0) {
            set({ measurements: remote, isLoading: false });
            return;
          }
        } catch {
          // Backend offline or unreachable — keep cached local measurements
        }
        set({ isLoading: false });
      },

      saveMeasurement: async (entry: BodyMeasurement) => {
        // Optimistically update local store
        const existingIndex = get().measurements.findIndex((m) => m.date === entry.date);
        let updated: BodyMeasurement[];
        if (existingIndex >= 0) {
          updated = [...get().measurements];
          updated[existingIndex] = { ...updated[existingIndex], ...entry };
        } else {
          updated = [entry, ...get().measurements].sort((a, b) => b.date.localeCompare(a.date));
        }
        set({ measurements: updated });

        // Sync with backend if available
        try {
          if (existingIndex >= 0) {
            await ApiClient.updateMeasurement(entry.date, entry);
          } else {
            await ApiClient.createMeasurement(entry);
          }
        } catch {
          // Keep optimistic local update
        }

        return true;
      },

      removeMeasurement: async (date: string) => {
        const filtered = get().measurements.filter((m) => m.date !== date);
        set({ measurements: filtered });

        try {
          await ApiClient.deleteMeasurement(date);
        } catch {
          // Ignore remote deletion errors
        }

        return true;
      },
    }),
    {
      name: 'fitbuddy_measurements_cache',
    }
  )
);
