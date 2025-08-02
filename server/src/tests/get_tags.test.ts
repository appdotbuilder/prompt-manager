
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { getTags } from '../handlers/get_tags';

describe('getTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tags exist', async () => {
    const result = await getTags();
    expect(result).toEqual([]);
  });

  it('should return all tags', async () => {
    // Create test tags
    await db.insert(tagsTable)
      .values([
        { name: 'AI', color: '#ff0000' },
        { name: 'ChatGPT', color: '#00ff00' },
        { name: 'Midjourney', color: null }
      ])
      .execute();

    const result = await getTags();

    expect(result).toHaveLength(3);
    
    // Check that all tags are returned with proper structure
    const tagNames = result.map(tag => tag.name);
    expect(tagNames).toContain('AI');
    expect(tagNames).toContain('ChatGPT');
    expect(tagNames).toContain('Midjourney');

    // Verify field types and structure
    result.forEach(tag => {
      expect(tag.id).toBeNumber();
      expect(tag.name).toBeString();
      expect(tag.created_at).toBeInstanceOf(Date);
      // color can be string or null
      expect(typeof tag.color === 'string' || tag.color === null).toBe(true);
    });
  });

  it('should handle tags with null colors', async () => {
    await db.insert(tagsTable)
      .values([
        { name: 'No Color Tag', color: null },
        { name: 'Red Tag', color: '#ff0000' }
      ])
      .execute();

    const result = await getTags();

    expect(result).toHaveLength(2);
    
    const noColorTag = result.find(tag => tag.name === 'No Color Tag');
    const redTag = result.find(tag => tag.name === 'Red Tag');

    expect(noColorTag?.color).toBeNull();
    expect(redTag?.color).toEqual('#ff0000');
  });
});
