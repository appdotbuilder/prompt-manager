
import { db } from '../db';
import { promptsTable, promptTagsTable, tagsTable } from '../db/schema';
import { type CreatePromptInput, type PromptWithTags } from '../schema';
import { eq } from 'drizzle-orm';

export const createPrompt = async (input: CreatePromptInput): Promise<PromptWithTags> => {
  try {
    // Insert prompt record
    const result = await db.insert(promptsTable)
      .values({
        title: input.title,
        content: input.content,
        type: input.type,
        is_template: input.is_template,
        template_variables: input.template_variables
      })
      .returning()
      .execute();

    const prompt = result[0];

    // Handle tag associations if provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      // Insert prompt-tag relationships
      const promptTagValues = input.tag_ids.map(tag_id => ({
        prompt_id: prompt.id,
        tag_id: tag_id
      }));

      await db.insert(promptTagsTable)
        .values(promptTagValues)
        .execute();
    }

    // Fetch associated tags
    const tagsResult = input.tag_ids && input.tag_ids.length > 0
      ? await db.select({
          id: tagsTable.id,
          name: tagsTable.name,
          color: tagsTable.color,
          created_at: tagsTable.created_at
        })
        .from(tagsTable)
        .innerJoin(promptTagsTable, eq(tagsTable.id, promptTagsTable.tag_id))
        .where(eq(promptTagsTable.prompt_id, prompt.id))
        .execute()
      : [];

    return {
      ...prompt,
      tags: tagsResult
    };
  } catch (error) {
    console.error('Prompt creation failed:', error);
    throw error;
  }
};
