
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { checklistItemsTable } from '../db/schema';
import { type CreateChecklistItemInput } from '../schema';
import { createChecklistItem } from '../handlers/create_checklist_item';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateChecklistItemInput = {
  category: 'Engine',
  item_name: 'Check oil level',
  description: 'Verify engine oil is at proper level',
  is_active: true
};

describe('createChecklistItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a checklist item', async () => {
    const result = await createChecklistItem(testInput);

    // Basic field validation
    expect(result.category).toEqual('Engine');
    expect(result.item_name).toEqual('Check oil level');
    expect(result.description).toEqual('Verify engine oil is at proper level');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save checklist item to database', async () => {
    const result = await createChecklistItem(testInput);

    // Query using proper drizzle syntax
    const items = await db.select()
      .from(checklistItemsTable)
      .where(eq(checklistItemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].category).toEqual('Engine');
    expect(items[0].item_name).toEqual('Check oil level');
    expect(items[0].description).toEqual('Verify engine oil is at proper level');
    expect(items[0].is_active).toEqual(true);
    expect(items[0].created_at).toBeInstanceOf(Date);
  });

  it('should create checklist item with null description', async () => {
    const inputWithNullDescription: CreateChecklistItemInput = {
      category: 'Safety',
      item_name: 'Check seatbelt',
      description: null,
      is_active: true
    };

    const result = await createChecklistItem(inputWithNullDescription);

    expect(result.category).toEqual('Safety');
    expect(result.item_name).toEqual('Check seatbelt');
    expect(result.description).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create inactive checklist item', async () => {
    const inactiveInput: CreateChecklistItemInput = {
      category: 'Hydraulics',
      item_name: 'Deprecated check',
      description: 'Old item no longer needed',
      is_active: false
    };

    const result = await createChecklistItem(inactiveInput);

    expect(result.category).toEqual('Hydraulics');
    expect(result.item_name).toEqual('Deprecated check');
    expect(result.description).toEqual('Old item no longer needed');
    expect(result.is_active).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
