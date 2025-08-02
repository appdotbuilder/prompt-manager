
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type UpdateTagInput } from '../schema';
import { updateTag } from '../handlers/update_tag';
import { eq } from 'drizzle-orm';

describe('updateTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update tag name only', async () => {
    // Create a tag directly using database
    const [createdTag] = await db.insert(tagsTable)
      .values({
        name: 'Original Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();

    // Update only the name
    const updateInput: UpdateTagInput = {
      id: createdTag.id,
      name: 'Updated Tag Name'
    };

    const result = await updateTag(updateInput);

    expect(result.id).toEqual(createdTag.id);
    expect(result.name).toEqual('Updated Tag Name');
    expect(result.color).toEqual('#ff0000'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update tag color only', async () => {
    // Create a tag directly using database
    const [createdTag] = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();

    // Update only the color
    const updateInput: UpdateTagInput = {
      id: createdTag.id,
      color: '#00ff00'
    };

    const result = await updateTag(updateInput);

    expect(result.id).toEqual(createdTag.id);
    expect(result.name).toEqual('Test Tag'); // Should remain unchanged
    expect(result.color).toEqual('#00ff00');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and color', async () => {
    // Create a tag directly using database
    const [createdTag] = await db.insert(tagsTable)
      .values({
        name: 'Original Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();

    // Update both fields
    const updateInput: UpdateTagInput = {
      id: createdTag.id,
      name: 'Updated Tag',
      color: '#0000ff'
    };

    const result = await updateTag(updateInput);

    expect(result.id).toEqual(createdTag.id);
    expect(result.name).toEqual('Updated Tag');
    expect(result.color).toEqual('#0000ff');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set color to null', async () => {
    // Create a tag with color directly using database
    const [createdTag] = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();

    // Update color to null
    const updateInput: UpdateTagInput = {
      id: createdTag.id,
      color: null
    };

    const result = await updateTag(updateInput);

    expect(result.id).toEqual(createdTag.id);
    expect(result.name).toEqual('Test Tag'); // Should remain unchanged
    expect(result.color).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create a tag directly using database
    const [createdTag] = await db.insert(tagsTable)
      .values({
        name: 'Original Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();

    // Update the tag
    const updateInput: UpdateTagInput = {
      id: createdTag.id,
      name: 'Database Updated Tag',
      color: '#00ff00'
    };

    await updateTag(updateInput);

    // Verify changes were saved to database
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, createdTag.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Database Updated Tag');
    expect(tags[0].color).toEqual('#00ff00');
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when tag not found', async () => {
    const updateInput: UpdateTagInput = {
      id: 99999, // Non-existent ID
      name: 'Updated Tag'
    };

    await expect(updateTag(updateInput)).rejects.toThrow(/tag with id 99999 not found/i);
  });

  it('should handle tag with null color initially', async () => {
    // Create a tag with null color directly using database
    const [createdTag] = await db.insert(tagsTable)
      .values({
        name: 'Null Color Tag',
        color: null
      })
      .returning()
      .execute();

    // Update name only
    const updateInput: UpdateTagInput = {
      id: createdTag.id,
      name: 'Updated Null Color Tag'
    };

    const result = await updateTag(updateInput);

    expect(result.id).toEqual(createdTag.id);
    expect(result.name).toEqual('Updated Null Color Tag');
    expect(result.color).toBeNull(); // Should remain null
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
