import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../models/types/User';
import { defaultProfile, fetchRemoteProfile, saveRemoteProfile } from '../models/repositories/SupabaseRepo';
import { useAuthStore } from '../models/repositories/AuthStore';

const LOCAL_STORAGE_KEY = 'fitbuddy-profile-data';

export function useProfileController(userId?: string) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultProfile;
  });
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<keyof UserProfile | null>(null);
  const [tempValue, setTempValue] = useState('');

  // Fetch from Supabase if logged in
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchRemoteProfile(userId)
      .then((remote) => {
        if (remote) {
          setProfile(remote);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remote));
          if (remote.avatarUrl) {
            useAuthStore.getState().updateAvatar(remote.avatarUrl);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const openEditModal = useCallback((field: keyof UserProfile) => {
    setEditingField(field);
    setTempValue(profile[field] || '');
  }, [profile]);

  const closeEditModal = useCallback(() => {
    setEditingField(null);
    setTempValue('');
  }, []);

  const saveEdit = useCallback(async (field: keyof UserProfile, value: string) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    closeEditModal();

    if (userId) {
      void saveRemoteProfile(userId, updated);
    }
  }, [profile, userId, closeEditModal]);

  const updateAvatar = useCallback(async (avatarUrl: string) => {
    const updated = { ...profile, avatarUrl };
    setProfile(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    useAuthStore.getState().updateAvatar(avatarUrl);

    if (userId) {
      void saveRemoteProfile(userId, updated);
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
