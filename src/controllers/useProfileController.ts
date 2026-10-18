import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../models/types/User';
import { defaultProfile } from '../models/repositories/SupabaseRepo';
import { useAuthStore } from '../models/repositories/AuthStore';
import { apiClient } from '../models/services/ApiClient';
import { sanitizePositiveNumber } from '../utils/numberInputUtils';

const LOCAL_STORAGE_KEY = 'fitbuddy-profile-data';

export function useProfileController(userId?: string) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultProfile;
  });
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<keyof UserProfile | null>(null);
  const [tempValue, setTempValue] = useState('');

  const needsOnboarding = useAuthStore((s) => s.needsOnboarding);

  // Listen for immediate profile updates from onboarding/auth
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e?.detail) {
        setProfile(e.detail);
      } else {
        setProfile(defaultProfile);
      }
    };
    window.addEventListener('fitbuddy-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('fitbuddy-profile-updated', handleProfileUpdate);
    };
  }, []);

  // Fetch from Backend API if logged in or once onboarding completes
  useEffect(() => {
    if (!userId || userId === 'demo-athlete-1' || needsOnboarding) return;
    setLoading(true);

    apiClient
      .getProfile()
      .then((backend) => {
        if (backend) {
          const mapped: UserProfile = {
            id: backend.id,
            username: backend.username,
            height: backend.height?.toString() || defaultProfile.height,
            currentWeight: backend.current_weight?.toString() || defaultProfile.currentWeight,
            goalWeight: backend.goal_weight?.toString() || defaultProfile.goalWeight,
            nutrition: defaultProfile.nutrition,
            stepGoal: defaultProfile.stepGoal,
            age: backend.age?.toString() || defaultProfile.age,
            gender: backend.gender === 'male' ? 'Male' : 'Female',
            avatarUrl: backend.avatar_url || '',
            birthDate: backend.birth_date,
            experienceLevel: backend.experience_level,
            bmi: backend.bmi,
            bmr: backend.bmr,
          };
          setProfile(mapped);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          if (backend.avatar_url) {
            useAuthStore.getState().updateAvatar(backend.avatar_url);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch backend profile:', err);
      })
      .finally(() => setLoading(false));
  }, [userId, needsOnboarding]);

  const openEditModal = useCallback((field: keyof UserProfile) => {
    setEditingField(field);
    setTempValue(profile[field]?.toString() || '');
  }, [profile]);

  const closeEditModal = useCallback(() => {
    setEditingField(null);
    setTempValue('');
  }, []);

  const saveEdit = useCallback(async (field: keyof UserProfile, value: string) => {
    const numericFields = ['height', 'currentWeight', 'goalWeight', 'age', 'nutrition', 'stepGoal'];
    const sanitizedVal = numericFields.includes(field)
      ? sanitizePositiveNumber(value, field !== 'age' && field !== 'stepGoal')
      : value;

    const updated = { ...profile, [field]: sanitizedVal };
    setProfile(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('fitbuddy-profile-updated', { detail: updated }));
    closeEditModal();

    if (userId && userId !== 'demo-athlete-1') {
      const payload: Record<string, any> = {};
      if (field === 'height') payload.height = Math.max(0, parseFloat(sanitizedVal) || 0);
      else if (field === 'currentWeight') {
        const w = Math.max(0, parseFloat(sanitizedVal) || 0);
        payload.current_weight = w;
        apiClient.logWeight(w).catch(() => {});
      }
      else if (field === 'goalWeight') payload.goal_weight = Math.max(0, parseFloat(sanitizedVal) || 0);
      else if (field === 'age') payload.age = Math.max(0, parseInt(sanitizedVal, 10) || 0);
      else if (field === 'experienceLevel') {
        const valLower = value.toLowerCase();
        payload.experience_level = valLower === 'novice' ? 'beginner' : valLower === 'elite' ? 'advanced' : valLower;
      }
      else if (field === 'gender') payload.gender = value.toLowerCase();

      if (Object.keys(payload).length > 0) {
        apiClient.updateProfile(payload).catch((err) => {
          console.warn('Backend profile update failed:', err);
        });
      }
    }
  }, [profile, userId, closeEditModal]);

  const updateAvatar = useCallback(async (avatarUrl: string) => {
    const updated = { ...profile, avatarUrl };
    setProfile(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    useAuthStore.getState().updateAvatar(avatarUrl);

    if (userId && userId !== 'demo-athlete-1') {
      apiClient.updateProfile({ avatar_url: avatarUrl }).catch((err) => {
        console.warn('Avatar backend update failed:', err);
      });
    }
  }, [profile, userId]);

  const getSuggestedRange = useCallback(() => {
    const h = parseFloat(profile.height);
    if (!h || isNaN(h)) return { min: 55, max: 85 };
    const heightM = h / 100;
    const minWeight = Math.round(18.5 * heightM * heightM * 10) / 10;
    const standardMax = 24.9 * heightM * heightM;
    const maxWeight = Math.round((standardMax + 12) * 10) / 10;
    return { min: minWeight, max: maxWeight };
  }, [profile.height]);

  return {
    profile,
    loading,
    editingField,
    tempValue,
    setTempValue,
    openEditModal,
    closeEditModal,
    saveEdit,
    updateAvatar,
    getSuggestedRange,
  };
}
