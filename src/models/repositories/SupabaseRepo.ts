import { createClient, Session, User } from '@supabase/supabase-js';
import { UserProfile } from '../types/User';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qijerfynrurfquhpehno.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_pJKMBcVjQKAB8yNq5QYStA_UruCBOYG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const defaultProfile: UserProfile = {
  height: '175',
  currentWeight: '78.5',
  goalWeight: '75',
  nutrition: '2400',
  stepGoal: '8000',
  age: '25',
  gender: 'Male',
  avatarUrl: '',
};

export async function fetchRemoteProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('height, current_weight, goal_weight, nutrition_goal, step_goal, age, gender, avatar_url')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      height: data.height?.toString() || defaultProfile.height,
      currentWeight: data.current_weight?.toString() || defaultProfile.currentWeight,
      goalWeight: data.goal_weight?.toString() || defaultProfile.goalWeight,
      nutrition: data.nutrition_goal?.toString() || defaultProfile.nutrition,
      stepGoal: data.step_goal?.toString() || defaultProfile.stepGoal,
      age: data.age?.toString() || defaultProfile.age,
      gender: data.gender || defaultProfile.gender,
      avatarUrl: data.avatar_url || '',
    };
  } catch {
    return null;
  }
}

export async function saveRemoteProfile(userId: string, profile: UserProfile): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      height: parseFloat(profile.height),
      current_weight: parseFloat(profile.currentWeight),
      goal_weight: parseFloat(profile.goalWeight),
      nutrition_goal: parseFloat(profile.nutrition),
      step_goal: parseFloat(profile.stepGoal),
      age: parseInt(profile.age, 10),
      gender: profile.gender,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}
