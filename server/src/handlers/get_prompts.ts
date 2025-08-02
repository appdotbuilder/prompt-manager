
import { db } from '../db';
import { promptsTable, tagsTable, promptTagsTable } from '../db/schema';
import { type PromptWithTags } from '../schema';
import { eq } from 'drizzle-orm';

export const getPrompts = async (): Promise<PromptWithTags[]> => {
  try {
    // Get all prompts with their associated tags through the junction table
    const results = await db.select({
      prompt: promptsTable,
      tag: tagsTable
    })
    .from(promptsTable)
    .leftJoin(promptTagsTable, eq(promptsTable.id, promptTagsTable.prompt_id))
    .leftJoin(tagsTable, eq(promptTagsTable.tag_id, tagsTable.id))
    .execute();

    // Group results by prompt ID to aggregate tags
    const promptsMap = new Map<number, PromptWithTags>();

    for (const result of results) {
      const prompt = result.prompt;
      
      if (!promptsMap.has(prompt.id)) {
        promptsMap.set(prompt.id, {
          ...prompt,
          template_variables: prompt.template_variables as string[] | null,
          tags: []
        });
      }

      // Add tag if it exists (left join might return null tags)
      if (result.tag) {
        promptsMap.get(prompt.id)!.tags.push(result.tag);
      }
    }

    return Array.from(promptsMap.values());
  } catch (error) {
    console.error('Get prompts failed:', error);
    throw error;
  }
};
