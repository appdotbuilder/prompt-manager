
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptsTable, promptComponentsTable } from '../db/schema';
import { type GeneratePromptInput } from '../schema';
import { generatePrompt } from '../handlers/generate_prompt';

describe('generatePrompt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate content from a template without variables', async () => {
    // Create a template prompt
    const templateResult = await db
      .insert(promptsTable)
      .values({
        title: 'Test Template',
        content: 'This is a simple template without variables.',
        type: 'chatgpt',
        is_template: true,
        template_variables: null
      })
      .returning()
      .execute();

    const input: GeneratePromptInput = {
      template_id: templateResult[0].id
    };

    const result = await generatePrompt(input);

    expect(result.generated_content).toEqual('This is a simple template without variables.');
  });

  it('should replace template variables with provided values', async () => {
    // Create a template with variables
    const templateResult = await db
      .insert(promptsTable)
      .values({
        title: 'Template with Variables',
        content: 'Hello {{name}}, your role is {{role}}. Task: {{task}}',
        type: 'chatgpt',
        is_template: true,
        template_variables: ['name', 'role', 'task']
      })
      .returning()
      .execute();

    const input: GeneratePromptInput = {
      template_id: templateResult[0].id,
      variables: {
        name: 'Alice',
        role: 'developer',
        task: 'write tests'
      }
    };

    const result = await generatePrompt(input);

    expect(result.generated_content).toEqual('Hello Alice, your role is developer. Task: write tests');
  });

  it('should append matching components to generated content', async () => {
    // Create a template
    const templateResult = await db
      .insert(promptsTable)
      .values({
        title: 'Base Template',
        content: 'Base prompt content.',
        type: 'chatgpt',
        is_template: true,
        template_variables: null
      })
      .returning()
      .execute();

    // Create components with matching type
    const componentResults = await db
      .insert(promptComponentsTable)
      .values([
        {
          name: 'Component 1',
          content: 'Additional instruction 1',
          category: 'instructions',
          type: 'chatgpt'
        },
        {
          name: 'Component 2',
          content: 'Additional instruction 2',
          category: 'instructions',
          type: 'chatgpt'
        }
      ])
      .returning()
      .execute();

    const input: GeneratePromptInput = {
      template_id: templateResult[0].id,
      component_ids: componentResults.map(c => c.id)
    };

    const result = await generatePrompt(input);

    expect(result.generated_content).toEqual(
      'Base prompt content.\n\nAdditional instruction 1\n\nAdditional instruction 2'
    );
  });

  it('should combine template variables and components', async () => {
    // Create a template with variables
    const templateResult = await db
      .insert(promptsTable)
      .values({
        title: 'Complex Template',
        content: 'You are a {{role}}. Your task is {{task}}.',
        type: 'midjourney',
        is_template: true,
        template_variables: ['role', 'task']
      })
      .returning()
      .execute();

    // Create a component with matching type
    const componentResult = await db
      .insert(promptComponentsTable)
      .values({
        name: 'Style Component',
        content: 'Style: photorealistic, high quality',
        category: 'style',
        type: 'midjourney'
      })
      .returning()
      .execute();

    const input: GeneratePromptInput = {
      template_id: templateResult[0].id,
      variables: {
        role: 'artist',
        task: 'create stunning visuals'
      },
      component_ids: [componentResult[0].id]
    };

    const result = await generatePrompt(input);

    expect(result.generated_content).toEqual(
      'You are a artist. Your task is create stunning visuals.\n\nStyle: photorealistic, high quality'
    );
  });

  it('should filter out components with mismatched types', async () => {
    // Create a ChatGPT template
    const templateResult = await db
      .insert(promptsTable)
      .values({
        title: 'ChatGPT Template',
        content: 'ChatGPT prompt content.',
        type: 'chatgpt',
        is_template: true,
        template_variables: null
      })
      .returning()
      .execute();

    // Create components with different types
    const componentResults = await db
      .insert(promptComponentsTable)
      .values([
        {
          name: 'ChatGPT Component',
          content: 'ChatGPT instruction',
          category: 'instructions',
          type: 'chatgpt'
        },
        {
          name: 'Midjourney Component',
          content: 'Midjourney style',
          category: 'style',
          type: 'midjourney'
        }
      ])
      .returning()
      .execute();

    const input: GeneratePromptInput = {
      template_id: templateResult[0].id,
      component_ids: componentResults.map(c => c.id)
    };

    const result = await generatePrompt(input);

    // Should only include the ChatGPT component
    expect(result.generated_content).toEqual('ChatGPT prompt content.\n\nChatGPT instruction');
  });

  it('should throw error for non-existent template', async () => {
    const input: GeneratePromptInput = {
      template_id: 999
    };

    await expect(generatePrompt(input)).rejects.toThrow(/Template with id 999 not found/i);
  });

  it('should throw error for non-template prompt', async () => {
    // Create a regular prompt (not a template)
    const promptResult = await db
      .insert(promptsTable)
      .values({
        title: 'Regular Prompt',
        content: 'This is not a template.',
        type: 'chatgpt',
        is_template: false,
        template_variables: null
      })
      .returning()
      .execute();

    const input: GeneratePromptInput = {
      template_id: promptResult[0].id
    };

    await expect(generatePrompt(input)).rejects.toThrow(/is not a template/i);
  });
});
