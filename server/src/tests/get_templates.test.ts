
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promptsTable, tagsTable, promptTagsTable } from '../db/schema';
import { getTemplates } from '../handlers/get_templates';

describe('getTemplates', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no templates exist', async () => {
    const result = await getTemplates();
    expect(result).toEqual([]);
  });

  it('should return template prompts only', async () => {
    // Create a template prompt
    const templateResult = await db.insert(promptsTable)
      .values({
        title: 'Template Prompt',
        content: 'This is a template with {{variable}}',
        type: 'chatgpt',
        is_template: true,
        template_variables: ['variable']
      })
      .returning()
      .execute();

    // Create a non-template prompt
    await db.insert(promptsTable)
      .values({
        title: 'Regular Prompt',
        content: 'This is not a template',
        type: 'chatgpt',
        is_template: false,
        template_variables: null
      })
      .returning()
      .execute();

    const result = await getTemplates();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Template Prompt');
    expect(result[0].is_template).toBe(true);
    expect(result[0].template_variables).toEqual(['variable']);
    expect(result[0].tags).toEqual([]);
  });

  it('should return templates with associated tags', async () => {
    // Create tags
    const tag1Result = await db.insert(tagsTable)
      .values({
        name: 'AI',
        color: '#blue'
      })
      .returning()
      .execute();

    const tag2Result = await db.insert(tagsTable)
      .values({
        name: 'Productivity',
        color: '#green'
      })
      .returning()
      .execute();

    // Create template prompt
    const templateResult = await db.insert(promptsTable)
      .values({
        title: 'AI Template',
        content: 'Generate {{content}} using AI',
        type: 'chatgpt',
        is_template: true,
        template_variables: ['content']
      })
      .returning()
      .execute();

    // Associate tags with template
    await db.insert(promptTagsTable)
      .values([
        {
          prompt_id: templateResult[0].id,
          tag_id: tag1Result[0].id
        },
        {
          prompt_id: templateResult[0].id,
          tag_id: tag2Result[0].id
        }
      ])
      .execute();

    const result = await getTemplates();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('AI Template');
    expect(result[0].tags).toHaveLength(2);
    
    const tagNames = result[0].tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['AI', 'Productivity']);
    
    const tagColors = result[0].tags.map(tag => tag.color).sort();
    expect(tagColors).toEqual(['#blue', '#green']);
  });

  it('should return multiple templates with their respective tags', async () => {
    // Create tags
    const tag1Result = await db.insert(tagsTable)
      .values({ name: 'Writing', color: '#red' })
      .returning()
      .execute();

    const tag2Result = await db.insert(tagsTable)
      .values({ name: 'Marketing', color: '#yellow' })
      .returning()
      .execute();

    // Create first template
    const template1Result = await db.insert(promptsTable)
      .values({
        title: 'Writing Template',
        content: 'Write about {{topic}}',
        type: 'chatgpt',
        is_template: true,
        template_variables: ['topic']
      })
      .returning()
      .execute();

    // Create second template
    const template2Result = await db.insert(promptsTable)
      .values({
        title: 'Marketing Template',
        content: 'Create marketing content for {{product}}',
        type: 'midjourney',
        is_template: true,
        template_variables: ['product']
      })
      .returning()
      .execute();

    // Associate tags
    await db.insert(promptTagsTable)
      .values([
        { prompt_id: template1Result[0].id, tag_id: tag1Result[0].id },
        { prompt_id: template2Result[0].id, tag_id: tag2Result[0].id }
      ])
      .execute();

    const result = await getTemplates();

    expect(result).toHaveLength(2);
    
    const titles = result.map(template => template.title).sort();
    expect(titles).toEqual(['Marketing Template', 'Writing Template']);

    // Check each template has correct tags
    result.forEach(template => {
      expect(template.tags).toHaveLength(1);
      if (template.title === 'Writing Template') {
        expect(template.tags[0].name).toEqual('Writing');
        expect(template.type).toEqual('chatgpt');
      } else {
        expect(template.tags[0].name).toEqual('Marketing');
        expect(template.type).toEqual('midjourney');
      }
    });
  });

  it('should handle templates with null template_variables', async () => {
    // Create template with null template_variables
    await db.insert(promptsTable)
      .values({
        title: 'Simple Template',
        content: 'Simple template content',
        type: 'chatgpt',
        is_template: true,
        template_variables: null
      })
      .returning()
      .execute();

    const result = await getTemplates();

    expect(result).toHaveLength(1);
    expect(result[0].template_variables).toEqual([]);
    expect(result[0].tags).toEqual([]);
  });
});
