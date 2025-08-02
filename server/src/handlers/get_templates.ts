
import { db } from '../db';
import { promptsTable, tagsTable, promptTagsTable } from '../db/schema';
import { type PromptWithTags } from '../schema';
import { eq } from 'drizzle-orm';

export const getTemplates = async (): Promise<PromptWithTags[]> => {
  try {
    // Query all prompts that are templates with their associated tags
    const results = await db.select({
      prompt: promptsTable,
      tag: tagsTable
    })
    .from(promptsTable)
    .leftJoin(promptTagsTable, eq(promptsTable.id, promptTagsTable.prompt_id))
    .leftJoin(tagsTable, eq(promptTagsTable.tag_id, tagsTable.id))
    .where(eq(promptsTable.is_template, true))
    .execute();

    // Group results by prompt and collect tags
    const promptMap = new Map<number, PromptWithTags>();

    results.forEach(result => {
      const prompt = result.prompt;
      const tag = result.tag;

      if (!promptMap.has(prompt.id)) {
        promptMap.set(prompt.id, {
          ...prompt,
          template_variables: prompt.template_variables || [],
          tags: []
        });
      }

      // Add tag if it exists (leftJoin can return null)
      if (tag) {
        const existingPrompt = promptMap.get(prompt.id)!;
        existingPrompt.tags.push(tag);
      }
    });

    return Array.from(promptMap.values());
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    throw error;
  }
};
