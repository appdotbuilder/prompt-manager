
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable, promptsTable, promptTagsTable } from '../db/schema';
import { type JsonEditorInput } from '../schema';
import { importJsonPrompt } from '../handlers/import_json_prompt';
import { eq } from 'drizzle-orm';

describe('importJsonPrompt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should import a basic prompt from JSON', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Imported Prompt',
        content: 'This is imported content',
        type: 'chatgpt',
        is_template: false,
        template_variables: null
      }
    };

    const result = await importJsonPrompt(input);

    expect(result.title).toEqual('Imported Prompt');
    expect(result.content).toEqual('This is imported content');
    expect(result.type).toEqual('chatgpt');
    expect(result.is_template).toEqual(false);
    expect(result.template_variables).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.tags).toEqual([]);
  });

  it('should import a template prompt with variables', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Template Prompt',
        content: 'Write about {{topic}} in {{style}} style',
        type: 'midjourney',
        is_template: true,
        template_variables: ['topic', 'style']
      }
    };

    const result = await importJsonPrompt(input);

    expect(result.title).toEqual('Template Prompt');
    expect(result.content).toEqual('Write about {{topic}} in {{style}} style');
    expect(result.type).toEqual('midjourney');
    expect(result.is_template).toEqual(true);
    expect(result.template_variables).toEqual(['topic', 'style']);
  });

  it('should import prompt with tags', async () => {
    // Create test tags first
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'Creative', color: '#ff0000' },
        { name: 'Business', color: '#00ff00' }
      ])
      .returning()
      .execute();

    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Tagged Prompt',
        content: 'Content with tags',
        type: 'chatgpt',
        is_template: false,
        template_variables: null,
        tag_ids: [tagResults[0].id, tagResults[1].id]
      }
    };

    const result = await importJsonPrompt(input);

    expect(result.title).toEqual('Tagged Prompt');
    expect(result.tags).toHaveLength(2);
    expect(result.tags.map(t => t.name)).toContain('Creative');
    expect(result.tags.map(t => t.name)).toContain('Business');
  });

  it('should save imported prompt to database', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Database Test',
        content: 'Test content for database',
        type: 'chatgpt',
        is_template: true,
        template_variables: ['variable1']
      }
    };

    const result = await importJsonPrompt(input);

    const prompts = await db.select()
      .from(promptsTable)
      .where(eq(promptsTable.id, result.id))
      .execute();

    expect(prompts).toHaveLength(1);
    expect(prompts[0].title).toEqual('Database Test');
    expect(prompts[0].content).toEqual('Test content for database');
    expect(prompts[0].type).toEqual('chatgpt');
    expect(prompts[0].is_template).toEqual(true);
    expect(prompts[0].template_variables).toEqual(['variable1']);
  });

  it('should save tag associations to database', async () => {
    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values({ name: 'Test Tag', color: '#blue' })
      .returning()
      .execute();

    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Tagged Import',
        content: 'Content with tag',
        type: 'chatgpt',
        is_template: false,
        template_variables: null,
        tag_ids: [tagResult[0].id]
      }
    };

    const result = await importJsonPrompt(input);

    const promptTags = await db.select()
      .from(promptTagsTable)
      .where(eq(promptTagsTable.prompt_id, result.id))
      .execute();

    expect(promptTags).toHaveLength(1);
    expect(promptTags[0].tag_id).toEqual(tagResult[0].id);
  });

  it('should reject invalid JSON data', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: '', // Invalid - empty string
        content: 'Valid content',
        type: 'chatgpt'
      }
    };

    await expect(importJsonPrompt(input)).rejects.toThrow(/title/i);
  });

  it('should reject invalid prompt type', async () => {
    const input: JsonEditorInput = {
      prompt_data: {
        title: 'Valid Title',
        content: 'Valid content',
        type: 'invalid_type' // Invalid type
      }
    };

    await expect(importJsonPrompt(input)).rejects.toThrow();
  });
});
