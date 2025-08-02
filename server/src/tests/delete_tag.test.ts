
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { deleteTag } from '../handlers/delete_tag';
import { eq } from 'drizzle-orm';

// Test input for creating tags
const testTagInput: CreateTagInput = {
  name: 'Test Tag',
  color: '#FF0000'
};

describe('deleteTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing tag', async () => {
    // Create a tag first
    const [createdTag] = await db.insert(tagsTable)
      .values({
        name: testTagInput.name,
        color: testTagInput.color
      })
      .returning()
      .execute();

    // Delete the tag
    const result = await deleteTag(createdTag.id);

    // Should return success
    expect(result.success).toBe(true);

    // Verify tag was deleted from database
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, createdTag.id))
      .execute();

    expect(tags).toHaveLength(0);
  });

  it('should return false for non-existent tag', async () => {
    // Try to delete a tag that doesn't exist
    const result = await deleteTag(999);

    // Should return failure
    expect(result.success).toBe(false);
  });

  it('should handle multiple tag deletions correctly', async () => {
    // Create multiple tags
    const [tag1] = await db.insert(tagsTable)
      .values({
        name: 'Tag 1',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const [tag2] = await db.insert(tagsTable)
      .values({
        name: 'Tag 2',
        color: '#00FF00'
      })
      .returning()
      .execute();

    // Delete first tag
    const result1 = await deleteTag(tag1.id);
    expect(result1.success).toBe(true);

    // Verify only first tag was deleted
    const remainingTags = await db.select()
      .from(tagsTable)
      .execute();

    expect(remainingTags).toHaveLength(1);
    expect(remainingTags[0].id).toBe(tag2.id);
    expect(remainingTags[0].name).toBe('Tag 2');

    // Delete second tag
    const result2 = await deleteTag(tag2.id);
    expect(result2.success).toBe(true);

    // Verify all tags are deleted
    const allTags = await db.select()
      .from(tagsTable)
      .execute();

    expect(allTags).toHaveLength(0);
  });
});
