import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthUser } from '../types/User';
import { supabase } from './SupabaseRepo';

interface RegisteredAccount {
  id: string;
  email: string;
  password: string;
  username: string;
  created_at: string;
}

interface AuthStoreState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  registeredUsers: Record<string, RegisteredAccount>;

  signIn: (email: string, pass: string) => Promise<boolean>;
  signUp: (email: string, pass: string, username: string) => Promise<boolean>;
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
};

function withTimeout<T>(promise: Promise<T>, timeoutMs = 3000): Promise<T> {
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
        set({ user: customUser || DEFAULT_DEMO_USER, error: null, loading: false });
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
            3000
          );

          if (err) {
            // Real error returned by Supabase (e.g. invalid password or unconfirmed email)
            set({ error: err.message, loading: false });
            return false;
          }

          if (data?.user) {
            const authUser: AuthUser = {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              username: data.user.user_metadata?.username || cleanEmail.split('@')[0] || 'Athlete',
              created_at: data.user.created_at,
            };
            set({ user: authUser, loading: false, error: null });
            return true;
          }
        } catch (err: any) {
          supabaseFailed = true;
          console.warn('Supabase auth network request failed:', err.message);
        }

        // 2. If Supabase is offline / project paused:
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
          set({ user: authUser, loading: false, error: null });
          return true;
        }

        // If not in local demo accounts and Supabase is unreachable:
        if (supabaseFailed) {
          set({
            error:
              'Cannot reach Supabase (project is paused on free tier). Please unpause at supabase.com/dashboard, or use "Instant Access (Demo Mode)" below.',
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

        // 1. Try Supabase signUp
        try {
          const { data, error: err } = await withTimeout(
            supabase.auth.signUp({
              email: cleanEmail,
              password: cleanPass,
              options: { data: { username: cleanUsername } },
            }),
            3000
          );

          if (err) {
            set({ error: err.message, loading: false });
            return false;
          }

          if (data?.user) {
            // Check if confirmation email is required by Supabase
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
            set({ user: authUser, loading: false, error: null });
            return true;
          }
        } catch (err: any) {
          console.warn('Supabase sign-up failed or offline:', err.message);
          set({
            error:
              'Cannot reach Supabase (project is paused on free tier). Please unpause at supabase.com/dashboard, or use "Instant Access (Demo Mode)" below.',
            loading: false,
          });
          return false;
        }

        set({ error: 'Sign up failed.', loading: false });
        return false;
      },

      signOut: async () => {
        set({ user: null, error: null, loading: false });
        try {
          await withTimeout(supabase.auth.signOut(), 1000);
        } catch {
          // ignore background timeout
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
