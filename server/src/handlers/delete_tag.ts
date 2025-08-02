
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTag = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the tag by ID
    const result = await db.delete(tagsTable)
      .where(eq(tagsTable.id, id))
      .execute();

    // Check if any rows were affected (tag existed and was deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Tag deletion failed:', error);
    throw error;
  }
};
