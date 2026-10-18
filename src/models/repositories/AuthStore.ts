import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthUser, ExperienceLevel } from '../types/User';
import { supabase } from './SupabaseRepo';
import { apiClient } from '../services/ApiClient';
import { useMeasurementStore } from './MeasurementStore';
import { useWorkoutStore } from './WorkoutStore';
import { usePRStore } from './PRStore';

interface RegisteredAccount {
  id: string;
  email: string;
  password: string;
  username: string;
  created_at: string;
}

export interface OnboardingPayload {
  username?: string;
  birth_date: string;
  gender: 'male' | 'female';
  height: number;
  current_weight: number;
  goal_weight: number;
  experience_level: ExperienceLevel;
}

interface AuthStoreState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  needsOnboarding: boolean;
  onboardingLoading: boolean;
  onboardingError: string | null;
  registeredUsers: Record<string, RegisteredAccount>;

  signIn: (email: string, pass: string) => Promise<boolean>;
  signUp: (email: string, pass: string, username: string) => Promise<boolean>;
  completeOnboarding: (data: OnboardingPayload) => Promise<boolean>;
  checkBackendProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  setDemoUser: (customUser?: AuthUser) => void;
  updateAvatar: (avatarUrl: string) => void;
  setError: (err: string | null) => void;
}

const DEFAULT_DEMO_USER: AuthUser = {
  id: 'demo-athlete-1',
  email: 'athlete@fitbuddy.app',
  username: 'Mohammed',
  created_at: new Date('2026-01-01').toISOString(),
  experienceLevel: 'intermediate',
  birthDate: '1998-05-15',
};

