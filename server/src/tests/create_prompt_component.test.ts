
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptComponentsTable } from '../db/schema';
import { type CreatePromptComponentInput } from '../schema';
import { createPromptComponent } from '../handlers/create_prompt_component';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreatePromptComponentInput = {
  name: 'Test Component',
  content: 'This is a test prompt component for {{variable}}',
  category: 'testing',
  type: 'chatgpt'
};

describe('createPromptComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a prompt component', async () => {
    const result = await createPromptComponent(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Component');
    expect(result.content).toEqual('This is a test prompt component for {{variable}}');
    expect(result.category).toEqual('testing');
    expect(result.type).toEqual('chatgpt');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save prompt component to database', async () => {
    const result = await createPromptComponent(testInput);

    // Query using proper drizzle syntax
    const components = await db.select()
      .from(promptComponentsTable)
      .where(eq(promptComponentsTable.id, result.id))
      .execute();

    expect(components).toHaveLength(1);
    expect(components[0].name).toEqual('Test Component');
    expect(components[0].content).toEqual(testInput.content);
    expect(components[0].category).toEqual('testing');
    expect(components[0].type).toEqual('chatgpt');
    expect(components[0].created_at).toBeInstanceOf(Date);
  });

  it('should create midjourney type component', async () => {
    const midjourneyInput: CreatePromptComponentInput = {
      name: 'Midjourney Component',
      content: 'A beautiful landscape in {{style}} style --ar 16:9',
      category: 'art',
      type: 'midjourney'
    };

    const result = await createPromptComponent(midjourneyInput);

    expect(result.name).toEqual('Midjourney Component');
    expect(result.content).toEqual('A beautiful landscape in {{style}} style --ar 16:9');
    expect(result.category).toEqual('art');
    expect(result.type).toEqual('midjourney');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle different categories correctly', async () => {
    const categoryInputs = [
      { ...testInput, category: 'writing' },
      { ...testInput, category: 'analysis' },
      { ...testInput, category: 'creative' }
    ];

    for (const input of categoryInputs) {
      const result = await createPromptComponent(input);
      expect(result.category).toEqual(input.category);
      
      // Verify in database
      const saved = await db.select()
        .from(promptComponentsTable)
        .where(eq(promptComponentsTable.id, result.id))
        .execute();
      
      expect(saved[0].category).toEqual(input.category);
    }
  });
});
