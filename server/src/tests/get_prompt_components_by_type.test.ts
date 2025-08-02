
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptComponentsTable } from '../db/schema';
import { type CreatePromptComponentInput } from '../schema';
import { getPromptComponentsByType } from '../handlers/get_prompt_components_by_type';

// Test data
const chatgptComponent: CreatePromptComponentInput = {
  name: 'ChatGPT Component',
  content: 'You are a helpful assistant that {role}',
  category: 'system',
  type: 'chatgpt'
};

const midjourneyComponent: CreatePromptComponentInput = {
  name: 'Midjourney Style',
  content: 'photorealistic, {style}, high quality',
  category: 'style',
  type: 'midjourney'
};

const anotherChatgptComponent: CreatePromptComponentInput = {
  name: 'Another ChatGPT Component',
  content: 'Format your response as {format}',
  category: 'formatting',
  type: 'chatgpt'
};

describe('getPromptComponentsByType', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no components exist', async () => {
    const result = await getPromptComponentsByType('chatgpt');
    expect(result).toEqual([]);
  });

  it('should return chatgpt components only', async () => {
    // Create test data
    await db.insert(promptComponentsTable)
      .values([chatgptComponent, midjourneyComponent, anotherChatgptComponent])
      .execute();

    const result = await getPromptComponentsByType('chatgpt');

    expect(result).toHaveLength(2);
    result.forEach(component => {
      expect(component.type).toEqual('chatgpt');
      expect(component.id).toBeDefined();
      expect(component.created_at).toBeInstanceOf(Date);
    });

    // Check specific components are included
    const componentNames = result.map(c => c.name);
    expect(componentNames).toContain('ChatGPT Component');
    expect(componentNames).toContain('Another ChatGPT Component');
    expect(componentNames).not.toContain('Midjourney Style');
  });

  it('should return midjourney components only', async () => {
    // Create test data
    await db.insert(promptComponentsTable)
      .values([chatgptComponent, midjourneyComponent, anotherChatgptComponent])
      .execute();

    const result = await getPromptComponentsByType('midjourney');

    expect(result).toHaveLength(1);
    expect(result[0].type).toEqual('midjourney');
    expect(result[0].name).toEqual('Midjourney Style');
    expect(result[0].content).toEqual('photorealistic, {style}, high quality');
    expect(result[0].category).toEqual('style');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return components with all expected fields', async () => {
    await db.insert(promptComponentsTable)
      .values([chatgptComponent])
      .execute();

    const result = await getPromptComponentsByType('chatgpt');

    expect(result).toHaveLength(1);
    const component = result[0];
    
    expect(component.id).toBeDefined();
    expect(component.name).toEqual('ChatGPT Component');
    expect(component.content).toEqual('You are a helpful assistant that {role}');
    expect(component.category).toEqual('system');
    expect(component.type).toEqual('chatgpt');
    expect(component.created_at).toBeInstanceOf(Date);
  });
});
