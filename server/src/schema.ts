
import { z } from 'zod';

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Tag = z.infer<typeof tagSchema>;

// Prompt schema
export const promptSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  type: z.enum(['chatgpt', 'midjourney']),
  is_template: z.boolean(),
  template_variables: z.array(z.string()).nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Prompt = z.infer<typeof promptSchema>;

// Prompt component schema for building prompts
export const promptComponentSchema = z.object({
  id: z.number(),
  name: z.string(),
  content: z.string(),
  category: z.string(),
  type: z.enum(['chatgpt', 'midjourney']),
  created_at: z.coerce.date()
});

export type PromptComponent = z.infer<typeof promptComponentSchema>;

// Input schemas for creating
export const createTagInputSchema = z.object({
  name: z.string().min(1),
  color: z.string().nullable()
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const createPromptInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['chatgpt', 'midjourney']),
  is_template: z.boolean().default(false),
  template_variables: z.array(z.string()).nullable(),
  tag_ids: z.array(z.number()).optional()
});

export type CreatePromptInput = z.infer<typeof createPromptInputSchema>;

export const createPromptComponentInputSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  type: z.enum(['chatgpt', 'midjourney'])
});

export type CreatePromptComponentInput = z.infer<typeof createPromptComponentInputSchema>;

// Input schemas for updating
export const updateTagInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  color: z.string().nullable().optional()
});

export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

export const updatePromptInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(['chatgpt', 'midjourney']).optional(),
  is_template: z.boolean().optional(),
  template_variables: z.array(z.string()).nullable().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type UpdatePromptInput = z.infer<typeof updatePromptInputSchema>;

export const updatePromptComponentInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  type: z.enum(['chatgpt', 'midjourney']).optional()
});

export type UpdatePromptComponentInput = z.infer<typeof updatePromptComponentInputSchema>;

// Generator input schema
export const generatePromptInputSchema = z.object({
  template_id: z.number(),
  variables: z.record(z.string()).optional(),
  component_ids: z.array(z.number()).optional()
});

export type GeneratePromptInput = z.infer<typeof generatePromptInputSchema>;

// JSON editor input schema
export const jsonEditorInputSchema = z.object({
  prompt_data: z.record(z.any())
});

export type JsonEditorInput = z.infer<typeof jsonEditorInputSchema>;

// Response schemas with relations
export const promptWithTagsSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  type: z.enum(['chatgpt', 'midjourney']),
  is_template: z.boolean(),
  template_variables: z.array(z.string()).nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  tags: z.array(tagSchema)
});

export type PromptWithTags = z.infer<typeof promptWithTagsSchema>;
