export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export interface UserProfile {
  height: string;        // cm
  currentWeight: string; // kg
  goalWeight: string;    // kg
  nutrition: string;     // kcal
  stepGoal: string;      // daily steps
  age: string;           // years
  gender: Gender;
  avatarUrl?: string;    // profile picture (URL or base64 data)
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  created_at: string;
  avatarUrl?: string;
}
