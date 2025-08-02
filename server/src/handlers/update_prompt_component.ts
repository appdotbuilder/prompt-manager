
import { db } from '../db';
import { promptComponentsTable } from '../db/schema';
import { type UpdatePromptComponentInput, type PromptComponent } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePromptComponent = async (input: UpdatePromptComponentInput): Promise<PromptComponent> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof promptComponentsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    
    if (input.type !== undefined) {
      updateData.type = input.type;
    }

    // Update the prompt component
    const result = await db.update(promptComponentsTable)
      .set(updateData)
      .where(eq(promptComponentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Prompt component with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Prompt component update failed:', error);
    throw error;
  }
};
