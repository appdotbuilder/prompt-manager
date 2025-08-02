
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

// Simple test inputs
const testInput: CreateTagInput = {
  name: 'Test Tag',
  color: '#FF0000'
};

const testInputWithoutColor: CreateTagInput = {
  name: 'Test Tag No Color',
  color: null
};

describe('createTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a tag with color', async () => {
    const result = await createTag(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Tag');
    expect(result.color).toEqual('#FF0000');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a tag without color', async () => {
    const result = await createTag(testInputWithoutColor);

    // Basic field validation
    expect(result.name).toEqual('Test Tag No Color');
    expect(result.color).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save tag to database', async () => {
    const result = await createTag(testInput);

    // Query using proper drizzle syntax
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Test Tag');
    expect(tags[0].color).toEqual('#FF0000');
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should save tag with null color to database', async () => {
    const result = await createTag(testInputWithoutColor);

    // Query using proper drizzle syntax
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Test Tag No Color');
    expect(tags[0].color).toBeNull();
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });
});
