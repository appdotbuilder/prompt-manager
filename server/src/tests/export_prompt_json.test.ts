
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptsTable, tagsTable, promptTagsTable } from '../db/schema';
import { exportPromptJson } from '../handlers/export_prompt_json';

describe('exportPromptJson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export prompt with tags as JSON', async () => {
    // Create test tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'AI', color: '#blue' },
        { name: 'Creative', color: '#green' }
      ])
      .returning()
      .execute();

    // Create test prompt
    const promptResults = await db.insert(promptsTable)
      .values({
        title: 'Test Prompt',
        content: 'This is a test prompt content',
        type: 'chatgpt',
        is_template: true,
        template_variables: ['name', 'context']
      })
      .returning()
      .execute();

    const prompt = promptResults[0];
    const tags = tagResults;

    // Associate tags with prompt
    await db.insert(promptTagsTable)
      .values([
        { prompt_id: prompt.id, tag_id: tags[0].id },
        { prompt_id: prompt.id, tag_id: tags[1].id }
      ])
      .execute();

    const result = await exportPromptJson(prompt.id);

    expect(result.prompt_data['id']).toEqual(prompt.id);
    expect(result.prompt_data['title']).toEqual('Test Prompt');
    expect(result.prompt_data['content']).toEqual('This is a test prompt content');
    expect(result.prompt_data['type']).toEqual('chatgpt');
    expect(result.prompt_data['is_template']).toEqual(true);
    expect(result.prompt_data['template_variables']).toEqual(['name', 'context']);
    expect(result.prompt_data['created_at']).toBeDefined();
    expect(result.prompt_data['updated_at']).toBeDefined();
    expect(result.prompt_data['tags']).toHaveLength(2);
    expect(result.prompt_data['tags'][0].name).toEqual('AI');
    expect(result.prompt_data['tags'][1].name).toEqual('Creative');
  });

  it('should export prompt without tags', async () => {
    // Create test prompt without tags
    const promptResults = await db.insert(promptsTable)
      .values({
        title: 'Solo Prompt',
        content: 'A prompt without tags',
        type: 'midjourney',
        is_template: false,
        template_variables: null
      })
      .returning()
      .execute();

    const prompt = promptResults[0];

    const result = await exportPromptJson(prompt.id);

    expect(result.prompt_data['id']).toEqual(prompt.id);
    expect(result.prompt_data['title']).toEqual('Solo Prompt');
    expect(result.prompt_data['content']).toEqual('A prompt without tags');
    expect(result.prompt_data['type']).toEqual('midjourney');
    expect(result.prompt_data['is_template']).toEqual(false);
    expect(result.prompt_data['template_variables']).toBeNull();
    expect(result.prompt_data['tags']).toHaveLength(0);
  });

  it('should throw error for non-existent prompt', async () => {
    await expect(exportPromptJson(999)).rejects.toThrow(/not found/i);
  });

  it('should handle dates correctly in JSON export', async () => {
    const promptResults = await db.insert(promptsTable)
      .values({
        title: 'Date Test',
        content: 'Testing date handling',
        type: 'chatgpt',
        is_template: false,
        template_variables: null
      })
      .returning()
      .execute();

    const prompt = promptResults[0];

    const result = await exportPromptJson(prompt.id);

    // Verify dates are exported as ISO strings
    expect(typeof result.prompt_data['created_at']).toEqual('string');
    expect(typeof result.prompt_data['updated_at']).toEqual('string');
    expect(result.prompt_data['created_at']).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.prompt_data['updated_at']).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
