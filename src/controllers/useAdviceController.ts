import { useState, useCallback, useEffect } from 'react';
import { analyzePhysiquePhotos } from '../models/services/PhysiqueAIService';
import { ApiClient } from '../models/services/ApiClient';
import { useWorkoutStore } from '../models/repositories/WorkoutStore';
import {
  AdaptationRequest,
  AdaptationResponse,
  MuscleAssessment,
  AdaptedExercise,
  ProgramDay,
  ProgramAdaptationRequest,
  ProgramAdaptationResponse,
} from '../models/types/Adaptation';
import { EXERCISE_IMAGES, ExerciseId, normalizeExerciseKey } from '../models/types/Exercise';
import { WorkoutExercise } from '../models/types/Workout';

export interface ActionPlanItem {
  exerciseName: string;
  cue: string;
}

export interface ParsedCritique {
  lacking: string[];
  excelling: string[];
  actionPlan: ActionPlanItem[];
}

function matchMuscleKeys(phrase: string): string[] {
  const p = phrase.toLowerCase();
  const keys = new Set<string>();

  // Specific chest heads
  if (p.includes('upper chest') || p.includes('clavicular') || p.includes('upper pec')) {
    keys.add('upper_chest');
  }
  if (p.includes('lower chest') || p.includes('lower pec') || p.includes('costal')) {
    keys.add('lower_chest');
  }
  // Generic chest only if not upper/lower and not chest-supported
  if (
    (p.includes('chest') || p.includes('pec') || p.includes('bench press')) &&
    !p.includes('upper chest') &&
    !p.includes('upper pec') &&
    !p.includes('lower chest') &&
    !p.includes('lower pec') &&
    !p.includes('chest-supported') &&
    !p.includes('chest supported')
  ) {
    keys.add('chest');
  }

  // Shoulders
  if (p.includes('rear delt') || p.includes('posterior delt')) {
    keys.add('rear_delts');
  }
  if (p.includes('side delt') || p.includes('lateral delt') || p.includes('medial delt') || p.includes('delt width')) {
    keys.add('side_delts');
  }
  if (p.includes('front delt') || p.includes('anterior delt')) {
    keys.add('front_delts');
  }
  if (
    (p.includes('shoulder') || p.includes('delt')) &&
    !p.includes('rear') &&
    !p.includes('posterior') &&
    !p.includes('side') &&
    !p.includes('lateral') &&
    !p.includes('medial') &&
    !p.includes('front') &&
    !p.includes('anterior')
  ) {
    keys.add('shoulders');
  }

  // Back
  if (
    p.includes('mid-back') ||
    p.includes('mid back') ||
    p.includes('upper back') ||
    p.includes('rhomboid') ||
    p.includes('back thickness')
  ) {
    keys.add('upper_back');
  }
  if (p.includes('lat') || p.includes('v-taper') || p.includes('lat width') || p.includes('latissimus')) {
    keys.add('lats');
  }
  if (p.includes('trap')) {
    keys.add('traps');
  }
  if (
    p.includes('back') &&
    !p.includes('upper back') &&
    !p.includes('mid-back') &&
    !p.includes('mid back') &&
    !p.includes('lower back') &&
    !p.includes('lat')
  ) {
    keys.add('back');
  }

  // Arms
  const hasBicep = p.includes('bicep') || p.includes('curl');
  const hasTricep = p.includes('tricep') || p.includes('pushdown') || p.includes('skull crusher') || p.includes('dip');
  const hasForearm = p.includes('forearm');

  if (hasBicep) keys.add('biceps');
  if (hasTricep) keys.add('triceps');
  if (hasForearm) keys.add('forearms');

  if (/\b(arm|arms)\b/i.test(p) && !hasBicep && !hasTricep && !hasForearm) {
    keys.add('arms');
  }

  // Legs
  if (p.includes('quad') || p.includes('thigh') || p.includes('leg sweep') || p.includes('squat') || p.includes('leg press')) {
    keys.add('quads');
  }
  if (p.includes('hamstring') || p.includes('rear thigh') || p.includes('leg curl') || p.includes('rdl')) {
    keys.add('hamstrings');
  }
  if (p.includes('glute') || p.includes('hip thrust')) {
    keys.add('glutes');
  }
  if (p.includes('calf') || p.includes('calves') || p.includes('calf raise')) {
    keys.add('calves');
  }
  if (
    /\b(leg|legs)\b/i.test(p) &&
    !p.includes('quad') &&
    !p.includes('hamstring') &&
    !p.includes('calf') &&
    !p.includes('calves')
  ) {
    keys.add('legs');
  }

  // Core
  if (p.includes('abs') || p.includes('abdominal') || p.includes('midsection') || p.includes('core')) {
    keys.add('abs');
  }

  return Array.from(keys);
}

