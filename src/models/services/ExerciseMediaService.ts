import { EXERCISE_MEDIA_MAP, ExerciseMediaItem } from '../types/ExerciseMediaData';
import { normalizeExerciseKey } from '../types/Exercise';

export class ExerciseMediaService {
  /**
   * Retrieves full media item (HD images, step-by-step instructions, equipment)
   * from Free-Exercise-DB for a given exercise key or name.
   */
  public static getMedia(exerciseKeyOrName: string): ExerciseMediaItem | null {
    if (!exerciseKeyOrName) return null;

    // 1. Direct canonical lookup
    if (EXERCISE_MEDIA_MAP[exerciseKeyOrName]) {
      return EXERCISE_MEDIA_MAP[exerciseKeyOrName];
    }

    // 2. Normalized key lookup
    const canonicalKey = normalizeExerciseKey(exerciseKeyOrName);
    if (EXERCISE_MEDIA_MAP[canonicalKey]) {
      return EXERCISE_MEDIA_MAP[canonicalKey];
    }

    // 3. Fallback fuzzy search by name in values
    const clean = exerciseKeyOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const item of Object.values(EXERCISE_MEDIA_MAP)) {
      const itemClean = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (itemClean.includes(clean) || clean.includes(itemClean)) {
        return item;
      }
    }

    return null;
  }

  /**
   * Gets HD image frames (e.g. [0.jpg (setup), 1.jpg (peak contraction)])
   */
  public static getImages(exerciseKeyOrName: string): string[] {
    const media = this.getMedia(exerciseKeyOrName);
    return media?.images && media.images.length > 0 ? media.images : [];
  }

  /**
   * Gets primary thumbnail image
   */
  public static getThumbnail(exerciseKeyOrName: string, fallbackUrl?: string): string {
    const images = this.getImages(exerciseKeyOrName);
    if (images.length > 0) {
      return images[0];
    }
    return fallbackUrl || 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80';
  }

  /**
   * Gets step-by-step form execution instructions
   */
  public static getInstructions(exerciseKeyOrName: string): string[] {
    const media = this.getMedia(exerciseKeyOrName);
    return media?.instructions || [];
  }

  /**
   * Generates a curated high-relevance YouTube search URL for proper form tutorial
   */
  public static getVideoTutorialUrl(exerciseName: string): string {
    const query = `${exerciseName} proper form tutorial`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }
}
