
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptsTable, tagsTable, promptTagsTable } from '../db/schema';
import { type UpdatePromptInput } from '../schema';
import { updatePrompt } from '../handlers/update_prompt';
import { eq } from 'drizzle-orm';

describe('updatePrompt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let existingPromptId: number;
  let existingTagId: number;

  beforeEach(async () => {
    // Create existing prompt for testing
    const promptResult = await db.insert(promptsTable)
      .values({
        title: 'Original Title',
        content: 'Original content',
        type: 'chatgpt',
        is_template: false,
        template_variables: null
      })
      .returning()
      .execute();
    
    existingPromptId = promptResult[0].id;

    // Create existing tag for testing
    const tagResult = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();
    
    existingTagId = tagResult[0].id;
  });

  it('should update basic prompt fields', async () => {
    const input: UpdatePromptInput = {
      id: existingPromptId,
      title: 'Updated Title',
      content: 'Updated content',
      type: 'midjourney',
      is_template: true,
      template_variables: ['var1', 'var2']
    };

    const result = await updatePrompt(input);

    expect(result.id).toEqual(existingPromptId);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Updated content');
    expect(result.type).toEqual('midjourney');
    expect(result.is_template).toEqual(true);
    expect(result.template_variables).toEqual(['var1', 'var2']);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.tags).toEqual([]);
  });

  it('should update only provided fields', async () => {
    const input: UpdatePromptInput = {
      id: existingPromptId,
      title: 'New Title Only'
    };

    const result = await updatePrompt(input);

    expect(result.title).toEqual('New Title Only');
    expect(result.content).toEqual('Original content'); // Should remain unchanged
    expect(result.type).toEqual('chatgpt'); // Should remain unchanged
    expect(result.is_template).toEqual(false); // Should remain unchanged
    expect(result.template_variables).toBeNull(); // Should remain unchanged
  });

  it('should update prompt with tag associations', async () => {
    const input: UpdatePromptInput = {
      id: existingPromptId,
      title: 'Updated with Tags',
      tag_ids: [existingTagId]
    };

    const result = await updatePrompt(input);

    expect(result.title).toEqual('Updated with Tags');
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].id).toEqual(existingTagId);
    expect(result.tags[0].name).toEqual('Test Tag');
    expect(result.tags[0].color).toEqual('#ff0000');
  });

  it('should replace existing tag associations', async () => {
    // First, add a tag association
    await db.insert(promptTagsTable)
      .values({
        prompt_id: existingPromptId,
        tag_id: existingTagId
      })
      .execute();

    // Create another tag
    const secondTagResult = await db.insert(tagsTable)
      .values({
        name: 'Second Tag',
        color: '#00ff00'
      })
      .returning()
      .execute();

    const secondTagId = secondTagResult[0].id;

    // Update with new tag associations
    const input: UpdatePromptInput = {
      id: existingPromptId,
      tag_ids: [secondTagId]
    };

    const result = await updatePrompt(input);

    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].id).toEqual(secondTagId);
    expect(result.tags[0].name).toEqual('Second Tag');

    // Verify old association was removed
    const associations = await db.select()
      .from(promptTagsTable)
      .where(eq(promptTagsTable.prompt_id, existingPromptId))
      .execute();

    expect(associations).toHaveLength(1);
    expect(associations[0].tag_id).toEqual(secondTagId);
  });

  it('should remove all tag associations when empty array provided', async () => {
    // First, add a tag association
    await db.insert(promptTagsTable)
      .values({
        prompt_id: existingPromptId,
        tag_id: existingTagId
      })
      .execute();

    const input: UpdatePromptInput = {
      id: existingPromptId,
      tag_ids: []
    };

    const result = await updatePrompt(input);

    expect(result.tags).toHaveLength(0);

    // Verify association was removed from database
    const associations = await db.select()
      .from(promptTagsTable)
      .where(eq(promptTagsTable.prompt_id, existingPromptId))
      .execute();

    expect(associations).toHaveLength(0);
  });

  it('should save updated prompt to database', async () => {
    const input: UpdatePromptInput = {
      id: existingPromptId,
      title: 'Database Test',
      content: 'Updated content for DB test'
    };

    await updatePrompt(input);

    const updatedPrompt = await db.select()
      .from(promptsTable)
      .where(eq(promptsTable.id, existingPromptId))
      .execute();

    expect(updatedPrompt).toHaveLength(1);
    expect(updatedPrompt[0].title).toEqual('Database Test');
    expect(updatedPrompt[0].content).toEqual('Updated content for DB test');
    expect(updatedPrompt[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent prompt', async () => {
    const input: UpdatePromptInput = {
      id: 99999,
      title: 'Non-existent'
    };

    expect(updatePrompt(input)).rejects.toThrow(/not found/i);
  });
});
