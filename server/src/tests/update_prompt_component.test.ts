
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptComponentsTable } from '../db/schema';
import { type CreatePromptComponentInput, type UpdatePromptComponentInput } from '../schema';
import { updatePromptComponent } from '../handlers/update_prompt_component';
import { eq } from 'drizzle-orm';

// Helper function to create a test prompt component
const createTestComponent = async (data: CreatePromptComponentInput) => {
  const result = await db.insert(promptComponentsTable)
    .values(data)
    .returning()
    .execute();
  return result[0];
};

const testComponentInput: CreatePromptComponentInput = {
  name: 'Test Component',
  content: 'Test content for component',
  category: 'test',
  type: 'chatgpt'
};

describe('updatePromptComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a prompt component name', async () => {
    const component = await createTestComponent(testComponentInput);
    
    const updateInput: UpdatePromptComponentInput = {
      id: component.id,
      name: 'Updated Component Name'
    };

    const result = await updatePromptComponent(updateInput);

    expect(result.id).toEqual(component.id);
    expect(result.name).toEqual('Updated Component Name');
    expect(result.content).toEqual(testComponentInput.content);
    expect(result.category).toEqual(testComponentInput.category);
    expect(result.type).toEqual(testComponentInput.type);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const component = await createTestComponent(testComponentInput);
    
    const updateInput: UpdatePromptComponentInput = {
      id: component.id,
      name: 'New Name',
      content: 'New content',
      category: 'new_category',
      type: 'midjourney'
    };

    const result = await updatePromptComponent(updateInput);

    expect(result.id).toEqual(component.id);
    expect(result.name).toEqual('New Name');
    expect(result.content).toEqual('New content');
    expect(result.category).toEqual('new_category');
    expect(result.type).toEqual('midjourney');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const component = await createTestComponent(testComponentInput);
    
    const updateInput: UpdatePromptComponentInput = {
      id: component.id,
      content: 'Only content updated'
    };

    const result = await updatePromptComponent(updateInput);

    expect(result.id).toEqual(component.id);
    expect(result.name).toEqual(testComponentInput.name); // Unchanged
    expect(result.content).toEqual('Only content updated');
    expect(result.category).toEqual(testComponentInput.category); // Unchanged
    expect(result.type).toEqual(testComponentInput.type); // Unchanged
  });

  it('should save changes to database', async () => {
    const component = await createTestComponent(testComponentInput);
    
    const updateInput: UpdatePromptComponentInput = {
      id: component.id,
      name: 'Database Test Update',
      category: 'updated_category'
    };

    await updatePromptComponent(updateInput);

    // Verify changes in database
    const components = await db.select()
      .from(promptComponentsTable)
      .where(eq(promptComponentsTable.id, component.id))
      .execute();

    expect(components).toHaveLength(1);
    expect(components[0].name).toEqual('Database Test Update');
    expect(components[0].category).toEqual('updated_category');
    expect(components[0].content).toEqual(testComponentInput.content);
  });

  it('should throw error for non-existent component', async () => {
    const updateInput: UpdatePromptComponentInput = {
      id: 99999,
      name: 'Non-existent'
    };

    await expect(updatePromptComponent(updateInput)).rejects.toThrow(/not found/i);
  });
});
