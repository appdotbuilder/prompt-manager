
import { db } from '../db';
import { promptsTable, promptTagsTable, tagsTable } from '../db/schema';
import { type JsonEditorInput, type PromptWithTags, createPromptInputSchema } from '../schema';
import { eq } from 'drizzle-orm';

export const importJsonPrompt = async (input: JsonEditorInput): Promise<PromptWithTags> => {
  try {
    // Validate that the JSON data contains valid prompt data
    const promptData = createPromptInputSchema.parse(input.prompt_data);

    // Insert the prompt
    const result = await db.insert(promptsTable)
      .values({
        title: promptData.title,
        content: promptData.content,
        type: promptData.type,
        is_template: promptData.is_template,
        template_variables: promptData.template_variables
      })
      .returning()
      .execute();

    const prompt = result[0];

    // Handle tag associations if provided
    let tags: any[] = [];
    if (promptData.tag_ids && promptData.tag_ids.length > 0) {
      // Insert prompt-tag relationships
      const promptTagValues = promptData.tag_ids.map(tagId => ({
        prompt_id: prompt.id,
        tag_id: tagId
      }));

      await db.insert(promptTagsTable)
        .values(promptTagValues)
        .execute();

      // Fetch the associated tags
      tags = await db.select()
        .from(tagsTable)
        .where(eq(tagsTable.id, promptData.tag_ids[0]))
        .execute();

      // If multiple tag_ids, we need to get all of them
      if (promptData.tag_ids.length > 1) {
        const allTags = await db.select()
          .from(tagsTable)
          .execute();
        
        tags = allTags.filter(tag => promptData.tag_ids!.includes(tag.id));
      }
    }

    return {
      ...prompt,
      tags
    };
  } catch (error) {
    console.error('JSON prompt import failed:', error);
    throw error;
  }
};
