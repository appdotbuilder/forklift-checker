
import { db } from '../db';
import { dailyInspectionsTable } from '../db/schema';
import { type GetInspectionHistoryInput, type DailyInspection } from '../schema';
import { eq, gte, lte, and, desc, type SQL } from 'drizzle-orm';

export const getInspectionHistory = async (input: GetInspectionHistoryInput): Promise<DailyInspection[]> => {
  try {
    // Build conditions array for optional filters
    const conditions: SQL<unknown>[] = [];

    if (input.forklift_id !== undefined) {
      conditions.push(eq(dailyInspectionsTable.forklift_id, input.forklift_id));
    }

    if (input.start_date !== undefined) {
      conditions.push(gte(dailyInspectionsTable.inspection_date, input.start_date));
    }

    if (input.end_date !== undefined) {
      conditions.push(lte(dailyInspectionsTable.inspection_date, input.end_date));
    }

    if (input.status !== undefined) {
      conditions.push(eq(dailyInspectionsTable.overall_status, input.status));
    }

    // Build the complete query in one go
    const results = await db.select()
      .from(dailyInspectionsTable)
      .where(conditions.length === 0 ? undefined : 
             conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(dailyInspectionsTable.inspection_date))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(inspection => ({
      ...inspection,
      hours_meter: inspection.hours_meter ? parseFloat(inspection.hours_meter) : null
    }));
  } catch (error) {
    console.error('Get inspection history failed:', error);
    throw error;
  }
};
