import { supabase } from '../repositories/SupabaseRepo';
import { BodyMeasurement } from '../types/Measurement';
import { WorkoutSession } from '../types/WorkoutHistory';
import {
  AdaptationRequest,
  AdaptationResponse,
  ProgramAdaptationRequest,
  ProgramAdaptationResponse,
} from '../types/Adaptation';

/**
 * Resolves the API Base URL dynamically.
 * If running on a local LAN IP (e.g. from a phone accessing 192.168.x.x:5173),
 * it points to the same host on port 8000.
 */
function getApiBaseUrl(): string {
  if (import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    return `http://${host}:8000/api`;
  }
  return 'http://localhost:8000/api';
}

function formatApiError(err: any, fallback: string): string {
  if (!err) return fallback;
  let msg = '';
  if (typeof err === 'string') {
    msg = err;
  } else if (typeof err.detail === 'string') {
    msg = err.detail;
  } else if (Array.isArray(err.detail)) {
    msg = err.detail
      .map((item: any) => {
        if (typeof item === 'string') return item;
        const loc = item.loc ? item.loc.filter((x: any) => x !== 'body').join('.') : '';
        return loc ? `${loc}: ${item.msg}` : item.msg;
      })
      .filter(Boolean)
      .join(', ');
  } else if (typeof err.message === 'string') {
    msg = err.message;
  } else {
    try {
      msg = JSON.stringify(err.detail || err);
    } catch {
      msg = fallback;
    }
  }

  // If the error message embeds raw JSON from an upstream API, extract the innermost human message
  if (msg && msg.includes('{')) {
    const jsonMatch = msg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        } else if (parsed?.detail && typeof parsed.detail === 'string') {
          msg = parsed.detail;
        }
      } catch {
        // keep msg
      }
    }
  }

  const lower = (msg || '').toLowerCase();
  if (
    lower.includes('high demand') ||
    lower.includes('spikes in demand') ||
    lower.includes('503') ||
    lower.includes('unavailable')
  ) {
    return 'The AI vision service is currently experiencing high demand. Please try again in a few moments.';
  }
  if (lower.includes('rate limit') || lower.includes('resource_exhausted') || lower.includes('429')) {
    return 'The AI service is receiving too many requests. Please wait a few seconds before trying again.';
  }
  if (lower.includes('bad gateway') || lower.includes('502') || lower.includes('econnrefused')) {
    return 'The AI vision service is temporarily unavailable. Please try again shortly.';
  }

  // Safety filter: ensure no JSON structure leaks into UI text
  if (msg.includes('{') || msg.includes('}') || msg.includes('detail')) {
    return 'The AI vision service is currently experiencing high demand. Please try again in a few moments.';
  }

  return msg || fallback;
}

export interface SavedPhysiqueAnalysis {
  id: string;
  summary: string;
  strong_muscles: string[];
  lacking_muscles: { muscle: string; reason: string }[];
  advice: { exercise: string; cue: string }[];
  created_at: string;
}

class ApiClientService {
  private get baseUrl(): string {
    return getApiBaseUrl();
  }

  private async getHeaders(contentType: string | null = 'application/json'): Promise<HeadersInit> {
    const headers: Record<string, string> = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    } catch {
      // Offline / unauthenticated
    }

