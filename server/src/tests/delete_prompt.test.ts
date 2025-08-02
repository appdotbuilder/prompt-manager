
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptsTable, tagsTable, promptTagsTable } from '../db/schema';
import { type CreatePromptInput, type CreateTagInput } from '../schema';
import { deletePrompt } from '../handlers/delete_prompt';
import { eq } from 'drizzle-orm';

// Test data
const testPromptInput: CreatePromptInput = {
  title: 'Test Prompt',
  content: 'This is a test prompt for deletion',
  type: 'chatgpt',
  is_template: false,
  template_variables: null
};

const testTagInput: CreateTagInput = {
  name: 'Test Tag',
  color: '#ff0000'
};

describe('deletePrompt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing prompt', async () => {
    // Create a prompt to delete
    const insertResult = await db.insert(promptsTable)
      .values({
        title: testPromptInput.title,
        content: testPromptInput.content,
        type: testPromptInput.type,
        is_template: testPromptInput.is_template,
        template_variables: testPromptInput.template_variables
      })
      .returning()
      .execute();

    const createdPrompt = insertResult[0];

    // Delete the prompt
    const result = await deletePrompt(createdPrompt.id);

    expect(result.success).toBe(true);

    // Verify the prompt was deleted
    const remainingPrompts = await db.select()
      .from(promptsTable)
      .where(eq(promptsTable.id, createdPrompt.id))
      .execute();

    expect(remainingPrompts).toHaveLength(0);
  });

  it('should return false when deleting non-existent prompt', async () => {
    const nonExistentId = 999999;

    const result = await deletePrompt(nonExistentId);

    expect(result.success).toBe(false);
  });

  it('should cascade delete prompt-tag relationships', async () => {
    // Create a tag first
    const tagResult = await db.insert(tagsTable)
      .values({
        name: testTagInput.name,
        color: testTagInput.color
      })
      .returning()
      .execute();

    const createdTag = tagResult[0];

    // Create a prompt
    const promptResult = await db.insert(promptsTable)
      .values({
        title: testPromptInput.title,
        content: testPromptInput.content,
        type: testPromptInput.type,
        is_template: testPromptInput.is_template,
        template_variables: testPromptInput.template_variables
      })
      .returning()
      .execute();

    const createdPrompt = promptResult[0];

    // Create prompt-tag relationship
    await db.insert(promptTagsTable)
      .values({
        prompt_id: createdPrompt.id,
        tag_id: createdTag.id
      })
      .execute();

    // Verify relationship exists
    const relationshipsBefore = await db.select()
      .from(promptTagsTable)
      .where(eq(promptTagsTable.prompt_id, createdPrompt.id))
      .execute();

    expect(relationshipsBefore).toHaveLength(1);

    // Delete the prompt
    const result = await deletePrompt(createdPrompt.id);

    expect(result.success).toBe(true);

    // Verify the prompt-tag relationship was also deleted (cascade)
    const relationshipsAfter = await db.select()
      .from(promptTagsTable)
      .where(eq(promptTagsTable.prompt_id, createdPrompt.id))
      .execute();

    expect(relationshipsAfter).toHaveLength(0);

    // Verify the tag still exists (should not be deleted)
    const remainingTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, createdTag.id))
      .execute();

    expect(remainingTags).toHaveLength(1);
  });

  it('should not affect other prompts when deleting one', async () => {
    // Create two prompts
    const prompt1Result = await db.insert(promptsTable)
      .values({
        title: 'Prompt 1',
        content: 'First prompt content',
        type: 'chatgpt',
        is_template: false,
        template_variables: null
      })
      .returning()
      .execute();

    const prompt2Result = await db.insert(promptsTable)
      .values({
        title: 'Prompt 2',
        content: 'Second prompt content',
        type: 'midjourney',
        is_template: true,
        template_variables: ['var1', 'var2']
      })
      .returning()
      .execute();

    const prompt1 = prompt1Result[0];
    const prompt2 = prompt2Result[0];

    // Delete first prompt
    const result = await deletePrompt(prompt1.id);

    expect(result.success).toBe(true);

    // Verify first prompt is deleted
    const deletedPrompts = await db.select()
      .from(promptsTable)
      .where(eq(promptsTable.id, prompt1.id))
      .execute();

    expect(deletedPrompts).toHaveLength(0);

    // Verify second prompt still exists
    const remainingPrompts = await db.select()
      .from(promptsTable)
      .where(eq(promptsTable.id, prompt2.id))
      .execute();

    expect(remainingPrompts).toHaveLength(1);
    expect(remainingPrompts[0].title).toBe('Prompt 2');
  });
});
