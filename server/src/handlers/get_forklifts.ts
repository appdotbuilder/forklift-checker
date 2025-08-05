
import { db } from '../db';
import { forkliftsTable } from '../db/schema';
import { type Forklift, type GetForkliftStatusInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getForklifts = async (input?: GetForkliftStatusInput): Promise<Forklift[]> => {
  try {
    // Apply status filter if provided
    if (input?.status) {
      const results = await db.select()
        .from(forkliftsTable)
        .where(eq(forkliftsTable.status, input.status))
        .execute();
      return results;
    }

    // Return all forklifts if no filter
    const results = await db.select()
      .from(forkliftsTable)
      .execute();
    return results;
  } catch (error) {
    console.error('Failed to fetch forklifts:', error);
    throw error;
  }
};