    return headers;
  }

  /**
   * Ping backend health endpoint to check connection and LLM key status.
   */
  async checkHealth(): Promise<{ online: boolean; llm_key_loaded?: boolean; provider?: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/analysis/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        return { online: true, llm_key_loaded: data.llm_key_loaded, provider: data.provider };
      }
      return { online: false, error: `Status ${res.status}` };
    } catch (err: any) {
      return { online: false, error: err?.message || 'Unreachable' };
    }
  }

  /**
   * Send physique photos to backend analysis endpoint.
   */
  async analyzePhysique(frontFile: File | Blob, backFile: File | Blob): Promise<SavedPhysiqueAnalysis> {
    const formData = new FormData();
    formData.append('front', frontFile, 'front.jpg');
    formData.append('back', backFile, 'back.jpg');

    const headers = await this.getHeaders(null); // No Content-Type; let browser set multipart boundary

    const res = await fetch(`${this.baseUrl}/analysis/analyze`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(async () => {
        const text = await res.text().catch(() => '');
        return { detail: text };
      });
      throw new Error(formatApiError(err, `Analysis failed (${res.status})`));
    }

    return await res.json();
  }

  /**
   * Retrieve the user's latest saved physique analysis from the backend.
   */
  async getLatestAnalysis(): Promise<SavedPhysiqueAnalysis | null> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${this.baseUrl}/analysis/latest`, {
        method: 'GET',
        headers,
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Retrieve physique analysis history from the backend.
   */
  async getAnalysisHistory(limit: number = 10): Promise<SavedPhysiqueAnalysis[]> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${this.baseUrl}/analysis/history?limit=${limit}`, {
        method: 'GET',
        headers,
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Run the Python Adaptation Engine decision tree to rebalance routines.
   */
  async adaptRoutine(payload: AdaptationRequest): Promise<AdaptationResponse> {
    const headers = await this.getHeaders('application/json');

    const res = await fetch(`${this.baseUrl}/engine/adapt-routine`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const detail = errJson?.detail || res.statusText;
      throw new Error(`Engine adaptation error: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
    }

    return await res.json();
  }

  /**
   * Run the Python Adaptation Engine decision tree across all 4-6 days of a program.
   */
  async adaptProgram(payload: ProgramAdaptationRequest): Promise<ProgramAdaptationResponse> {
    const headers = await this.getHeaders('application/json');

    const res = await fetch(`${this.baseUrl}/engine/adapt-program`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const detail = errJson?.detail || res.statusText;
      throw new Error(`Program adaptation error: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
    }

    return await res.json();
  }

  // ---------------------------------------------------------------------------
  // User Profile (/api/users/profile)
  // ---------------------------------------------------------------------------


  async getProfile(): Promise<any | null> {
    const headers = await this.getHeaders();
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/users/profile`, {
        method: 'GET',
        headers,
      });
    } catch (err: any) {
      throw new Error(`Cannot connect to FitBuddy backend server: ${err?.message || 'Server offline'}`);
    }

    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(formatApiError(err, `Backend profile error (${res.status})`));
    }
    return await res.json();
  }

  async createProfile(data: {
    username: string;
    birth_date: string;
    gender: string;
    height: number;
    goal_weight: number;
    experience_level?: string;
    current_weight?: number;
    avatar_url?: string;
  }): Promise<any> {
    const headers = await this.getHeaders('application/json');
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/users/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      throw new Error(`Cannot connect to FitBuddy backend server: ${err?.message || 'Server offline'}`);
    }

    if (res.status === 409 || res.status === 400) {
      const err = await res.json().catch(() => null);
      if (err?.detail && typeof err.detail === 'string' && err.detail.toLowerCase().includes('already exists')) {
        const existing = await this.getProfile();
        if (existing) return existing;
      }
      throw new Error(formatApiError(err, 'Failed to create profile'));
    }

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(formatApiError(err, 'Failed to create profile'));
    }
    return await res.json();
  }

  async updateProfile(data: Record<string, any>): Promise<any> {
    const headers = await this.getHeaders('application/json');
    const res = await fetch(`${this.baseUrl}/users/profile`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(formatApiError(err, 'Failed to update profile'));
    }
    return await res.json();
  }

  // ---------------------------------------------------------------------------
  // Weight Logs (/api/weight-logs)
  // ---------------------------------------------------------------------------

  async getWeightLogs(limit: number = 50): Promise<{ date: string; weight: number }[]> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${this.baseUrl}/weight-logs?limit=${limit}`, {
        method: 'GET',
        headers,
      });
      if (!res.ok) return [];
      const data = await res.json();
      const items = data.items || [];
      return items.map((it: any) => ({
        date: it.date,
        weight: parseFloat(it.weight_kg),
      }));
    } catch {
      return [];
    }
  }

  async logWeight(weightKg: number, date?: string): Promise<any> {
    try {
      const headers = await this.getHeaders('application/json');
      const targetDate = date || new Date().toISOString().split('T')[0];
      const res = await fetch(`${this.baseUrl}/weight-logs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: targetDate,
          weight_kg: weightKg,
        }),
      });
      if (res.status === 409) {
        return await fetch(`${this.baseUrl}/weight-logs/${targetDate}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ weight_kg: weightKg }),
        }).then((r) => r.json());
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Body Measurements (/api/measurements)
  // ---------------------------------------------------------------------------

  async getMeasurements(fromDate?: string, toDate?: string): Promise<BodyMeasurement[]> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const headers = await this.getHeaders();

    const res = await fetch(`${this.baseUrl}/measurements${qs}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) throw new Error(`Fetch measurements failed: ${res.statusText}`);
    return await res.json();
  }

  async createMeasurement(data: Partial<BodyMeasurement>): Promise<BodyMeasurement> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/measurements`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || 'Failed to save measurement');
    }

    return await res.json();
  }

  async updateMeasurement(date: string, data: Partial<BodyMeasurement>): Promise<BodyMeasurement> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/measurements/${date}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error(`Update measurement failed: ${res.statusText}`);
    return await res.json();
  }

  async deleteMeasurement(date: string): Promise<void> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/measurements/${date}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Delete measurement failed: ${res.statusText}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Workout Sets (/api/workout-sets) & Notes (/api/workout-notes)
  // ---------------------------------------------------------------------------

  async getWorkoutSets(date?: string, exerciseId?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (exerciseId) params.append('exercise_id', exerciseId.toString());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const headers = await this.getHeaders();

    const res = await fetch(`${this.baseUrl}/workout-sets${qs}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error('Failed to fetch workout sets');
    return await res.json();
  }

  async createWorkoutSet(data: {
    exercise_id: number;
    set_number: number;
    weight_kg: number;
    reps: number;
    rpe?: number;
    is_warmup?: boolean;
    logged_date?: string;
  }): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/workout-sets`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || 'Failed to log set');
    }
    return await res.json();
  }

  async recordWorkoutSession(session: {
    workout_id?: string;
    workout_title: string;
    date?: string;
    exercises: {
      exercise_key: string;
      exercise_name?: string;
      sets: {
        set_number: number;
        weight_kg: number;
        reps: number;
        rpe?: number;
      }[];
    }[];
  }): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/workout-sets/session`, {
      method: 'POST',
      headers,
      body: JSON.stringify(session),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || 'Failed to record workout session');
    }
    return await res.json();
  }

  async getWorkoutHistory(limit = 50, fromDate?: string, toDate?: string, exerciseId?: number): Promise<WorkoutSession[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    if (exerciseId) params.append('exercise_id', exerciseId.toString());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/workout-sets/history${qs}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || 'Failed to fetch workout history');
    }
    const raw = await res.json();
    return (raw || []).map((item: any) => ({
      id: String(item.id),
      workoutId: item.workout_id || item.workoutId || '',
      workoutTitle: item.workout_title || item.workoutTitle || 'Workout',
      date: item.date,
      totalVolume: Number(item.total_volume ?? item.totalVolume ?? 0),
      muscle_sets: item.muscle_sets || {},
      exercises: (item.exercises || []).map((e: any) => ({
        exerciseId: e.exercise_id || e.exerciseId,
        exerciseName: e.exercise_name || e.exerciseName,
        muscleGroup: e.muscle_group || e.muscleGroup,
        primaryMuscles: e.primary_muscles || e.primaryMuscles || [],
        secondaryMuscles: e.secondary_muscles || e.secondaryMuscles || [],
        bestEpley1RM: Number(e.best_epley_1rm ?? e.bestEpley1RM ?? 0),
        totalVolume: Number(e.total_volume ?? e.totalVolume ?? 0),
        sets: (e.sets || []).map((s: any) => ({
          set_number: s.set_number ?? s.setNumber ?? 1,
          weight: Number(s.weight ?? 0),
          reps: Number(s.reps ?? 0),
          rpe: s.rpe ? Number(s.rpe) : 0,
          is_warmup: Boolean(s.is_warmup),
          calculated_1rm: s.calculated_1rm ? Number(s.calculated_1rm) : undefined,
        })),
      })),
    }));
  }

  async getRecentSessions(days = 4): Promise<{
    session_id: string;
    date: string;
    days_ago: number;
    workout_title: string;
    muscle_sets: Record<string, number>;
  }[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/workout-sets/recent-sessions?days=${days}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) return [];
    return await res.json();
  }

  async getPersonalRecords(): Promise<{
    exercise_id: number;
    exercise_key: string;
    exercise_name: string;
    primary_muscle: string;
    best_1rm?: number;
    best_1rm_weight_kg?: number;
    best_1rm_reps?: number;
    best_1rm_date?: string;
    best_weight_kg?: number;
    best_weight_reps?: number;
    best_weight_date?: string;
    best_volume_kg?: number;
    updated_at: string;
  }[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/workout-sets/personal-records`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) return [];
    return await res.json();
  }

  async getWorkoutNotes(fromDate?: string, toDate?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const headers = await this.getHeaders();

    const res = await fetch(`${this.baseUrl}/workout-notes${qs}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) return [];
    return await res.json();
  }

  async createWorkoutNote(data: { logged_date: string; note: string }): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/workout-notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || 'Failed to save workout note');
    }
    return await res.json();
  }

  // ---------------------------------------------------------------------------
  // Steps (/api/steps)
  // ---------------------------------------------------------------------------

  async getSteps(fromDate?: string, toDate?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const headers = await this.getHeaders();

    const res = await fetch(`${this.baseUrl}/steps${qs}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) return [];
    return await res.json();
  }

  async logSteps(data: { date: string; steps: number; calories_burned?: number }): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/steps`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || 'Failed to log steps');
    }
    return await res.json();
  }
}

export const ApiClient = new ApiClientService();
export const apiClient = ApiClient;

