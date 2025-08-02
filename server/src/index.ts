
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createTagInputSchema, 
  updateTagInputSchema,
  createPromptInputSchema,
  updatePromptInputSchema,
  createPromptComponentInputSchema,
  updatePromptComponentInputSchema,
  generatePromptInputSchema,
  jsonEditorInputSchema
} from './schema';

// Import handlers
import { createTag } from './handlers/create_tag';
import { getTags } from './handlers/get_tags';
import { updateTag } from './handlers/update_tag';
import { deleteTag } from './handlers/delete_tag';
import { createPrompt } from './handlers/create_prompt';
import { getPrompts } from './handlers/get_prompts';
import { getPromptById } from './handlers/get_prompt_by_id';
import { updatePrompt } from './handlers/update_prompt';
import { deletePrompt } from './handlers/delete_prompt';
import { createPromptComponent } from './handlers/create_prompt_component';
import { getPromptComponents } from './handlers/get_prompt_components';
import { getPromptComponentsByType } from './handlers/get_prompt_components_by_type';
import { updatePromptComponent } from './handlers/update_prompt_component';
import { deletePromptComponent } from './handlers/delete_prompt_component';
import { generatePrompt } from './handlers/generate_prompt';
import { getTemplates } from './handlers/get_templates';
import { validateJsonPrompt } from './handlers/validate_json_prompt';
import { importJsonPrompt } from './handlers/import_json_prompt';
import { exportPromptJson } from './handlers/export_prompt_json';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Tag operations
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),
  getTags: publicProcedure
    .query(() => getTags()),
  updateTag: publicProcedure
    .input(updateTagInputSchema)
    .mutation(({ input }) => updateTag(input)),
  deleteTag: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTag(input.id)),

  // Prompt operations
  createPrompt: publicProcedure
    .input(createPromptInputSchema)
    .mutation(({ input }) => createPrompt(input)),
  getPrompts: publicProcedure
    .query(() => getPrompts()),
  getPromptById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getPromptById(input.id)),
  updatePrompt: publicProcedure
    .input(updatePromptInputSchema)
    .mutation(({ input }) => updatePrompt(input)),
  deletePrompt: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePrompt(input.id)),

  // Prompt component operations
  createPromptComponent: publicProcedure
    .input(createPromptComponentInputSchema)
    .mutation(({ input }) => createPromptComponent(input)),
  getPromptComponents: publicProcedure
    .query(() => getPromptComponents()),
  getPromptComponentsByType: publicProcedure
    .input(z.object({ type: z.enum(['chatgpt', 'midjourney']) }))
    .query(({ input }) => getPromptComponentsByType(input.type)),
  updatePromptComponent: publicProcedure
    .input(updatePromptComponentInputSchema)
    .mutation(({ input }) => updatePromptComponent(input)),
  deletePromptComponent: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePromptComponent(input.id)),

  // Template and generator operations
  getTemplates: publicProcedure
    .query(() => getTemplates()),
  generatePrompt: publicProcedure
    .input(generatePromptInputSchema)
    .mutation(({ input }) => generatePrompt(input)),

  // JSON editor operations
  validateJsonPrompt: publicProcedure
    .input(jsonEditorInputSchema)
    .mutation(({ input }) => validateJsonPrompt(input)),
  importJsonPrompt: publicProcedure
    .input(jsonEditorInputSchema)
    .mutation(({ input }) => importJsonPrompt(input)),
  exportPromptJson: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => exportPromptJson(input.id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