function withTimeout<T>(promise: Promise<T>, timeoutMs = 4000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout: Supabase server unreachable')), timeoutMs)
    ),
  ]);
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      user: DEFAULT_DEMO_USER,
      loading: false,
      error: null,
      needsOnboarding: false,
      onboardingLoading: false,
      onboardingError: null,
      registeredUsers: {
        'athlete@fitbuddy.app': {
          id: 'demo-athlete-1',
          email: 'athlete@fitbuddy.app',
          password: 'password123',
          username: 'Mohammed',
          created_at: new Date('2026-01-01').toISOString(),
        },
      },

      setError: (err: string | null) => set({ error: err }),

      updateAvatar: (avatarUrl: string) => {
        set((state) => ({
          user: state.user ? { ...state.user, avatarUrl } : null,
        }));
      },

      setDemoUser: (customUser?: AuthUser) => {
        set({
          user: customUser || DEFAULT_DEMO_USER,
          needsOnboarding: false,
          error: null,
          loading: false,
        });
      },

      checkBackendProfile: async () => {
        const state = get();
        if (!state.user || state.user.id === 'demo-athlete-1') return;

        try {
          const profile = await apiClient.getProfile();
          if (profile) {
            const mappedProfile = {
              id: profile.id,
              username: profile.username,
              height: profile.height?.toString() || '175',
              currentWeight: profile.current_weight?.toString() || '78',
              goalWeight: profile.goal_weight?.toString() || '75',
              nutrition: '2400',
              stepGoal: '8000',
              age: profile.age?.toString() || '',
              gender: profile.gender === 'male' ? 'Male' : 'Female',
              avatarUrl: profile.avatar_url || '',
              birthDate: profile.birth_date,
              experienceLevel: profile.experience_level,
              bmi: profile.bmi,
              bmr: profile.bmr,
            };
            localStorage.setItem('fitbuddy-profile-data', JSON.stringify(mappedProfile));
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('fitbuddy-profile-updated', { detail: mappedProfile }));
            }

            set((prev) => ({
              user: prev.user
                ? {
                    ...prev.user,
                    id: profile.id,
                    username: profile.username || prev.user.username,
                    avatarUrl: profile.avatar_url || prev.user.avatarUrl,
                    experienceLevel: profile.experience_level,
                    birthDate: profile.birth_date,
                  }
                : null,
              needsOnboarding: false,
            }));
          } else if (profile === null) {
            // Specifically 404: user is in Auth but not in public.users
            set({ needsOnboarding: true });
          }
        } catch (err) {
          console.warn('Profile check failed (backend unreachable):', err);
        }
      },

      signIn: async (email: string, pass: string) => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanPass = pass.trim();

        if (!cleanEmail) {
          set({ error: 'Please enter your email address.' });
          return false;
        }
        if (!cleanPass) {
          set({ error: 'Please enter your password.' });
          return false;
        }

        set({ loading: true, error: null });

        // 1. Try Supabase Auth
        let supabaseFailed = false;
        try {
          const { data, error: err } = await withTimeout(
            supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPass,
            }),
            5000
          );

          if (err) {
            set({ error: err.message, loading: false });
            return false;
          }

          if (data?.user) {
            // Check backend profile
            let backendProfile = null;
            let backendError: any = null;
            try {
              backendProfile = await apiClient.getProfile();
            } catch (err: any) {
              backendError = err;
            }

            if (backendProfile) {
              const mappedProfile = {
                id: backendProfile.id,
                username: backendProfile.username,
                height: backendProfile.height?.toString() || '175',
                currentWeight: backendProfile.current_weight?.toString() || '78',
                goalWeight: backendProfile.goal_weight?.toString() || '75',
                nutrition: '2400',
                stepGoal: '8000',
                age: backendProfile.age?.toString() || '',
                gender: backendProfile.gender === 'male' ? 'Male' : 'Female',
                avatarUrl: backendProfile.avatar_url || '',
                birthDate: backendProfile.birth_date,
                experienceLevel: backendProfile.experience_level,
                bmi: backendProfile.bmi,
                bmr: backendProfile.bmr,
              };
              localStorage.setItem('fitbuddy-profile-data', JSON.stringify(mappedProfile));
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('fitbuddy-profile-updated', { detail: mappedProfile }));
              }

              const authUser: AuthUser = {
                id: backendProfile.id,
                email: data.user.email || cleanEmail,
                username: backendProfile.username || data.user.user_metadata?.username || cleanEmail.split('@')[0],
                created_at: backendProfile.created_at || data.user.created_at,
                avatarUrl: backendProfile.avatar_url,
                experienceLevel: backendProfile.experience_level,
                birthDate: backendProfile.birth_date,
              };
              set({ user: authUser, needsOnboarding: false, loading: false, error: null });
              useMeasurementStore.getState().fetchMeasurements().catch(() => {});
              useWorkoutStore.getState().syncFromBackend().catch(() => {});
              usePRStore.getState().syncFromBackend().catch(() => {});
              return true;
            } else if (backendError) {
              // Server unreachable or connection error — do NOT force onboarding!
              const cachedStr = localStorage.getItem('fitbuddy-profile-data');
              let cachedProfile = null;
              if (cachedStr) {
                try {
                  cachedProfile = JSON.parse(cachedStr);
                } catch {}
              }

              if (cachedProfile) {
                const authUser: AuthUser = {
                  id: data.user.id,
                  email: data.user.email || cleanEmail,
                  username: cachedProfile.username || data.user.user_metadata?.username || cleanEmail.split('@')[0],
                  created_at: data.user.created_at,
                  avatarUrl: cachedProfile.avatarUrl,
                  experienceLevel: cachedProfile.experienceLevel,
                  birthDate: cachedProfile.birthDate,
                };
                set({ user: authUser, needsOnboarding: false, loading: false, error: null });
                return true;
              }

              set({
                error: `Backend server unreachable: ${backendError.message || 'connection failed'}. Please ensure the server is running on http://localhost:8000.`,
                loading: false,
              });
              return false;
            } else {
              // User exists in Supabase Auth, but backend returned 404 (needs first-time onboarding)
              const authUser: AuthUser = {
                id: data.user.id,
                email: data.user.email || cleanEmail,
                username: data.user.user_metadata?.username || cleanEmail.split('@')[0] || 'Athlete',
                created_at: data.user.created_at,
              };
              set({ user: authUser, needsOnboarding: true, loading: false, error: null });
              return true;
            }
          }
        } catch (err: any) {
          supabaseFailed = true;
          console.warn('Supabase auth network request failed:', err.message);
        }

        // 2. If Supabase is offline / fallback:
        const state = get();
        const existing = state.registeredUsers[cleanEmail];

        if (existing) {
          if (existing.password !== cleanPass) {
            set({ error: 'Invalid password. Please try again.', loading: false });
            return false;
          }

          const authUser: AuthUser = {
            id: existing.id,
            email: cleanEmail,
            username: existing.username,
            created_at: existing.created_at,
          };
          set({ user: authUser, needsOnboarding: false, loading: false, error: null });
          return true;
        }

        if (supabaseFailed) {
          set({
            error: 'Cannot reach Supabase servers. Check your connection or use "Instant Access (Demo Mode)".',
            loading: false,
          });
          return false;
        }

        set({ error: 'No account found with this email. Please sign up first.', loading: false });
        return false;
      },

      signUp: async (email: string, pass: string, username: string) => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanPass = pass.trim();
        const cleanUsername = username.trim() || cleanEmail.split('@')[0] || 'Athlete';

        if (!cleanEmail) {
          set({ error: 'Please enter an email address.' });
          return false;
        }
        if (cleanPass.length < 6) {
          set({ error: 'Password must be at least 6 characters long.' });
          return false;
        }

        set({ loading: true, error: null });

        try {
          const { data, error: err } = await withTimeout(
            supabase.auth.signUp({
              email: cleanEmail,
              password: cleanPass,
              options: { data: { username: cleanUsername } },
            }),
            5000
          );

          if (err) {
            set({ error: err.message, loading: false });
            return false;
          }

          if (data?.user) {
            if (data.user.identities && data.user.identities.length === 0) {
              set({ error: 'An account with this email already exists.', loading: false });
              return false;
            }

            if (!data.session) {
              set({
                error: 'Verification email sent! Please check your inbox to confirm your account before signing in.',
                loading: false,
              });
              return true;
            }

            const authUser: AuthUser = {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              username: cleanUsername,
              created_at: data.user.created_at,
            };

            // Needs onboarding profile setup
            set({ user: authUser, needsOnboarding: true, loading: false, error: null });
            return true;
          }
        } catch (err: any) {
          console.warn('Supabase sign-up failed or offline:', err.message);
          set({
            error: 'Cannot reach Supabase servers. Check your connection or use "Instant Access (Demo Mode)".',
            loading: false,
          });
          return false;
        }

        set({ error: 'Sign up failed.', loading: false });
        return false;
      },

      completeOnboarding: async (payload: OnboardingPayload) => {
        const state = get();
        if (!state.user) return false;

        set({ onboardingLoading: true, onboardingError: null });
        try {
          const profile = await apiClient.createProfile({
            username: payload.username?.trim() || state.user.username || 'Athlete',
            birth_date: payload.birth_date,
            gender: payload.gender,
            height: payload.height,
            current_weight: payload.current_weight,
            goal_weight: payload.goal_weight,
            experience_level: payload.experience_level,
          });

          const mappedProfile = {
            id: profile.id,
            username: profile.username,
            height: profile.height?.toString() || payload.height.toString(),
            currentWeight: profile.current_weight?.toString() || payload.current_weight.toString(),
            goalWeight: profile.goal_weight?.toString() || payload.goal_weight.toString(),
            nutrition: '2400',
            stepGoal: '8000',
            age: profile.age?.toString() || '',
            gender: profile.gender === 'male' ? 'Male' : 'Female',
            avatarUrl: profile.avatar_url || '',
            birthDate: profile.birth_date,
            experienceLevel: profile.experience_level,
            bmi: profile.bmi,
            bmr: profile.bmr,
          };
          localStorage.setItem('fitbuddy-profile-data', JSON.stringify(mappedProfile));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('fitbuddy-profile-updated', { detail: mappedProfile }));
          }

          const updatedUser: AuthUser = {
            ...state.user,
            id: profile.id,
            username: profile.username,
            avatarUrl: profile.avatar_url,
            experienceLevel: profile.experience_level,
            birthDate: profile.birth_date,
          };

          set({
            user: updatedUser,
            needsOnboarding: false,
            onboardingLoading: false,
            onboardingError: null,
          });
          return true;
        } catch (err: any) {
          console.error('Failed to complete onboarding:', err);
          if (err?.message && err.message.toLowerCase().includes('already exists')) {
            try {
              const existing = await apiClient.getProfile();
              if (existing) {
                const mappedProfile = {
                  id: existing.id,
                  username: existing.username,
                  height: existing.height?.toString() || payload.height.toString(),
                  currentWeight: existing.current_weight?.toString() || payload.current_weight.toString(),
                  goalWeight: existing.goal_weight?.toString() || payload.goal_weight.toString(),
                  nutrition: '2400',
                  stepGoal: '8000',
                  age: existing.age?.toString() || '',
                  gender: existing.gender === 'male' ? 'Male' : 'Female',
                  avatarUrl: existing.avatar_url || '',
                  birthDate: existing.birth_date,
                  experienceLevel: existing.experience_level,
                  bmi: existing.bmi,
                  bmr: existing.bmr,
                };
                localStorage.setItem('fitbuddy-profile-data', JSON.stringify(mappedProfile));
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('fitbuddy-profile-updated', { detail: mappedProfile }));
                }

                set({
                  user: {
                    ...state.user,
                    id: existing.id,
                    username: existing.username,
                    avatarUrl: existing.avatar_url,
                    experienceLevel: existing.experience_level,
                    birthDate: existing.birth_date,
                  },
                  needsOnboarding: false,
                  onboardingLoading: false,
                  onboardingError: null,
                });
                return true;
              }
            } catch {}
          }

          set({
            onboardingError: err?.message || 'Failed to complete profile creation. Please try again.',
            onboardingLoading: false,
          });
          return false;
        }
      },

      signOut: async () => {
        localStorage.removeItem('fitbuddy-profile-data');
        localStorage.removeItem('fitbuddy_measurements_cache');
        localStorage.removeItem('fitbuddy-workout-data-v2');
        localStorage.removeItem('fitbuddy-pr-cache');
        useMeasurementStore.getState().resetMeasurements();
        useWorkoutStore.getState().clearAll();
        usePRStore.getState().clearAllPRs();
        set({ user: null, needsOnboarding: false, error: null, loading: false });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fitbuddy-profile-updated', { detail: null }));
        }
        try {
          await withTimeout(supabase.auth.signOut(), 1500);
        } catch {
          // ignore
        }
      },
    }),
    {
      name: 'fit-buddy-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        registeredUsers: state.registeredUsers,
      }),
    }
  )
);
