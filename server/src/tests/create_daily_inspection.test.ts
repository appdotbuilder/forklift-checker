
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyInspectionsTable, inspectionResultsTable, usersTable, forkliftsTable, checklistItemsTable } from '../db/schema';
import { type CreateDailyInspectionInput } from '../schema';
import { createDailyInspection } from '../handlers/create_daily_inspection';
import { eq } from 'drizzle-orm';

describe('createDailyInspection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let forkliftId: number;
  let checklistItemId1: number;
  let checklistItemId2: number;

  beforeEach(async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testoperator',
        full_name: 'Test Operator',
        role: 'operator'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create prerequisite forklift
    const forkliftResult = await db.insert(forkliftsTable)
      .values({
        unit_number: 'FL001',
        brand: 'Toyota',
        model: '7FBE13',
        year: 2020,
        serial_number: 'ABC123',
        status: 'active'
      })
      .returning()
      .execute();
    forkliftId = forkliftResult[0].id;

    // Create prerequisite checklist items
    const checklistResults = await db.insert(checklistItemsTable)
      .values([
        {
          category: 'Safety',
          item_name: 'Seatbelt',
          description: 'Check seatbelt condition',
          is_active: true
        },
        {
          category: 'Engine',
          item_name: 'Oil Level',
          description: 'Check engine oil level',
          is_active: true
        }
      ])
      .returning()
      .execute();
    checklistItemId1 = checklistResults[0].id;
    checklistItemId2 = checklistResults[1].id;
  });

  const testInput: CreateDailyInspectionInput = {
    forklift_id: 0, // Will be set in tests
    operator_id: 0, // Will be set in tests
    inspection_date: new Date('2024-01-15T08:00:00Z'),
    shift: 'morning',
    hours_meter: 1250.5,
    fuel_level: 85,
    notes: 'Regular morning inspection',
    checklist_results: [] // Will be set in tests
  };

  it('should create a daily inspection with pass status', async () => {
    const input = {
      ...testInput,
      forklift_id: forkliftId,
      operator_id: userId,
      checklist_results: [
        {
          checklist_item_id: checklistItemId1,
          status: 'ok' as const,
          notes: 'Seatbelt in good condition'
        },
        {
          checklist_item_id: checklistItemId2,
          status: 'ok' as const,
          notes: null
        }
      ]
    };

    const result = await createDailyInspection(input);

    expect(result.forklift_id).toEqual(forkliftId);
    expect(result.operator_id).toEqual(userId);
    expect(result.inspection_date).toEqual(new Date('2024-01-15T08:00:00Z'));
    expect(result.shift).toEqual('morning');
    expect(result.hours_meter).toEqual(1250.5);
    expect(typeof result.hours_meter).toEqual('number');
    expect(result.fuel_level).toEqual(85);
    expect(result.overall_status).toEqual('pass');
    expect(result.notes).toEqual('Regular morning inspection');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a daily inspection with fail status when defects found', async () => {
    const input = {
      ...testInput,
      forklift_id: forkliftId,
      operator_id: userId,
      checklist_results: [
        {
          checklist_item_id: checklistItemId1,
          status: 'defect' as const,
          notes: 'Seatbelt is damaged'
        },
        {
          checklist_item_id: checklistItemId2,
          status: 'ok' as const,
          notes: null
        }
      ]
    };

    const result = await createDailyInspection(input);

    expect(result.overall_status).toEqual('fail');
  });

  it('should save inspection and results to database', async () => {
    const input = {
      ...testInput,
      forklift_id: forkliftId,
      operator_id: userId,
      checklist_results: [
        {
          checklist_item_id: checklistItemId1,
          status: 'ok' as const,
          notes: 'All good'
        }
      ]
    };

    const result = await createDailyInspection(input);

    // Verify inspection was saved
    const inspections = await db.select()
      .from(dailyInspectionsTable)
      .where(eq(dailyInspectionsTable.id, result.id))
      .execute();

    expect(inspections).toHaveLength(1);
    expect(inspections[0].forklift_id).toEqual(forkliftId);
    expect(inspections[0].operator_id).toEqual(userId);
    expect(parseFloat(inspections[0].hours_meter!)).toEqual(1250.5);

    // Verify inspection results were saved
    const inspectionResults = await db.select()
      .from(inspectionResultsTable)
      .where(eq(inspectionResultsTable.inspection_id, result.id))
      .execute();

    expect(inspectionResults).toHaveLength(1);
    expect(inspectionResults[0].checklist_item_id).toEqual(checklistItemId1);
    expect(inspectionResults[0].status).toEqual('ok');
    expect(inspectionResults[0].notes).toEqual('All good');
  });

  it('should handle null hours_meter correctly', async () => {
    const input = {
      ...testInput,
      forklift_id: forkliftId,
      operator_id: userId,
      hours_meter: null,
      checklist_results: [
        {
          checklist_item_id: checklistItemId1,
          status: 'ok' as const,
          notes: null
        }
      ]
    };

    const result = await createDailyInspection(input);

    expect(result.hours_meter).toBeNull();
  });

  it('should throw error for non-existent forklift', async () => {
    const input = {
      ...testInput,
      forklift_id: 99999,
      operator_id: userId,
      checklist_results: []
    };

    expect(createDailyInspection(input)).rejects.toThrow(/forklift with id 99999 not found/i);
  });

  it('should throw error for non-existent operator', async () => {
    const input = {
      ...testInput,
      forklift_id: forkliftId,
      operator_id: 99999,
      checklist_results: []
    };

    expect(createDailyInspection(input)).rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should throw error for non-existent checklist item', async () => {
    const input = {
      ...testInput,
      forklift_id: forkliftId,
      operator_id: userId,
      checklist_results: [
        {
          checklist_item_id: 99999,
          status: 'ok' as const,
          notes: null
        }
      ]
    };

    expect(createDailyInspection(input)).rejects.toThrow(/checklist item with id 99999 not found/i);
  });
});
