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
  resetMeasurements: () => void;
}

const DEFAULT_MEASUREMENTS: BodyMeasurement[] = [];

export const useMeasurementStore = create<MeasurementState>()(
  persist(
    (set, get) => ({
      measurements: DEFAULT_MEASUREMENTS,
      isLoading: false,
      error: null,

      resetMeasurements: () => set({ measurements: [] }),

      fetchMeasurements: async () => {
        set({ isLoading: true, error: null });
        try {
          const remote = await ApiClient.getMeasurements();
          if (Array.isArray(remote)) {
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
