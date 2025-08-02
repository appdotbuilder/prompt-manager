
import { db } from '../db';
import { promptComponentsTable } from '../db/schema';
import { type PromptComponent } from '../schema';

export const getPromptComponents = async (): Promise<PromptComponent[]> => {
  try {
    const results = await db.select()
      .from(promptComponentsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch prompt components:', error);
    throw error;
  }
};
