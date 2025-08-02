
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptsTable, tagsTable, promptTagsTable } from '../db/schema';
import { type CreatePromptInput } from '../schema';
import { createPrompt } from '../handlers/create_prompt';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreatePromptInput = {
  title: 'Test Prompt',
  content: 'This is a test prompt for ChatGPT',
  type: 'chatgpt',
  is_template: false,
  template_variables: null
};

// Template test input
const templateInput: CreatePromptInput = {
  title: 'Template Prompt',
  content: 'Hello {{name}}, your age is {{age}}',
  type: 'midjourney',
  is_template: true,
  template_variables: ['name', 'age']
};

describe('createPrompt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a prompt without tags', async () => {
    const result = await createPrompt(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Prompt');
    expect(result.content).toEqual('This is a test prompt for ChatGPT');
    expect(result.type).toEqual('chatgpt');
    expect(result.is_template).toEqual(false);
    expect(result.template_variables).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.tags).toEqual([]);
  });

  it('should create a template prompt with variables', async () => {
    const result = await createPrompt(templateInput);

    expect(result.title).toEqual('Template Prompt');
    expect(result.content).toEqual('Hello {{name}}, your age is {{age}}');
    expect(result.type).toEqual('midjourney');
    expect(result.is_template).toEqual(true);
    expect(result.template_variables).toEqual(['name', 'age']);
    expect(result.tags).toEqual([]);
  });

  it('should save prompt to database', async () => {
    const result = await createPrompt(testInput);

    const prompts = await db.select()
      .from(promptsTable)
      .where(eq(promptsTable.id, result.id))
      .execute();

    expect(prompts).toHaveLength(1);
    expect(prompts[0].title).toEqual('Test Prompt');
    expect(prompts[0].content).toEqual('This is a test prompt for ChatGPT');
    expect(prompts[0].type).toEqual('chatgpt');
    expect(prompts[0].is_template).toEqual(false);
    expect(prompts[0].created_at).toBeInstanceOf(Date);
    expect(prompts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create prompt with tags', async () => {
    // Create test tags first
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'Work', color: '#blue' },
        { name: 'Creative', color: '#green' }
      ])
      .returning()
      .execute();

    const inputWithTags: CreatePromptInput = {
      ...testInput,
      tag_ids: [tagResults[0].id, tagResults[1].id]
    };

    const result = await createPrompt(inputWithTags);

    expect(result.tags).toHaveLength(2);
    expect(result.tags[0].name).toEqual('Work');
    expect(result.tags[0].color).toEqual('#blue');
    expect(result.tags[1].name).toEqual('Creative');
    expect(result.tags[1].color).toEqual('#green');
  });

  it('should create prompt-tag relationships in database', async () => {
    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values({ name: 'Test Tag', color: '#red' })
      .returning()
      .execute();

    const inputWithTags: CreatePromptInput = {
      ...testInput,
      tag_ids: [tagResult[0].id]
    };

    const result = await createPrompt(inputWithTags);

    // Verify prompt-tag relationship exists
    const promptTags = await db.select()
      .from(promptTagsTable)
      .where(eq(promptTagsTable.prompt_id, result.id))
      .execute();

    expect(promptTags).toHaveLength(1);
    expect(promptTags[0].tag_id).toEqual(tagResult[0].id);
    expect(promptTags[0].prompt_id).toEqual(result.id);
  });

  it('should handle empty tag_ids array', async () => {
    const inputWithEmptyTags: CreatePromptInput = {
      ...testInput,
      tag_ids: []
    };

    const result = await createPrompt(inputWithEmptyTags);

    expect(result.tags).toEqual([]);
  });
});
