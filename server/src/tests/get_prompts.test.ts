
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptsTable, tagsTable, promptTagsTable } from '../db/schema';
import { getPrompts } from '../handlers/get_prompts';

describe('getPrompts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no prompts exist', async () => {
    const result = await getPrompts();
    expect(result).toEqual([]);
  });

  it('should return prompts without tags', async () => {
    // Create a prompt without tags
    await db.insert(promptsTable).values({
      title: 'Test Prompt',
      content: 'Test content',
      type: 'chatgpt',
      is_template: false,
      template_variables: null
    }).execute();

    const result = await getPrompts();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Test Prompt');
    expect(result[0].content).toEqual('Test content');
    expect(result[0].type).toEqual('chatgpt');
    expect(result[0].is_template).toEqual(false);
    expect(result[0].template_variables).toBeNull();
    expect(result[0].tags).toEqual([]);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return prompts with tags', async () => {
    // Create tags first
    const tagResults = await db.insert(tagsTable).values([
      { name: 'AI', color: '#ff0000' },
      { name: 'Creative', color: '#00ff00' }
    ]).returning().execute();

    // Create prompt
    const promptResults = await db.insert(promptsTable).values({
      title: 'Tagged Prompt',
      content: 'Prompt with tags',
      type: 'midjourney',
      is_template: true,
      template_variables: ['variable1', 'variable2']
    }).returning().execute();

    // Create relationships
    await db.insert(promptTagsTable).values([
      { prompt_id: promptResults[0].id, tag_id: tagResults[0].id },
      { prompt_id: promptResults[0].id, tag_id: tagResults[1].id }
    ]).execute();

    const result = await getPrompts();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Tagged Prompt');
    expect(result[0].content).toEqual('Prompt with tags');
    expect(result[0].type).toEqual('midjourney');
    expect(result[0].is_template).toEqual(true);
    expect(result[0].template_variables).toEqual(['variable1', 'variable2']);
    expect(result[0].tags).toHaveLength(2);
    
    const tagNames = result[0].tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['AI', 'Creative']);
    
    const tagColors = result[0].tags.map(tag => tag.color).sort();
    expect(tagColors).toEqual(['#00ff00', '#ff0000']);
  });

  it('should return multiple prompts with mixed tag associations', async () => {
    // Create tags
    const tagResults = await db.insert(tagsTable).values([
      { name: 'Productivity', color: '#blue' },
      { name: 'Fun', color: '#yellow' }
    ]).returning().execute();

    // Create prompts
    const promptResults = await db.insert(promptsTable).values([
      {
        title: 'Work Prompt',
        content: 'Work related content',
        type: 'chatgpt',
        is_template: false,
        template_variables: null
      },
      {
        title: 'Fun Prompt',
        content: 'Fun content',
        type: 'midjourney',
        is_template: true,
        template_variables: ['mood']
      }
    ]).returning().execute();

    // First prompt gets Productivity tag, second gets Fun tag
    await db.insert(promptTagsTable).values([
      { prompt_id: promptResults[0].id, tag_id: tagResults[0].id },
      { prompt_id: promptResults[1].id, tag_id: tagResults[1].id }
    ]).execute();

    const result = await getPrompts();

    expect(result).toHaveLength(2);
    
    // Sort by title for predictable testing
    const sortedResult = result.sort((a, b) => a.title.localeCompare(b.title));
    
    expect(sortedResult[0].title).toEqual('Fun Prompt');
    expect(sortedResult[0].tags).toHaveLength(1);
    expect(sortedResult[0].tags[0].name).toEqual('Fun');
    
    expect(sortedResult[1].title).toEqual('Work Prompt');
    expect(sortedResult[1].tags).toHaveLength(1);
    expect(sortedResult[1].tags[0].name).toEqual('Productivity');
  });

  it('should handle prompts with duplicate tag relationships correctly', async () => {
    // Create tag
    const tagResults = await db.insert(tagsTable).values({
      name: 'Test Tag',
      color: '#purple'
    }).returning().execute();

    // Create prompt
    const promptResults = await db.insert(promptsTable).values({
      title: 'Test Prompt',
      content: 'Test content',
      type: 'chatgpt',
      is_template: false,
      template_variables: null
    }).returning().execute();

    // Create relationship
    await db.insert(promptTagsTable).values({
      prompt_id: promptResults[0].id,
      tag_id: tagResults[0].id
    }).execute();

    const result = await getPrompts();

    expect(result).toHaveLength(1);
    expect(result[0].tags).toHaveLength(1);
    expect(result[0].tags[0].name).toEqual('Test Tag');
  });
});
