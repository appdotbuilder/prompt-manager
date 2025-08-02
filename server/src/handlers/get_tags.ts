
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type Tag } from '../schema';

export const getTags = async (): Promise<Tag[]> => {
  try {
    const results = await db.select()
      .from(tagsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    throw error;
  }
};