export function parsePhysiqueCritique(text: string): ParsedCritique {
  const lacking = new Set<string>();
  const excelling = new Set<string>();
  const actionPlan: ActionPlanItem[] = [];

  const lines = text.split('\n');
  const sections: Record<string, string[]> = {};
  let currentSection = 'HEADER';

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(?:\*{0,2})OVERALL REVIEW:?(?:\*{0,2})/i.test(trimmed)) {
      currentSection = 'OVERALL';
      sections[currentSection] = [];
    } else if (/^(?:\*{0,2})(?:LAGGING|WEAK|PRIORITY)(?: GROUPS?| AREAS?)?:?(?:\*{0,2})/i.test(trimmed)) {
      currentSection = 'LAGGING';
      sections[currentSection] = [];
    } else if (/^(?:\*{0,2})(?:ACTION PLAN|RECOMMENDATIONS?):?(?:\*{0,2})/i.test(trimmed)) {
      currentSection = 'ACTION_PLAN';
      sections[currentSection] = [];
    } else if (/^(?:\*{0,2})(?:STRONG|EXCELLING)(?: GROUPS?| AREAS?)?:?(?:\*{0,2})/i.test(trimmed)) {
      currentSection = 'STRONG';
      sections[currentSection] = [];
    } else if (sections[currentSection]) {
      sections[currentSection].push(trimmed);
    }
  }

  // 1. Process LAGGING section if present
  if (sections['LAGGING'] && sections['LAGGING'].length > 0) {
    for (const line of sections['LAGGING']) {
      if (!line) continue;
      let musclePart = line;
      if (line.includes(':')) {
        musclePart = line.split(':')[0];
      }
      musclePart = musclePart.replace(/^[-*•\d.]+\s*/, '').replace(/\*+/g, '').trim();

      const matched = matchMuscleKeys(musclePart);
      for (const m of matched) {
        lacking.add(m);
      }
    }
  }

  // 2. Process ACTION PLAN section if present
  if (sections['ACTION_PLAN'] && sections['ACTION_PLAN'].length > 0) {
    for (const line of sections['ACTION_PLAN']) {
      if (!line || !line.includes(':')) continue;
      const colonIdx = line.indexOf(':');
      const exRaw = line.slice(0, colonIdx).replace(/^[-*•\d.]+\s*/, '').replace(/\*+/g, '').trim();
      const cue = line.slice(colonIdx + 1).replace(/\*+/g, '').trim();

      if (exRaw.length > 0) {
        actionPlan.push({
          exerciseName: exRaw,
          cue,
        });

        // Fallback: if no lacking muscles found in LAGGING section, infer from action plan
        if (lacking.size === 0) {
          const exMuscles = matchMuscleKeys(exRaw);
          for (const m of exMuscles) {
            if (!m.includes('chest') || (!exRaw.toLowerCase().includes('chest-supported') && !exRaw.toLowerCase().includes('chest supported'))) {
              lacking.add(m);
            }
          }
        }
      }
    }
  }

  // 3. Process OVERALL / STRONG section
  const reviewLines = (sections['OVERALL'] || []).concat(sections['STRONG'] || []);
  for (const line of reviewLines) {
    const isStrongContext = /strong|solid|great|good|well-developed|developed|impressive|dominant|thick|exceptional|crisp/.test(line.toLowerCase());
    if (isStrongContext) {
      const found = matchMuscleKeys(line);
      for (const m of found) {
        if (!lacking.has(m) && !(m === 'biceps' && lacking.has('arms')) && !(m === 'triceps' && lacking.has('arms'))) {
          excelling.add(m);
        }
      }
    }
  }

  // Fallbacks if nothing matched
  if (lacking.size === 0) {
    for (const line of lines) {
      const isWeakContext = /lagging|lacking|weak|underdeveloped|bring up|focus|prioritize|needs? work|deficit|deficient|flat|small|behind|low volume/.test(line.toLowerCase());
      if (isWeakContext) {
        const found = matchMuscleKeys(line);
        found.forEach((m) => lacking.add(m));
      }
    }
  }

  if (lacking.size === 0) {
    lacking.add('side_delts');
    lacking.add('upper_chest');
  }

  if (excelling.size === 0) {
    const lower = text.toLowerCase();
    if (lower.includes('chest') && !lacking.has('chest') && !lacking.has('upper_chest')) excelling.add('chest');
    else if (lower.includes('back') && !lacking.has('lats') && !lacking.has('upper_back')) excelling.add('upper_back');
    else if (lower.includes('leg') && !lacking.has('quads')) excelling.add('quads');
    else excelling.add('chest');
  }

  // Strictly enforce mutual exclusivity
  for (const m of lacking) {
    excelling.delete(m);
    if (m === 'arms') {
      excelling.delete('biceps');
      excelling.delete('triceps');
    }
    if (m === 'back') {
      excelling.delete('lats');
      excelling.delete('upper_back');
    }
    if (m === 'shoulders') {
      excelling.delete('side_delts');
      excelling.delete('rear_delts');
      excelling.delete('front_delts');
    }
    if (m === 'legs') {
      excelling.delete('quads');
      excelling.delete('hamstrings');
      excelling.delete('calves');
    }
  }

  return {
    lacking: Array.from(lacking),
    excelling: Array.from(excelling),
    actionPlan,
  };
}

