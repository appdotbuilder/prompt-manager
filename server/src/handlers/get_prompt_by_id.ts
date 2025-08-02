
import { db } from '../db';
import { promptsTable, tagsTable, promptTagsTable } from '../db/schema';
import { type PromptWithTags } from '../schema';
import { eq } from 'drizzle-orm';

export const getPromptById = async (id: number): Promise<PromptWithTags | null> => {
  try {
    // First get the prompt
    const promptResults = await db.select()
      .from(promptsTable)
      .where(eq(promptsTable.id, id))
      .execute();

    if (promptResults.length === 0) {
      return null;
    }

    const prompt = promptResults[0];

    // Get associated tags through the junction table
    const tagResults = await db.select({
      id: tagsTable.id,
      name: tagsTable.name,
      color: tagsTable.color,
      created_at: tagsTable.created_at
    })
    .from(promptTagsTable)
    .innerJoin(tagsTable, eq(promptTagsTable.tag_id, tagsTable.id))
    .where(eq(promptTagsTable.prompt_id, id))
    .execute();

    // Return prompt with tags
    return {
      id: prompt.id,
      title: prompt.title,
      content: prompt.content,
      type: prompt.type,
      is_template: prompt.is_template,
      template_variables: prompt.template_variables,
      created_at: prompt.created_at,
      updated_at: prompt.updated_at,
      tags: tagResults
    };
  } catch (error) {
    console.error('Failed to get prompt by ID:', error);
    throw error;
  }
};
