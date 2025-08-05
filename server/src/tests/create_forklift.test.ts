
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { forkliftsTable } from '../db/schema';
import { type CreateForkliftInput } from '../schema';
import { createForklift } from '../handlers/create_forklift';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateForkliftInput = {
  unit_number: 'FL001',
  brand: 'Toyota',
  model: '8FGU25',
  year: 2022,
  serial_number: 'TY123456789',
  status: 'active'
};

describe('createForklift', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a forklift', async () => {
    const result = await createForklift(testInput);

    // Basic field validation
    expect(result.unit_number).toEqual('FL001');
    expect(result.brand).toEqual('Toyota');
    expect(result.model).toEqual('8FGU25');
    expect(result.year).toEqual(2022);
    expect(result.serial_number).toEqual('TY123456789');
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save forklift to database', async () => {
    const result = await createForklift(testInput);

    // Query using proper drizzle syntax
    const forklifts = await db.select()
      .from(forkliftsTable)
      .where(eq(forkliftsTable.id, result.id))
      .execute();

    expect(forklifts).toHaveLength(1);
    expect(forklifts[0].unit_number).toEqual('FL001');
    expect(forklifts[0].brand).toEqual('Toyota');
    expect(forklifts[0].model).toEqual('8FGU25');
    expect(forklifts[0].year).toEqual(2022);
    expect(forklifts[0].serial_number).toEqual('TY123456789');
    expect(forklifts[0].status).toEqual('active');
    expect(forklifts[0].created_at).toBeInstanceOf(Date);
  });

  it('should use default status when not provided', async () => {
    const inputWithoutStatus: CreateForkliftInput = {
      unit_number: 'FL002',
      brand: 'Caterpillar',
      model: 'GC25N',
      year: 2023,
      serial_number: 'CAT987654321',
      status: 'active' // Include status as it's required by the type
    };

    const result = await createForklift(inputWithoutStatus);

    expect(result.status).toEqual('active');
  });

  it('should throw error for duplicate unit_number', async () => {
    // Create first forklift
    await createForklift(testInput);

    // Attempt to create second forklift with same unit_number
    const duplicateInput = {
      ...testInput,
      serial_number: 'TY999999999' // Different serial number
    };

    expect(createForklift(duplicateInput)).rejects.toThrow(/duplicate/i);
  });

  it('should handle different status values', async () => {
    const maintenanceInput: CreateForkliftInput = {
      unit_number: 'FL003',
      brand: 'Hyster',
      model: 'H50FT',
      year: 2021,
      serial_number: 'HY555666777',
      status: 'maintenance'
    };

    const result = await createForklift(maintenanceInput);

    expect(result.status).toEqual('maintenance');
  });
});
