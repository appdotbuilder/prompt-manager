
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptComponentsTable } from '../db/schema';
import { type CreatePromptComponentInput } from '../schema';
import { deletePromptComponent } from '../handlers/delete_prompt_component';
import { eq } from 'drizzle-orm';

// Test input for creating prompt components
const testInput: CreatePromptComponentInput = {
  name: 'Test Component',
  content: 'This is a test prompt component for {{variable}}',
  category: 'testing',
  type: 'chatgpt'
};

describe('deletePromptComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing prompt component', async () => {
    // Create a test prompt component first
    const created = await db.insert(promptComponentsTable)
      .values({
        name: testInput.name,
        content: testInput.content,
        category: testInput.category,
        type: testInput.type
      })
      .returning()
      .execute();

    const componentId = created[0].id;

    // Delete the prompt component
    const result = await deletePromptComponent(componentId);

    // Should return success
    expect(result.success).toBe(true);

    // Verify the component is deleted from database
    const components = await db.select()
      .from(promptComponentsTable)
      .where(eq(promptComponentsTable.id, componentId))
      .execute();

    expect(components).toHaveLength(0);
  });

  it('should return success false for non-existent prompt component', async () => {
    // Try to delete a component that doesn't exist
    const result = await deletePromptComponent(999);

    // Should return success false since no record was deleted
    expect(result.success).toBe(false);
  });

  it('should not affect other prompt components', async () => {
    // Create two test prompt components
    const created = await db.insert(promptComponentsTable)
      .values([
        {
          name: 'Component 1',
          content: 'First component content',
          category: 'category1',
          type: 'chatgpt'
        },
        {
          name: 'Component 2',
          content: 'Second component content',
          category: 'category2',
          type: 'midjourney'
        }
      ])
      .returning()
      .execute();

    const firstId = created[0].id;
    const secondId = created[1].id;

    // Delete only the first component
    const result = await deletePromptComponent(firstId);

    expect(result.success).toBe(true);

    // Verify first component is deleted
    const firstComponent = await db.select()
      .from(promptComponentsTable)
      .where(eq(promptComponentsTable.id, firstId))
      .execute();

    expect(firstComponent).toHaveLength(0);

    // Verify second component still exists
    const secondComponent = await db.select()
      .from(promptComponentsTable)
      .where(eq(promptComponentsTable.id, secondId))
      .execute();

    expect(secondComponent).toHaveLength(1);
    expect(secondComponent[0].name).toBe('Component 2');
    expect(secondComponent[0].content).toBe('Second component content');
    expect(secondComponent[0].category).toBe('category2');
    expect(secondComponent[0].type).toBe('midjourney');
  });

  it('should handle multiple deletion attempts gracefully', async () => {
    // Create a test prompt component
    const created = await db.insert(promptComponentsTable)
      .values({
        name: testInput.name,
        content: testInput.content,
        category: testInput.category,
        type: testInput.type
      })
      .returning()
      .execute();

    const componentId = created[0].id;

    // Delete the component first time
    const firstResult = await deletePromptComponent(componentId);
    expect(firstResult.success).toBe(true);

    // Try to delete the same component again
    const secondResult = await deletePromptComponent(componentId);
    expect(secondResult.success).toBe(false);

    // Verify the component remains deleted
    const components = await db.select()
      .from(promptComponentsTable)
      .where(eq(promptComponentsTable.id, componentId))
      .execute();

    expect(components).toHaveLength(0);
  });
});
