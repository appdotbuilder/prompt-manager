
import { db } from '../db';
import { promptComponentsTable } from '../db/schema';
import { type CreatePromptComponentInput, type PromptComponent } from '../schema';

export const createPromptComponent = async (input: CreatePromptComponentInput): Promise<PromptComponent> => {
  try {
    // Insert prompt component record
    const result = await db.insert(promptComponentsTable)
      .values({
        name: input.name,
        content: input.content,
        category: input.category,
        type: input.type
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Prompt component creation failed:', error);
    throw error;
  }
};
