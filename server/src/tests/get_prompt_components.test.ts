
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptComponentsTable } from '../db/schema';
import { type CreatePromptComponentInput } from '../schema';
import { getPromptComponents } from '../handlers/get_prompt_components';

// Test data
const testComponent1: CreatePromptComponentInput = {
  name: 'Introduction Template',
  content: 'You are an expert assistant who helps with {topic}.',
  category: 'templates',
  type: 'chatgpt'
};

const testComponent2: CreatePromptComponentInput = {
  name: 'Art Style',
  content: 'photorealistic, highly detailed, 8k resolution',
  category: 'styles',
  type: 'midjourney'
};

describe('getPromptComponents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no components exist', async () => {
    const result = await getPromptComponents();

    expect(result).toEqual([]);
  });

  it('should return all prompt components', async () => {
    // Create test components
    await db.insert(promptComponentsTable)
      .values([testComponent1, testComponent2])
      .execute();

    const result = await getPromptComponents();

    expect(result).toHaveLength(2);
    
    // Check first component
    const component1 = result.find(c => c.name === 'Introduction Template');
    expect(component1).toBeDefined();
    expect(component1!.content).toEqual(testComponent1.content);
    expect(component1!.category).toEqual('templates');
    expect(component1!.type).toEqual('chatgpt');
    expect(component1!.id).toBeDefined();
    expect(component1!.created_at).toBeInstanceOf(Date);

    // Check second component
    const component2 = result.find(c => c.name === 'Art Style');
    expect(component2).toBeDefined();
    expect(component2!.content).toEqual(testComponent2.content);
    expect(component2!.category).toEqual('styles');
    expect(component2!.type).toEqual('midjourney');
    expect(component2!.id).toBeDefined();
    expect(component2!.created_at).toBeInstanceOf(Date);
  });

  it('should return components with all required fields', async () => {
    await db.insert(promptComponentsTable)
      .values(testComponent1)
      .execute();

    const result = await getPromptComponents();

    expect(result).toHaveLength(1);
    const component = result[0];

    // Verify all schema fields are present
    expect(typeof component.id).toBe('number');
    expect(typeof component.name).toBe('string');
    expect(typeof component.content).toBe('string');
    expect(typeof component.category).toBe('string');
    expect(['chatgpt', 'midjourney']).toContain(component.type);
    expect(component.created_at).toBeInstanceOf(Date);
  });
});
