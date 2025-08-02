
import { db } from '../db';
import { promptsTable, promptTagsTable, tagsTable } from '../db/schema';
import { type UpdatePromptInput, type PromptWithTags } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePrompt = async (input: UpdatePromptInput): Promise<PromptWithTags> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    
    if (input.is_template !== undefined) {
      updateData.is_template = input.is_template;
    }
    
    if (input.template_variables !== undefined) {
      updateData.template_variables = input.template_variables;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update prompt record
    const result = await db.update(promptsTable)
      .set(updateData)
      .where(eq(promptsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Prompt with ID ${input.id} not found`);
    }

    const updatedPrompt = result[0];

    // Handle tag associations if provided
    if (input.tag_ids !== undefined) {
      // Delete existing prompt-tag associations
      await db.delete(promptTagsTable)
        .where(eq(promptTagsTable.prompt_id, input.id))
        .execute();

      // Insert new associations
      if (input.tag_ids.length > 0) {
        const promptTagInserts = input.tag_ids.map(tagId => ({
          prompt_id: input.id,
          tag_id: tagId
        }));

        await db.insert(promptTagsTable)
          .values(promptTagInserts)
          .execute();
      }
    }

    // Fetch the prompt with its tags
    const promptWithTagsResult = await db.select({
      prompt: promptsTable,
      tag: tagsTable
    })
      .from(promptsTable)
      .leftJoin(promptTagsTable, eq(promptsTable.id, promptTagsTable.prompt_id))
      .leftJoin(tagsTable, eq(promptTagsTable.tag_id, tagsTable.id))
      .where(eq(promptsTable.id, input.id))
      .execute();

    // Transform the result to match PromptWithTags schema
    const tags = promptWithTagsResult
      .filter(row => row.tag !== null)
      .map(row => row.tag!);

    return {
      ...promptWithTagsResult[0].prompt,
      tags: tags
    };
  } catch (error) {
    console.error('Prompt update failed:', error);
    throw error;
  }
};
