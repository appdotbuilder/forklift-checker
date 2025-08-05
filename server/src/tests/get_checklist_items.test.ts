
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { checklistItemsTable } from '../db/schema';
import { type CreateChecklistItemInput } from '../schema';
import { getChecklistItems } from '../handlers/get_checklist_items';

// Test checklist items with different categories
const testItems: CreateChecklistItemInput[] = [
  {
    category: 'Safety',
    item_name: 'Check seatbelt',
    description: 'Ensure seatbelt is functioning properly',
    is_active: true
  },
  {
    category: 'Engine',
    item_name: 'Check oil level',
    description: 'Verify engine oil is at proper level',
    is_active: true
  },
  {
    category: 'Safety',
    item_name: 'Test horn',
    description: 'Ensure horn is working',
    is_active: true
  },
  {
    category: 'Engine',
    item_name: 'Check coolant',
    description: 'Verify coolant level',
    is_active: false // This should be filtered out
  }
];

describe('getChecklistItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no checklist items exist', async () => {
    const result = await getChecklistItems();
    expect(result).toEqual([]);
  });

  it('should return only active checklist items', async () => {
    // Insert test data
    await db.insert(checklistItemsTable)
      .values(testItems)
      .execute();

    const result = await getChecklistItems();

    // Should only return active items (3 out of 4)
    expect(result).toHaveLength(3);
    
    // Verify all returned items are active
    result.forEach(item => {
      expect(item.is_active).toBe(true);
    });

    // Verify inactive item is not included
    const inactiveItems = result.filter(item => item.item_name === 'Check coolant');
    expect(inactiveItems).toHaveLength(0);
  });

  it('should return items ordered by category then item name', async () => {
    // Insert test data
    await db.insert(checklistItemsTable)
      .values(testItems)
      .execute();

    const result = await getChecklistItems();

    // Verify ordering - Engine comes before Safety alphabetically
    expect(result[0].category).toBe('Engine');
    expect(result[0].item_name).toBe('Check oil level');
    expect(result[1].category).toBe('Safety');
    expect(result[1].item_name).toBe('Check seatbelt');
    expect(result[2].category).toBe('Safety');
    expect(result[2].item_name).toBe('Test horn');
  });

  it('should return all fields for each checklist item', async () => {
    // Insert single test item
    await db.insert(checklistItemsTable)
      .values([testItems[0]])
      .execute();

    const result = await getChecklistItems();
    
    expect(result).toHaveLength(1);
    const item = result[0];

    // Verify all fields are present and correct
    expect(item.id).toBeDefined();
    expect(item.category).toBe('Safety');
    expect(item.item_name).toBe('Check seatbelt');
    expect(item.description).toBe('Ensure seatbelt is functioning properly');
    expect(item.is_active).toBe(true);
    expect(item.created_at).toBeInstanceOf(Date);
  });

  it('should handle items with null descriptions', async () => {
    const itemWithNullDescription: CreateChecklistItemInput = {
      category: 'Test',
      item_name: 'Test item',
      description: null,
      is_active: true
    };

    await db.insert(checklistItemsTable)
      .values([itemWithNullDescription])
      .execute();

    const result = await getChecklistItems();
    
    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
  });
});
