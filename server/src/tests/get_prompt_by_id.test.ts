
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptsTable, tagsTable, promptTagsTable } from '../db/schema';
import { getPromptById } from '../handlers/get_prompt_by_id';

describe('getPromptById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return prompt with tags when found', async () => {
    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();
    const tag = tagResult[0];

    // Create test prompt
    const promptResult = await db.insert(promptsTable)
      .values({
        title: 'Test Prompt',
        content: 'This is a test prompt',
        type: 'chatgpt',
        is_template: true,
        template_variables: ['variable1', 'variable2']
      })
      .returning()
      .execute();
    const prompt = promptResult[0];

    // Create prompt-tag relationship
    await db.insert(promptTagsTable)
      .values({
        prompt_id: prompt.id,
        tag_id: tag.id
      })
      .execute();

    const result = await getPromptById(prompt.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(prompt.id);
    expect(result!.title).toEqual('Test Prompt');
    expect(result!.content).toEqual('This is a test prompt');
    expect(result!.type).toEqual('chatgpt');
    expect(result!.is_template).toEqual(true);
    expect(result!.template_variables).toEqual(['variable1', 'variable2']);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.tags).toHaveLength(1);
    expect(result!.tags[0].id).toEqual(tag.id);
    expect(result!.tags[0].name).toEqual('Test Tag');
    expect(result!.tags[0].color).toEqual('#ff0000');
    expect(result!.tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should return prompt with empty tags array when no tags associated', async () => {
    // Create test prompt without tags
    const promptResult = await db.insert(promptsTable)
      .values({
        title: 'Untagged Prompt',
        content: 'This prompt has no tags',
        type: 'midjourney',
        is_template: false,
        template_variables: null
      })
      .returning()
      .execute();
    const prompt = promptResult[0];

    const result = await getPromptById(prompt.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(prompt.id);
    expect(result!.title).toEqual('Untagged Prompt');
    expect(result!.content).toEqual('This prompt has no tags');
    expect(result!.type).toEqual('midjourney');
    expect(result!.is_template).toEqual(false);
    expect(result!.template_variables).toBeNull();
    expect(result!.tags).toHaveLength(0);
  });

  it('should return null when prompt not found', async () => {
    const result = await getPromptById(999);
    expect(result).toBeNull();
  });

  it('should return prompt with multiple tags', async () => {
    // Create test tags
    const tag1Result = await db.insert(tagsTable)
      .values({ name: 'Tag 1', color: '#ff0000' })
      .returning()
      .execute();
    const tag1 = tag1Result[0];

    const tag2Result = await db.insert(tagsTable)
      .values({ name: 'Tag 2', color: '#00ff00' })
      .returning()
      .execute();
    const tag2 = tag2Result[0];

    // Create test prompt
    const promptResult = await db.insert(promptsTable)
      .values({
        title: 'Multi-tag Prompt',
        content: 'This prompt has multiple tags',
        type: 'chatgpt',
        is_template: false,
        template_variables: []
      })
      .returning()
      .execute();
    const prompt = promptResult[0];

    // Create prompt-tag relationships
    await db.insert(promptTagsTable)
      .values([
        { prompt_id: prompt.id, tag_id: tag1.id },
        { prompt_id: prompt.id, tag_id: tag2.id }
      ])
      .execute();

    const result = await getPromptById(prompt.id);

    expect(result).not.toBeNull();
    expect(result!.tags).toHaveLength(2);
    
    const tagNames = result!.tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['Tag 1', 'Tag 2']);
    
    const tagColors = result!.tags.map(tag => tag.color).sort();
    expect(tagColors).toEqual(['#00ff00', '#ff0000']);
  });
});