export function extractMusclesFromCritique(text: string): { lacking: string[]; excelling: string[] } {
  const { lacking, excelling } = parsePhysiqueCritique(text);
  return { lacking, excelling };
}

export function useAdviceController() {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Pinpointed muscles from advice or user refinement
  const [lackingMuscles, setLackingMuscles] = useState<string[]>(['side_delts', 'upper_chest']);
  const [excellingMuscles, setExcellingMuscles] = useState<string[]>(['chest']);
  const [actionPlan, setActionPlan] = useState<ActionPlanItem[]>([]);

  // Backend connection status
  const [backendStatus, setBackendStatus] = useState<{
    online: boolean;
    llmReady: boolean;
    provider?: string;
  }>({ online: false, llmReady: false });

  // Single-day adaptation state (legacy/fallback)
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptationResult, setAdaptationResult] = useState<AdaptationResponse | null>(null);
  const [adaptationError, setAdaptationError] = useState<string | null>(null);

  // Multi-day program adaptation state
  const [isAdaptingProgram, setIsAdaptingProgram] = useState(false);
  const [programAdaptationResult, setProgramAdaptationResult] = useState<ProgramAdaptationResponse | null>(null);
  const [programAdaptationError, setProgramAdaptationError] = useState<string | null>(null);
  const [programAppliedSuccess, setProgramAppliedSuccess] = useState(false);

  const { getActiveProgram, getActiveWorkouts, activeExerciseMap, updateWorkoutExercises } = useWorkoutStore();

  // Ping backend on mount
  useEffect(() => {
    let mounted = true;
    ApiClient.checkHealth().then((res) => {
      if (mounted) {
        setBackendStatus({
          online: res.online,
          llmReady: !!res.llm_key_loaded,
          provider: res.provider,
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSetPhoto = useCallback((slot: 'front' | 'back', file: File) => {
    const url = URL.createObjectURL(file);
    if (slot === 'front') {
      setFrontImage(url);
      setFrontFile(file);
    } else {
      setBackImage(url);
      setBackFile(file);
    }
    setError(null);
  }, []);

  const handleRemovePhoto = useCallback((slot: 'front' | 'back') => {
    if (slot === 'front') {
      setFrontImage(null);
      setFrontFile(null);
    } else {
      setBackImage(null);
      setBackFile(null);
    }
  }, []);

  const handleSubmitAnalysis = useCallback(async () => {
    if (!frontFile || !backFile) {
      setError('Please provide both front and back photos for an accurate physique analysis.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAdaptationResult(null);
    setProgramAdaptationResult(null);
    setProgramAppliedSuccess(false);

    try {
      let textResult = '';
      if (backendStatus.online && backendStatus.llmReady) {
        textResult = await ApiClient.analyzePhysique(frontFile, backFile);
      } else {
        textResult = await analyzePhysiquePhotos(frontFile, backFile);
      }
      setAnalysisResult(textResult);

      // Auto-extract lacking and excelling areas from advice critique
      const { lacking, excelling, actionPlan: extractedActionPlan } = parsePhysiqueCritique(textResult);
      setLackingMuscles(lacking);
      setExcellingMuscles(excelling);
      setActionPlan(extractedActionPlan);
    } catch (err: any) {
      console.error('Physique analysis error:', err);
      setError(err.message || 'Failed to analyze photos. Please check that photos clearly show your upper body.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [frontFile, backFile, backendStatus]);

  // Toggle helpers for weak and dominant muscle chips
  const toggleLackingMuscle = useCallback((muscle: string) => {
    setLackingMuscles((prev) => {
      if (prev.includes(muscle)) {
        return prev.filter((m) => m !== muscle);
      } else {
        // Remove from excelling if marked as lacking
        setExcellingMuscles((e) => e.filter((m) => m !== muscle));
        return [...prev, muscle];
      }
    });
  }, []);

  const toggleExcellingMuscle = useCallback((muscle: string) => {
    setExcellingMuscles((prev) => {
      if (prev.includes(muscle)) {
        return prev.filter((m) => m !== muscle);
      } else {
        // Remove from lacking if marked as excelling
        setLackingMuscles((l) => l.filter((m) => m !== muscle));
        return [...prev, muscle];
      }
    });
  }, []);

  /**
   * Adapts the user's running multi-day routine (all 4-6 days) based on
   * the pinpointed lacking (weak) and excelling (dominant) muscles.
   */
  const adaptActiveProgram = useCallback(async () => {
    const allActive = getActiveWorkouts();
    const activeProgram = getActiveProgram();

    // If a certain day has 0 exercises do not count it as a day
    const activeWorkouts = allActive.filter((w) => (activeExerciseMap[w.id] || []).length > 0);

    if (!activeWorkouts || activeWorkouts.length === 0) {
      setProgramAdaptationError('No active workout days with exercises found in your routine.');
      return;
    }

    setIsAdaptingProgram(true);
    setProgramAdaptationError(null);
    setProgramAppliedSuccess(false);

    try {
      const days: ProgramDay[] = activeWorkouts.map((w) => {
        const exs = activeExerciseMap[w.id] || [];
        return {
          day_id: w.id,
          day_title: w.title,
          exercises: exs.map((e) => ({
            name: e.name,
            sets: Math.max(1, e.sets.length),
            reps: e.sets[0]?.reps || '8-10',
            muscle_group: e.muscleGroup.toLowerCase(),
          })),
        };
      });

      // Strictly deduplicate and enforce mutual exclusivity
      const cleanLacking = Array.from(new Set(lackingMuscles.map((m) => m.trim().toLowerCase())));
      const cleanExcelling = Array.from(
        new Set(excellingMuscles.map((m) => m.trim().toLowerCase()))
      ).filter((m) => !cleanLacking.includes(m));

      const muscleAssessments: MuscleAssessment[] = [
        ...cleanLacking.map((m) => ({
          muscle_group: m,
          status: 'weak' as const,
          confidence_score: 0.9,
        })),
        ...cleanExcelling.map((m) => ({
          muscle_group: m,
          status: 'dominant' as const,
          confidence_score: 0.85,
        })),
      ];

      const req: ProgramAdaptationRequest = {
        analysis_payload: {
          user_id: 'local-user-id',
          assessment_date: new Date().toISOString().split('T')[0],
          muscle_analysis: muscleAssessments,
        },
        program_name: activeProgram?.title || 'Active Routine',
        days,
        prescribed_exercises: actionPlan.map((a) => a.exerciseName),
      };

      const res = await ApiClient.adaptProgram(req);
      setProgramAdaptationResult(res);
    } catch (err: any) {
      console.error('Program adaptation failed:', err);
      setProgramAdaptationError(err?.message || 'Failed to adapt routine with engine');
    } finally {
      setIsAdaptingProgram(false);
    }
  }, [actionPlan, activeExerciseMap, excellingMuscles, getActiveProgram, getActiveWorkouts, lackingMuscles]);

  /**
   * Applies all modified days from the engine adaptation back to the WorkoutStore.
   */
  const applyAdaptedProgram = useCallback(() => {
    if (!programAdaptationResult) return false;

    for (const day of programAdaptationResult.modified_days) {
      const newExercises: WorkoutExercise[] = day.exercises.map((ex, idx) => {
        const canonicalKey = normalizeExerciseKey(ex.name);
        const matchingImage =
          EXERCISE_IMAGES[canonicalKey] ||
          (EXERCISE_IMAGES as any)[ex.name] ||
          'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80';

        const setCount = Math.min(6, Math.max(1, ex.sets));
        const repsVal = ex.reps.includes('-') ? ex.reps.split('-')[0] : ex.reps;
        const sets = Array.from({ length: setCount }, (_, sIdx) => ({
          id: `adapted-${day.day_id}-${idx}-${sIdx}-${Date.now()}`,
          weight: '70',
          reps: repsVal || '8',
          rpe: 8,
        }));

        return {
          id: `ex-adapted-${day.day_id}-${idx}-${Date.now()}`,
          name: canonicalKey,
          muscleGroup: (ex.muscle_group || 'Compound').toUpperCase(),
          imageUrl: matchingImage,
          sets,
        };
      });

      updateWorkoutExercises(day.day_id, newExercises);
    }

    setProgramAppliedSuccess(true);
    return true;
  }, [programAdaptationResult, updateWorkoutExercises]);

  /**
   * Triggers the Python Adaptation Engine using identified lagging muscles
   * and the user's currently active workout session.
   */
  const triggerAdaptationEngine = useCallback(
    async (workoutId?: string) => {
      const activeWorkouts = getActiveWorkouts();
      if (!activeWorkouts || activeWorkouts.length === 0) {
        setAdaptationError('No active workouts found in your routine.');
        return;
      }

      const targetWorkout = workoutId
        ? activeWorkouts.find((w) => w.id === workoutId) || activeWorkouts[0]
        : activeWorkouts[0];

      const currentExercises: WorkoutExercise[] =
        activeExerciseMap[targetWorkout.id] || [];

      if (currentExercises.length === 0) {
        setAdaptationError('The selected workout day contains no exercises to adapt.');
        return;
      }

      setIsAdapting(true);
      setAdaptationError(null);

      const cleanLacking = Array.from(new Set(lackingMuscles.map((m) => m.trim().toLowerCase())));
      const cleanExcelling = Array.from(
        new Set(excellingMuscles.map((m) => m.trim().toLowerCase()))
      ).filter((m) => !cleanLacking.includes(m));

      const muscleAssessments: MuscleAssessment[] = [
        ...cleanLacking.map((m) => ({ muscle_group: m, status: 'weak' as const, confidence_score: 0.9 })),
        ...cleanExcelling.map((m) => ({ muscle_group: m, status: 'dominant' as const, confidence_score: 0.85 })),
      ];

      const routinePayloadExercises: AdaptedExercise[] = currentExercises.map((e) => ({
        name: e.name,
        sets: Math.max(1, e.sets.length),
        reps: e.sets[0]?.reps || '8-10',
        muscle_group: e.muscleGroup.toLowerCase(),
      }));

      const req: AdaptationRequest = {
        analysis_payload: {
          user_id: 'local-user-id',
          assessment_date: new Date().toISOString().split('T')[0],
          muscle_analysis: muscleAssessments,
        },
        current_routine: {
          routine_name: targetWorkout.title,
          exercises: routinePayloadExercises,
        },
        weekly_set_counts: {
          chest: 12,
          shoulders: 8,
          back: 10,
          legs: 12,
        },
      };

      try {
        const adapted = await ApiClient.adaptRoutine(req);
        setAdaptationResult(adapted);
      } catch (err: any) {
        setAdaptationError(err?.message || 'Failed to adapt routine with engine');
      } finally {
        setIsAdapting(false);
      }
    },
    [activeExerciseMap, excellingMuscles, getActiveWorkouts, lackingMuscles]
  );

  /**
   * Applies the adapted routine directly to the active program's workout.
   */
  const applyAdaptedRoutine = useCallback(
    (workoutId?: string) => {
      if (!adaptationResult) return false;

      const activeWorkouts = getActiveWorkouts();
      const targetWorkout = workoutId
        ? activeWorkouts.find((w) => w.id === workoutId) || activeWorkouts[0]
        : activeWorkouts[0];

      if (!targetWorkout) return false;

      const newExercises: WorkoutExercise[] = adaptationResult.modified_routine.exercises.map(
        (ex, idx) => {
          const canonicalKey = normalizeExerciseKey(ex.name);
          const matchingImage = (EXERCISE_IMAGES as any)[canonicalKey] ||
            'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80';

          const setCount = Math.min(5, Math.max(1, ex.sets));
          const sets = Array.from({ length: setCount }, (_, sIdx) => ({
            id: `adapted-${Date.now()}-${sIdx}`,
            weight: '70',
            reps: ex.reps.includes('-') ? ex.reps.split('-')[0] : ex.reps,
            rpe: 8,
          }));

          return {
            id: `ex-adapted-${Date.now()}-${idx}`,
            name: canonicalKey,
            muscleGroup: (ex.muscle_group || 'Compound').toUpperCase(),
            imageUrl: matchingImage,
            sets,
          };
        }
      );

      updateWorkoutExercises(targetWorkout.id, newExercises);
      return true;
    },
    [adaptationResult, getActiveWorkouts, updateWorkoutExercises]
  );

  return {
    frontImage,
    backImage,
    isAnalyzing,
    analysisResult,
    error,
    showGuide,
    backendStatus,
    lackingMuscles,
    excellingMuscles,
    toggleLackingMuscle,
    toggleExcellingMuscle,
    isAdapting,
    adaptationResult,
    adaptationError,
    isAdaptingProgram,
    programAdaptationResult,
    programAdaptationError,
    programAppliedSuccess,
    getActiveProgram,
    getActiveWorkouts,
    activeExerciseMap,
    setPhoto: handleSetPhoto,
    removePhoto: handleRemovePhoto,
    toggleGuide: () => setShowGuide((v) => !v),
    submitAnalysis: handleSubmitAnalysis,
    adaptActiveProgram,
    applyAdaptedProgram,
    triggerAdaptationEngine,
    applyAdaptedRoutine,
    clearAdaptation: () => {
      setAdaptationResult(null);
      setProgramAdaptationResult(null);
      setProgramAppliedSuccess(false);
    },
    resetAnalysis: () => {
      setAnalysisResult(null);
      setAdaptationResult(null);
      setProgramAdaptationResult(null);
      setProgramAppliedSuccess(false);
      setActionPlan([]);
      setLackingMuscles(['side_delts', 'upper_chest']);
      setExcellingMuscles(['chest']);
    },
    actionPlan,
    setActionPlan,
  };
}
