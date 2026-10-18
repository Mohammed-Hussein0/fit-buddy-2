export type Gender = 'male' | 'female' | 'Male' | 'Female' | 'Other' | 'Prefer not to say';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  id?: string;
  username?: string;
  birthDate?: string;     // YYYY-MM-DD
  experienceLevel?: ExperienceLevel;
  height: string;         // cm
  currentWeight: string;  // kg
  goalWeight: string;     // kg
  nutrition: string;      // kcal
  stepGoal: string;       // daily steps
  age: string;            // years
  gender: Gender;
  avatarUrl?: string;     // profile picture (URL or base64 data)
  bmi?: number;
  bmr?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  created_at: string;
  avatarUrl?: string;
  experienceLevel?: ExperienceLevel;
  birthDate?: string;
}
