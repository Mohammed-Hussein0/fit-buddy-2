import { useAuthStore } from '../models/repositories/AuthStore';

/**
 * Hook providing global authentication state and actions.
 * Connects directly to the persistent Zustand AuthStore.
 */
export function useAuthController() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);
  const setDemoUser = useAuthStore((s) => s.setDemoUser);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const setError = useAuthStore((s) => s.setError);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    setDemoUser,
    updateAvatar,
    setError,
  };
}
