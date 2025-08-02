
import { db } from '../db';
import { promptComponentsTable } from '../db/schema';
import { type PromptComponent } from '../schema';
import { eq } from 'drizzle-orm';

export const getPromptComponentsByType = async (type: 'chatgpt' | 'midjourney'): Promise<PromptComponent[]> => {
  try {
    const results = await db.select()
      .from(promptComponentsTable)
      .where(eq(promptComponentsTable.type, type))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch prompt components by type:', error);
    throw error;
  }
};
