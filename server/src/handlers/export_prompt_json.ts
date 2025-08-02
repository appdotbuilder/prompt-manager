
import { db } from '../db';
import { promptsTable, promptTagsTable, tagsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const exportPromptJson = async (id: number): Promise<{ prompt_data: Record<string, any> }> => {
  try {
    // Get the prompt with its tags
    const promptResults = await db.select({
      prompt: promptsTable,
      tag: tagsTable
    })
      .from(promptsTable)
      .leftJoin(promptTagsTable, eq(promptsTable.id, promptTagsTable.prompt_id))
      .leftJoin(tagsTable, eq(promptTagsTable.tag_id, tagsTable.id))
      .where(eq(promptsTable.id, id))
      .execute();

    if (promptResults.length === 0) {
      throw new Error(`Prompt with id ${id} not found`);
    }

    // Extract prompt data and collect unique tags
    const promptData = promptResults[0].prompt;
    const tagsMap = new Map();
    
    promptResults.forEach(result => {
      if (result.tag) {
        tagsMap.set(result.tag.id, result.tag);
      }
    });

    const tags = Array.from(tagsMap.values());

    return {
      prompt_data: {
        id: promptData.id,
        title: promptData.title,
        content: promptData.content,
        type: promptData.type,
        is_template: promptData.is_template,
        template_variables: promptData.template_variables,
        created_at: promptData.created_at.toISOString(),
        updated_at: promptData.updated_at.toISOString(),
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          created_at: tag.created_at.toISOString()
        }))
      }
    };
  } catch (error) {
    console.error('Export prompt JSON failed:', error);
    throw error;
  }
};
