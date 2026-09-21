import { supabase } from '../repositories/SupabaseRepo';
import { BodyMeasurement } from '../types/Measurement';
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
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    return `http://${host}:8000/api`;
  }
  return 'http://localhost:8000/api';
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
   * Send physique photos to backend Claude 3.5 Sonnet analysis endpoint.
   */
  async analyzePhysique(frontFile: File | Blob, backFile: File | Blob): Promise<string> {
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
      const errorText = await res.text().catch(() => res.statusText);
      throw new Error(`Analysis failed (${res.status}): ${errorText}`);
    }

    return await res.text();
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

