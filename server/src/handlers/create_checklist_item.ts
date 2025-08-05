
import { db } from '../db';
import { checklistItemsTable } from '../db/schema';
import { type CreateChecklistItemInput, type ChecklistItem } from '../schema';

export const createChecklistItem = async (input: CreateChecklistItemInput): Promise<ChecklistItem> => {
  try {
    // Insert checklist item record
    const result = await db.insert(checklistItemsTable)
      .values({
        category: input.category,
        item_name: input.item_name,
        description: input.description,
        is_active: input.is_active
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Checklist item creation failed:', error);
    throw error;
  }
};
