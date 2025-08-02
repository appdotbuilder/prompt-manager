
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type UpdateTagInput, type Tag } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTag = async (input: UpdateTagInput): Promise<Tag> => {
  try {
    // Build update values object with only provided fields
    const updateValues: { name?: string; color?: string | null } = {};
    
    if (input.name !== undefined) {
      updateValues.name = input.name;
    }
    
    if (input.color !== undefined) {
      updateValues.color = input.color;
    }

    // Update the tag record
    const result = await db.update(tagsTable)
      .set(updateValues)
      .where(eq(tagsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Tag with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Tag update failed:', error);
    throw error;
  }
};
