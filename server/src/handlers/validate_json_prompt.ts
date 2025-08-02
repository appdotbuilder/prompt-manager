
import { type JsonEditorInput } from '../schema';

export const validateJsonPrompt = async (input: JsonEditorInput): Promise<{ valid: boolean; errors?: string[] }> => {
  try {
    const errors: string[] = [];
    const { prompt_data } = input;

    // Check if prompt_data exists
    if (!prompt_data || typeof prompt_data !== 'object') {
      errors.push('Prompt data must be a valid object');
      return { valid: false, errors };
    }

    // Validate required fields for prompt structure
    if (!prompt_data['title'] || typeof prompt_data['title'] !== 'string' || prompt_data['title'].trim().length === 0) {
      errors.push('Title is required and must be a non-empty string');
    }

    if (!prompt_data['content'] || typeof prompt_data['content'] !== 'string' || prompt_data['content'].trim().length === 0) {
      errors.push('Content is required and must be a non-empty string');
    }

    // Validate type field
    if (!prompt_data['type'] || !['chatgpt', 'midjourney'].includes(prompt_data['type'])) {
      errors.push('Type must be either "chatgpt" or "midjourney"');
    }

    // Validate optional boolean fields
    if (prompt_data['is_template'] !== undefined && typeof prompt_data['is_template'] !== 'boolean') {
      errors.push('is_template must be a boolean value');
    }

    // Validate template_variables if present
    if (prompt_data['template_variables'] !== undefined && prompt_data['template_variables'] !== null) {
      if (!Array.isArray(prompt_data['template_variables'])) {
        errors.push('template_variables must be an array or null');
      } else {
        // Check if all elements are strings
        const invalidVariables = prompt_data['template_variables'].filter(
          (variable: any) => typeof variable !== 'string'
        );
        if (invalidVariables.length > 0) {
          errors.push('All template variables must be strings');
        }
      }
    }

    // Validate tag_ids if present
    if (prompt_data['tag_ids'] !== undefined) {
      if (!Array.isArray(prompt_data['tag_ids'])) {
        errors.push('tag_ids must be an array');
      } else {
        // Check if all elements are numbers
        const invalidTagIds = prompt_data['tag_ids'].filter(
          (id: any) => typeof id !== 'number' || !Number.isInteger(id) || id <= 0
        );
        if (invalidTagIds.length > 0) {
          errors.push('All tag IDs must be positive integers');
        }
      }
    }

    // Validate component_ids if present
    if (prompt_data['component_ids'] !== undefined) {
      if (!Array.isArray(prompt_data['component_ids'])) {
        errors.push('component_ids must be an array');
      } else {
        // Check if all elements are numbers
        const invalidComponentIds = prompt_data['component_ids'].filter(
          (id: any) => typeof id !== 'number' || !Number.isInteger(id) || id <= 0
        );
        if (invalidComponentIds.length > 0) {
          errors.push('All component IDs must be positive integers');
        }
      }
    }

    // Validate variables object if present (for template generation)
    if (prompt_data['variables'] !== undefined) {
      if (typeof prompt_data['variables'] !== 'object' || prompt_data['variables'] === null || Array.isArray(prompt_data['variables'])) {
        errors.push('variables must be an object');
      } else {
        // Check if all values are strings
        const invalidVariables = Object.entries(prompt_data['variables']).filter(
          ([key, value]) => typeof key !== 'string' || typeof value !== 'string'
        );
        if (invalidVariables.length > 0) {
          errors.push('All variable keys and values must be strings');
        }
      }
    }

    // Check for template consistency
    if (prompt_data['is_template'] === true && prompt_data['template_variables'] && prompt_data['content']) {
      const contentVariables = extractVariablesFromContent(prompt_data['content'] as string);
      const declaredVariables = new Set(prompt_data['template_variables'] as string[]);
      
      // Check if all content variables are declared
      const undeclaredVariables = contentVariables.filter(variable => !declaredVariables.has(variable));
      if (undeclaredVariables.length > 0) {
        errors.push(`Undeclared template variables found in content: ${undeclaredVariables.join(', ')}`);
      }

      // Check if all declared variables are used
      const unusedVariables = (prompt_data['template_variables'] as string[]).filter((variable: string) => !contentVariables.includes(variable));
      if (unusedVariables.length > 0) {
        errors.push(`Declared template variables not used in content: ${unusedVariables.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('JSON prompt validation failed:', error);
    throw error;
  }
};

// Helper function to extract template variables from content
function extractVariablesFromContent(content: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}
