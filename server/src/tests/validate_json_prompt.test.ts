
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type JsonEditorInput } from '../schema';
import { validateJsonPrompt } from '../handlers/validate_json_prompt';

describe('validateJsonPrompt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should validate a correct prompt structure', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Test Prompt',
        content: 'This is a test prompt content',
        type: 'chatgpt',
        is_template: false
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should validate a template prompt with variables', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Template Prompt',
        content: 'Hello {{name}}, your {{item}} is ready',
        type: 'midjourney',
        is_template: true,
        template_variables: ['name', 'item']
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should validate prompt with optional fields', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Complex Prompt',
        content: 'Generate image with {{style}} style',
        type: 'midjourney',
        is_template: true,
        template_variables: ['style'],
        tag_ids: [1, 2, 3],
        component_ids: [10, 20],
        variables: {
          'style': 'photorealistic',
          'mood': 'bright'
        }
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should reject missing title', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        content: 'Content without title',
        type: 'chatgpt'
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required and must be a non-empty string');
  });

  it('should reject empty title', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: '   ',
        content: 'Content with empty title',
        type: 'chatgpt'
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required and must be a non-empty string');
  });

  it('should reject missing content', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Title without content',
        type: 'chatgpt'
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Content is required and must be a non-empty string');
  });

  it('should reject invalid type', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Test Prompt',
        content: 'Test content',
        type: 'invalid_type'
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Type must be either "chatgpt" or "midjourney"');
  });

  it('should reject invalid is_template type', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Test Prompt',
        content: 'Test content',
        type: 'chatgpt',
        is_template: 'true'
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('is_template must be a boolean value');
  });

  it('should reject invalid template_variables format', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Test Prompt',
        content: 'Test content',
        type: 'chatgpt',
        template_variables: 'not_an_array'
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('template_variables must be an array or null');
  });

  it('should reject non-string template variables', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Test Prompt',
        content: 'Test content',
        type: 'chatgpt',
        template_variables: ['valid', 123, 'another_valid']
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('All template variables must be strings');
  });

  it('should reject invalid tag_ids format', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Test Prompt',
        content: 'Test content',
        type: 'chatgpt',
        tag_ids: 'not_an_array'
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('tag_ids must be an array');
  });

  it('should reject invalid tag_ids values', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Test Prompt',
        content: 'Test content',
        type: 'chatgpt',
        tag_ids: [1, 'invalid', -5, 0]
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('All tag IDs must be positive integers');
  });

  it('should reject invalid component_ids values', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Test Prompt',
        content: 'Test content',
        type: 'chatgpt',
        component_ids: [1.5, 'invalid', -10]
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('All component IDs must be positive integers');
  });

  it('should reject invalid variables format', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Test Prompt',
        content: 'Test content',
        type: 'chatgpt',
        variables: ['not', 'an', 'object']
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('variables must be an object');
  });

  it('should reject non-string variable values', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Test Prompt',
        content: 'Test content',
        type: 'chatgpt',
        variables: {
          'valid_key': 'valid_value',
          'invalid_key': 123,
          'another_invalid': true
        }
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('All variable keys and values must be strings');
  });

  it('should detect undeclared template variables', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Template Prompt',
        content: 'Hello {{name}}, your {{item}} is ready and {{status}} is good',
        type: 'chatgpt',
        is_template: true,
        template_variables: ['name', 'item']
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Undeclared template variables found in content: status');
  });

  it('should detect unused template variables', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Template Prompt',
        content: 'Hello {{name}}',
        type: 'chatgpt',
        is_template: true,
        template_variables: ['name', 'unused_var', 'another_unused']
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Declared template variables not used in content: unused_var, another_unused');
  });

  it('should reject null or undefined prompt_data', async () => {
    const input: JsonEditorInput = {
      prompt_data: null as any
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Prompt data must be a valid object');
  });

  it('should accumulate multiple validation errors', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: '',
        type: 'invalid_type',
        is_template: 'not_boolean',
        tag_ids: 'not_array',
        template_variables: [123, 'valid']
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(false);
    // The input has: empty title, missing content, invalid type, invalid is_template, invalid tag_ids, invalid template_variables
    expect(result.errors).toHaveLength(6);
    expect(result.errors).toContain('Title is required and must be a non-empty string');
    expect(result.errors).toContain('Content is required and must be a non-empty string');
    expect(result.errors).toContain('Type must be either "chatgpt" or "midjourney"');
    expect(result.errors).toContain('is_template must be a boolean value');
    expect(result.errors).toContain('tag_ids must be an array');
    expect(result.errors).toContain('All template variables must be strings');
  });

  it('should allow null template_variables', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Test Prompt',
        content: 'Simple content without variables',
        type: 'chatgpt',
        is_template: false,
        template_variables: null
      }
    };

    const result = await validateJsonPrompt(input);

    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });
});
