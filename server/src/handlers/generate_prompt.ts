
import { db } from '../db';
import { promptsTable, promptComponentsTable } from '../db/schema';
import { type GeneratePromptInput } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const generatePrompt = async (input: GeneratePromptInput): Promise<{ generated_content: string }> => {
  try {
    // Fetch the template prompt
    const templateResults = await db
      .select()
      .from(promptsTable)
      .where(eq(promptsTable.id, input.template_id))
      .execute();

    if (templateResults.length === 0) {
      throw new Error(`Template with id ${input.template_id} not found`);
    }

    const template = templateResults[0];

    if (!template.is_template) {
      throw new Error(`Prompt with id ${input.template_id} is not a template`);
    }

    let generatedContent = template.content;

    // Replace template variables if provided
    if (input.variables && template.template_variables) {
      for (const variable of template.template_variables) {
        const value = input.variables[variable];
        if (value !== undefined) {
          // Replace all occurrences of {{variable}} with the provided value
          const placeholder = `{{${variable}}}`;
          generatedContent = generatedContent.replace(new RegExp(placeholder, 'g'), value);
        }
      }
    }

    // Fetch and append components if provided
    if (input.component_ids && input.component_ids.length > 0) {
      const componentResults = await db
        .select()
        .from(promptComponentsTable)
        .where(inArray(promptComponentsTable.id, input.component_ids))
        .execute();

      // Filter components to match template type
      const matchingComponents = componentResults.filter(
        component => component.type === template.type
      );

      if (matchingComponents.length > 0) {
        const componentContents = matchingComponents.map(component => component.content);
        generatedContent = `${generatedContent}\n\n${componentContents.join('\n\n')}`;
      }
    }

    return {
      generated_content: generatedContent
    };
  } catch (error) {
    console.error('Prompt generation failed:', error);
    throw error;
  }
};
