
import { z } from 'zod';

// User roles enum
export const userRoleSchema = z.enum(['operator', 'mechanic', 'supervisor']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  full_name: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date()
});
export type User = z.infer<typeof userSchema>;

// Forklift schema
export const forkliftSchema = z.object({
  id: z.number(),
  unit_number: z.string(),
  brand: z.string(),
  model: z.string(),
  year: z.number().int(),
  serial_number: z.string(),
  status: z.enum(['active', 'maintenance', 'inactive']),
  created_at: z.coerce.date()
});
export type Forklift = z.infer<typeof forkliftSchema>;

// Checklist item schema
export const checklistItemSchema = z.object({
  id: z.number(),
  category: z.string(),
  item_name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

// Daily inspection schema
export const dailyInspectionSchema = z.object({
  id: z.number(),
  forklift_id: z.number(),
  operator_id: z.number(),
  inspection_date: z.coerce.date(),
  shift: z.enum(['morning', 'afternoon', 'night']),
  hours_meter: z.number().nullable(),
  fuel_level: z.number().min(0).max(100).nullable(),
  overall_status: z.enum(['pass', 'fail', 'needs_attention']),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});
export type DailyInspection = z.infer<typeof dailyInspectionSchema>;

// Inspection result schema
export const inspectionResultSchema = z.object({
  id: z.number(),
  inspection_id: z.number(),
  checklist_item_id: z.number(),
  status: z.enum(['ok', 'defect', 'not_applicable']),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});
export type InspectionResult = z.infer<typeof inspectionResultSchema>;

// Input schemas for creating records
export const createUserInputSchema = z.object({
  username: z.string().min(3),
  full_name: z.string().min(1),
  role: userRoleSchema
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createForkliftInputSchema = z.object({
  unit_number: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  serial_number: z.string().min(1),
  status: z.enum(['active', 'maintenance', 'inactive']).default('active')
});
export type CreateForkliftInput = z.infer<typeof createForkliftInputSchema>;

export const createChecklistItemInputSchema = z.object({
  category: z.string().min(1),
  item_name: z.string().min(1),
  description: z.string().nullable(),
  is_active: z.boolean().default(true)
});
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemInputSchema>;

export const createDailyInspectionInputSchema = z.object({
  forklift_id: z.number(),
  operator_id: z.number(),
  inspection_date: z.coerce.date(),
  shift: z.enum(['morning', 'afternoon', 'night']),
  hours_meter: z.number().nullable(),
  fuel_level: z.number().min(0).max(100).nullable(),
  notes: z.string().nullable(),
  checklist_results: z.array(z.object({
    checklist_item_id: z.number(),
    status: z.enum(['ok', 'defect', 'not_applicable']),
    notes: z.string().nullable()
  }))
});
export type CreateDailyInspectionInput = z.infer<typeof createDailyInspectionInputSchema>;

// Query input schemas
export const getInspectionHistoryInputSchema = z.object({
  forklift_id: z.number().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  status: z.enum(['pass', 'fail', 'needs_attention']).optional()
});
export type GetInspectionHistoryInput = z.infer<typeof getInspectionHistoryInputSchema>;

export const getForkliftStatusInputSchema = z.object({
  status: z.enum(['active', 'maintenance', 'inactive']).optional()
});
export type GetForkliftStatusInput = z.infer<typeof getForkliftStatusInputSchema>;
