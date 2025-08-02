
import { db } from '../db';
import { promptsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePrompt = async (id: number): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(promptsTable)
      .where(eq(promptsTable.id, id))
      .execute();

    // Check if any rows were affected (deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Prompt deletion failed:', error);
    throw error;
  }
};
