
import { serial, text, pgTable, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for prompt types
export const promptTypeEnum = pgEnum('prompt_type', ['chatgpt', 'midjourney']);

// Tags table
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Prompts table
export const promptsTable = pgTable('prompts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: promptTypeEnum('type').notNull(),
  is_template: boolean('is_template').default(false).notNull(),
  template_variables: jsonb('template_variables').$type<string[]>(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Prompt components table for building prompts
export const promptComponentsTable = pgTable('prompt_components', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  type: promptTypeEnum('type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Junction table for prompt-tag relationships
export const promptTagsTable = pgTable('prompt_tags', {
  id: serial('id').primaryKey(),
  prompt_id: integer('prompt_id').notNull().references(() => promptsTable.id, { onDelete: 'cascade' }),
  tag_id: integer('tag_id').notNull().references(() => tagsTable.id, { onDelete: 'cascade' }),
});

// Relations
export const tagsRelations = relations(tagsTable, ({ many }) => ({
  promptTags: many(promptTagsTable),
}));

export const promptsRelations = relations(promptsTable, ({ many }) => ({
  promptTags: many(promptTagsTable),
}));

export const promptTagsRelations = relations(promptTagsTable, ({ one }) => ({
  prompt: one(promptsTable, {
    fields: [promptTagsTable.prompt_id],
    references: [promptsTable.id],
  }),
  tag: one(tagsTable, {
    fields: [promptTagsTable.tag_id],
    references: [tagsTable.id],
  }),
}));

export const promptComponentsRelations = relations(promptComponentsTable, ({ many }) => ({}));

// TypeScript types for the table schemas
export type Tag = typeof tagsTable.$inferSelect;
export type NewTag = typeof tagsTable.$inferInsert;
export type Prompt = typeof promptsTable.$inferSelect;
export type NewPrompt = typeof promptsTable.$inferInsert;
export type PromptComponent = typeof promptComponentsTable.$inferSelect;
export type NewPromptComponent = typeof promptComponentsTable.$inferInsert;
export type PromptTag = typeof promptTagsTable.$inferSelect;
export type NewPromptTag = typeof promptTagsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  tags: tagsTable, 
  prompts: promptsTable, 
  promptComponents: promptComponentsTable,
  promptTags: promptTagsTable
};
