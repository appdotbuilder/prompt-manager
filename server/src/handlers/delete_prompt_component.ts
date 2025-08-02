
import { db } from '../db';
import { promptComponentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePromptComponent = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the prompt component by ID
    const result = await db.delete(promptComponentsTable)
      .where(eq(promptComponentsTable.id, id))
      .returning()
      .execute();

    // Return success status based on whether a record was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Prompt component deletion failed:', error);
    throw error;
  }
};
