import { useEffect, useMemo, useState } from 'react';
import { useMeasurementStore } from '../models/repositories/MeasurementStore';
import { BodyMeasurement, evaluateVTaper, VTaperEvaluation } from '../models/types/Measurement';

export function useMeasurementsController() {
  const { measurements, isLoading, fetchMeasurements, saveMeasurement, removeMeasurement } =
    useMeasurementStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  const latest = useMemo(() => {
    return measurements.length > 0 ? measurements[0] : null;
  }, [measurements]);

  const previous = useMemo(() => {
    return measurements.length > 1 ? measurements[1] : null;
  }, [measurements]);

  const vTaper: VTaperEvaluation | null = useMemo(() => {
    return evaluateVTaper(latest?.shoulders_cm, latest?.waist_cm);
  }, [latest]);

  const deltaShoulders = useMemo(() => {
    if (!latest?.shoulders_cm || !previous?.shoulders_cm) return null;
    return parseFloat((latest.shoulders_cm - previous.shoulders_cm).toFixed(1));
  }, [latest, previous]);

  const deltaWaist = useMemo(() => {
    if (!latest?.waist_cm || !previous?.waist_cm) return null;
    return parseFloat((latest.waist_cm - previous.waist_cm).toFixed(1));
  }, [latest, previous]);

  const handleSave = async (entry: BodyMeasurement) => {
    setIsSubmitting(true);
    try {
      const ok = await saveMeasurement(entry);
      return ok;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    measurements,
    latest,
    previous,
    vTaper,
    deltaShoulders,
    deltaWaist,
    isLoading,
    isSubmitting,
    saveMeasurement: handleSave,
    removeMeasurement,
    refresh: fetchMeasurements,
  };
}
