
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import { 
    createUserInputSchema,
    createForkliftInputSchema,
    createChecklistItemInputSchema,
    createDailyInspectionInputSchema,
    getInspectionHistoryInputSchema,
    getForkliftStatusInputSchema
} from './schema';

// Handler imports
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createForklift } from './handlers/create_forklift';
import { getForklifts } from './handlers/get_forklifts';
import { createChecklistItem } from './handlers/create_checklist_item';
import { getChecklistItems } from './handlers/get_checklist_items';
import { createDailyInspection } from './handlers/create_daily_inspection';
import { getInspectionHistory } from './handlers/get_inspection_history';
import { getInspectionDetails } from './handlers/get_inspection_details';
import { getForkliftStatusSummary } from './handlers/get_forklift_status_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Forklift management routes
  createForklift: publicProcedure
    .input(createForkliftInputSchema)
    .mutation(({ input }) => createForklift(input)),
  
  getForklifts: publicProcedure
    .input(getForkliftStatusInputSchema.optional())
    .query(({ input }) => getForklifts(input)),

  // Checklist management routes
  createChecklistItem: publicProcedure
    .input(createChecklistItemInputSchema)
    .mutation(({ input }) => createChecklistItem(input)),
  
  getChecklistItems: publicProcedure
    .query(() => getChecklistItems()),

  // Inspection routes
  createDailyInspection: publicProcedure
    .input(createDailyInspectionInputSchema)
    .mutation(({ input }) => createDailyInspection(input)),
  
  getInspectionHistory: publicProcedure
    .input(getInspectionHistoryInputSchema)
    .query(({ input }) => getInspectionHistory(input)),
  
  getInspectionDetails: publicProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(({ input }) => getInspectionDetails(input.inspectionId)),

  // Supervisor dashboard routes
  getForkliftStatusSummary: publicProcedure
    .query(() => getForkliftStatusSummary()),
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
