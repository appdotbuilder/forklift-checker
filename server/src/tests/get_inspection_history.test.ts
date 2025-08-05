
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, forkliftsTable, dailyInspectionsTable } from '../db/schema';
import { type GetInspectionHistoryInput } from '../schema';
import { getInspectionHistory } from '../handlers/get_inspection_history';

describe('getInspectionHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let operatorId: number;
  let forkliftId1: number;
  let forkliftId2: number;
  let inspectionId1: number;
  let inspectionId2: number;
  let inspectionId3: number;

  beforeEach(async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testoperator',
        full_name: 'Test Operator',
        role: 'operator'
      })
      .returning()
      .execute();
    operatorId = users[0].id;

    // Create test forklifts
    const forklifts = await db.insert(forkliftsTable)
      .values([
        {
          unit_number: 'FL001',
          brand: 'Toyota',
          model: '8FGU25',
          year: 2020,
          serial_number: 'TOY001',
          status: 'active'
        },
        {
          unit_number: 'FL002',
          brand: 'Hyster',
          model: 'H50FT',
          year: 2019,
          serial_number: 'HYS001',
          status: 'maintenance'
        }
      ])
      .returning()
      .execute();
    forkliftId1 = forklifts[0].id;
    forkliftId2 = forklifts[1].id;

    // Create test inspections with specific dates (set time to noon to avoid edge cases)
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0); // Set to noon

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(12, 0, 0, 0); // Set to noon

    const inspections = await db.insert(dailyInspectionsTable)
      .values([
        {
          forklift_id: forkliftId1,
          operator_id: operatorId,
          inspection_date: today,
          shift: 'morning',
          hours_meter: '1250.50',
          fuel_level: 75,
          overall_status: 'pass',
          notes: 'All systems normal'
        },
        {
          forklift_id: forkliftId1,
          operator_id: operatorId,
          inspection_date: yesterday,
          shift: 'afternoon',
          hours_meter: '1248.25',
          fuel_level: 50,
          overall_status: 'needs_attention',
          notes: 'Low hydraulic fluid'
        },
        {
          forklift_id: forkliftId2,
          operator_id: operatorId,
          inspection_date: twoDaysAgo,
          shift: 'night',
          hours_meter: '850.75',
          fuel_level: 25,
          overall_status: 'fail',
          notes: 'Brake issues detected'
        }
      ])
      .returning()
      .execute();
    inspectionId1 = inspections[0].id;
    inspectionId2 = inspections[1].id;
    inspectionId3 = inspections[2].id;
  });

  it('should return all inspections when no filters provided', async () => {
    const input: GetInspectionHistoryInput = {};
    const result = await getInspectionHistory(input);

    expect(result).toHaveLength(3);
    
    // Should be ordered by inspection_date descending (most recent first)
    expect(result[0].id).toEqual(inspectionId1); // today
    expect(result[1].id).toEqual(inspectionId2); // yesterday
    expect(result[2].id).toEqual(inspectionId3); // two days ago

    // Verify numeric conversion
    expect(typeof result[0].hours_meter).toBe('number');
    expect(result[0].hours_meter).toEqual(1250.50);
    expect(result[1].hours_meter).toEqual(1248.25);
  });

  it('should filter by forklift_id', async () => {
    const input: GetInspectionHistoryInput = {
      forklift_id: forkliftId1
    };
    const result = await getInspectionHistory(input);

    expect(result).toHaveLength(2);
    result.forEach(inspection => {
      expect(inspection.forklift_id).toEqual(forkliftId1);
    });
  });

  it('should filter by status', async () => {
    const input: GetInspectionHistoryInput = {
      status: 'pass'
    };
    const result = await getInspectionHistory(input);

    expect(result).toHaveLength(1);
    expect(result[0].overall_status).toEqual('pass');
    expect(result[0].id).toEqual(inspectionId1);
  });

  it('should filter by date range', async () => {
    // Create date range that includes both today and yesterday
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // yesterday
    startDate.setHours(0, 0, 0, 0); // Start of yesterday

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today

    const input: GetInspectionHistoryInput = {
      start_date: startDate,
      end_date: endDate
    };
    const result = await getInspectionHistory(input);

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(inspectionId1); // today
    expect(result[1].id).toEqual(inspectionId2); // yesterday
  });

  it('should combine multiple filters', async () => {
    // Create date range for just yesterday
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // yesterday
    startDate.setHours(0, 0, 0, 0); // Start of yesterday

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // yesterday
    endDate.setHours(23, 59, 59, 999); // End of yesterday

    const input: GetInspectionHistoryInput = {
      forklift_id: forkliftId1,
      status: 'needs_attention',
      start_date: startDate,
      end_date: endDate
    };
    const result = await getInspectionHistory(input);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(inspectionId2);
    expect(result[0].forklift_id).toEqual(forkliftId1);
    expect(result[0].overall_status).toEqual('needs_attention');
  });

  it('should return empty array when no inspections match filters', async () => {
    const input: GetInspectionHistoryInput = {
      forklift_id: 99999 // Non-existent forklift
    };
    const result = await getInspectionHistory(input);

    expect(result).toHaveLength(0);
  });

  it('should handle null hours_meter correctly', async () => {
    // Create inspection with null hours_meter
    await db.insert(dailyInspectionsTable)
      .values({
        forklift_id: forkliftId1,
        operator_id: operatorId,
        inspection_date: new Date(),
        shift: 'morning',
        hours_meter: null,
        fuel_level: 100,
        overall_status: 'pass',
        notes: 'Hours meter not working'
      })
      .execute();

    const input: GetInspectionHistoryInput = {};
    const result = await getInspectionHistory(input);

    // Find the inspection with null hours_meter
    const nullHoursInspection = result.find(inspection => inspection.hours_meter === null);
    expect(nullHoursInspection).toBeDefined();
    expect(nullHoursInspection!.hours_meter).toBeNull();
  });
});
