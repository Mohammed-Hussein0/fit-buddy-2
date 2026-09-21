export interface ExerciseSet {
  id: string;
  reps: string;
  weight: string;
  rpe: number; // 0 = unrated, 1-10
}

export interface WorkoutExercise {
  id: string;
  name: string; // matches ExerciseId
  muscleGroup: string;
  imageUrl: string;
  sets: ExerciseSet[];
}

export interface Workout {
  id: string;
  title: string;
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  note: string;
  programId: string;
}

export interface Program {
  id: string;
  title: string;
  image: string;
}
