
import { db } from '../db';
import { dailyInspectionsTable, inspectionResultsTable, usersTable, forkliftsTable, checklistItemsTable } from '../db/schema';
import { type CreateDailyInspectionInput, type DailyInspection } from '../schema';
import { eq } from 'drizzle-orm';

export const createDailyInspection = async (input: CreateDailyInspectionInput): Promise<DailyInspection> => {
  try {
    // Verify forklift exists
    const forklift = await db.select()
      .from(forkliftsTable)
      .where(eq(forkliftsTable.id, input.forklift_id))
      .execute();
    
    if (forklift.length === 0) {
      throw new Error(`Forklift with id ${input.forklift_id} not found`);
    }

    // Verify operator exists
    const operator = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.operator_id))
      .execute();
    
    if (operator.length === 0) {
      throw new Error(`User with id ${input.operator_id} not found`);
    }

    // Verify all checklist items exist
    const checklistItemIds = input.checklist_results.map(result => result.checklist_item_id);
    const existingItems = await db.select()
      .from(checklistItemsTable)
      .execute();
    
    const existingItemIds = existingItems.map(item => item.id);
    
    for (const itemId of checklistItemIds) {
      if (!existingItemIds.includes(itemId)) {
        throw new Error(`Checklist item with id ${itemId} not found`);
      }
    }

    // Calculate overall status based on checklist results
    const hasDefect = input.checklist_results.some(result => result.status === 'defect');
    const overall_status = hasDefect ? 'fail' : 'pass';

    // Create the daily inspection record
    const inspectionResult = await db.insert(dailyInspectionsTable)
      .values({
        forklift_id: input.forklift_id,
        operator_id: input.operator_id,
        inspection_date: input.inspection_date,
        shift: input.shift,
        hours_meter: input.hours_meter ? input.hours_meter.toString() : null,
        fuel_level: input.fuel_level,
        overall_status,
        notes: input.notes
      })
      .returning()
      .execute();

    const inspection = inspectionResult[0];

    // Create inspection results for each checklist item
    if (input.checklist_results.length > 0) {
      await db.insert(inspectionResultsTable)
        .values(
          input.checklist_results.map(result => ({
            inspection_id: inspection.id,
            checklist_item_id: result.checklist_item_id,
            status: result.status,
            notes: result.notes
          }))
        )
        .execute();
    }

    // Return the inspection with numeric conversion
    return {
      ...inspection,
      hours_meter: inspection.hours_meter ? parseFloat(inspection.hours_meter) : null
    };
  } catch (error) {
    console.error('Daily inspection creation failed:', error);
    throw error;
  }
};
