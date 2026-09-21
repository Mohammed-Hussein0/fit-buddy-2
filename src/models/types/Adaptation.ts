export type MuscleStatus = 'weak' | 'balanced' | 'dominant';

export interface MuscleAssessment {
  muscle_group: string;
  status: MuscleStatus;
  confidence_score: number;
  notes?: string;
}

export interface LLMAnalysisPayload {
  user_id: string;
  assessment_date: string;
  muscle_analysis: MuscleAssessment[];
}

export interface AdaptedExercise {
  name: string;
  sets: number;
  reps: string;
  muscle_group?: string;
  category?: string;
  type?: 'compound' | 'isolation';
}

export interface AdaptedRoutine {
  routine_name: string;
  exercises: AdaptedExercise[];
}

export interface AdaptationRequest {
  analysis_payload: LLMAnalysisPayload;
  current_routine: AdaptedRoutine;
  weekly_set_counts?: Record<string, number>;
}

export type ModificationAction =
  | 'COMPOUND_INJECTED'
  | 'VOLUME_INCREASE'
  | 'VOLUME_DECREASE'
  | 'SUBSTITUTION'
  | 'NO_MATCH_WARNING';

export interface ModificationLog {
  action: ModificationAction;
  muscle_group: string;
  details: string;
}

export interface AdaptationResponse {
  user_id: string;
  routine_name: string;
  modified_routine: AdaptedRoutine;
  modifications_applied: ModificationLog[];
}

// ── Multi-Day Program Adaptation Types ───────────────────────────────────────

export interface ProgramDay {
  day_id: string;
  day_title: string;
  exercises: AdaptedExercise[];
}

export interface ProgramAdaptationRequest {
  analysis_payload: LLMAnalysisPayload;
  program_name: string;
  days: ProgramDay[];
  weekly_set_counts?: Record<string, number>;
  prescribed_exercises?: string[];
}

export interface ProgramAdaptationResponse {
  user_id: string;
  program_name: string;
  modified_days: ProgramDay[];
  modifications_applied: ModificationLog[];
}
