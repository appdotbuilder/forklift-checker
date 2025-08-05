
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['operator', 'mechanic', 'supervisor']);
export const forkliftStatusEnum = pgEnum('forklift_status', ['active', 'maintenance', 'inactive']);
export const shiftEnum = pgEnum('shift', ['morning', 'afternoon', 'night']);
export const inspectionStatusEnum = pgEnum('inspection_status', ['pass', 'fail', 'needs_attention']);
export const checklistStatusEnum = pgEnum('checklist_status', ['ok', 'defect', 'not_applicable']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  full_name: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Forklifts table
export const forkliftsTable = pgTable('forklifts', {
  id: serial('id').primaryKey(),
  unit_number: text('unit_number').notNull().unique(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  serial_number: text('serial_number').notNull(),
  status: forkliftStatusEnum('status').notNull().default('active'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Checklist items table
export const checklistItemsTable = pgTable('checklist_items', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  item_name: text('item_name').notNull(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Daily inspections table
export const dailyInspectionsTable = pgTable('daily_inspections', {
  id: serial('id').primaryKey(),
  forklift_id: integer('forklift_id').notNull(),
  operator_id: integer('operator_id').notNull(),
  inspection_date: timestamp('inspection_date').notNull(),
  shift: shiftEnum('shift').notNull(),
  hours_meter: numeric('hours_meter', { precision: 10, scale: 2 }),
  fuel_level: integer('fuel_level'), // 0-100 percentage
  overall_status: inspectionStatusEnum('overall_status').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Inspection results table
export const inspectionResultsTable = pgTable('inspection_results', {
  id: serial('id').primaryKey(),
  inspection_id: integer('inspection_id').notNull(),
  checklist_item_id: integer('checklist_item_id').notNull(),
  status: checklistStatusEnum('status').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  inspections: many(dailyInspectionsTable),
}));

export const forkliftsRelations = relations(forkliftsTable, ({ many }) => ({
  inspections: many(dailyInspectionsTable),
}));

export const dailyInspectionsRelations = relations(dailyInspectionsTable, ({ one, many }) => ({
  forklift: one(forkliftsTable, {
    fields: [dailyInspectionsTable.forklift_id],
    references: [forkliftsTable.id],
  }),
  operator: one(usersTable, {
    fields: [dailyInspectionsTable.operator_id],
    references: [usersTable.id],
  }),
  results: many(inspectionResultsTable),
}));

export const inspectionResultsRelations = relations(inspectionResultsTable, ({ one }) => ({
  inspection: one(dailyInspectionsTable, {
    fields: [inspectionResultsTable.inspection_id],
    references: [dailyInspectionsTable.id],
  }),
  checklistItem: one(checklistItemsTable, {
    fields: [inspectionResultsTable.checklist_item_id],
    references: [checklistItemsTable.id],
  }),
}));

export const checklistItemsRelations = relations(checklistItemsTable, ({ many }) => ({
  results: many(inspectionResultsTable),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Forklift = typeof forkliftsTable.$inferSelect;
export type NewForklift = typeof forkliftsTable.$inferInsert;
export type ChecklistItem = typeof checklistItemsTable.$inferSelect;
export type NewChecklistItem = typeof checklistItemsTable.$inferInsert;
export type DailyInspection = typeof dailyInspectionsTable.$inferSelect;
export type NewDailyInspection = typeof dailyInspectionsTable.$inferInsert;
export type InspectionResult = typeof inspectionResultsTable.$inferSelect;
export type NewInspectionResult = typeof inspectionResultsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  forklifts: forkliftsTable,
  checklistItems: checklistItemsTable,
  dailyInspections: dailyInspectionsTable,
  inspectionResults: inspectionResultsTable,
};
