
import { db } from '../db';
import { checklistItemsTable } from '../db/schema';
import { type ChecklistItem } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getChecklistItems = async (): Promise<ChecklistItem[]> => {
  try {
    const results = await db.select()
      .from(checklistItemsTable)
      .where(eq(checklistItemsTable.is_active, true))
      .orderBy(asc(checklistItemsTable.category), asc(checklistItemsTable.item_name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch checklist items:', error);
    throw error;
  }
};
