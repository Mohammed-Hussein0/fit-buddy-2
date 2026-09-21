import { ExerciseId } from './Exercise';
import { TargetMuscleId, MuscleGroupId } from './Muscles';

export interface SessionSet {
  reps: number;
  weight: number; // kg
  rpe: number;
}

export interface SessionExercise {
  exerciseId: ExerciseId;
  exerciseName: string;
  muscleGroup?: MuscleGroupId | string;
  primaryMuscles?: TargetMuscleId[];
  secondaryMuscles?: TargetMuscleId[];
  bestEpley1RM: number;
  totalVolume: number; // sum(weight * reps)
  sets: SessionSet[];
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutTitle: string;
  date: string; // ISO date string
  exercises: SessionExercise[];
  totalVolume: number;
}
