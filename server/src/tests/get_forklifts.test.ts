
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { forkliftsTable } from '../db/schema';
import { type CreateForkliftInput, type GetForkliftStatusInput } from '../schema';
import { getForklifts } from '../handlers/get_forklifts';

// Test forklift data
const testForklift1: CreateForkliftInput = {
  unit_number: 'FL001',
  brand: 'Toyota',
  model: '8FGCU25',
  year: 2020,
  serial_number: 'TY123456',
  status: 'active'
};

const testForklift2: CreateForkliftInput = {
  unit_number: 'FL002',
  brand: 'Hyster',
  model: 'H50FT',
  year: 2019,
  serial_number: 'HY789012',
  status: 'maintenance'
};

const testForklift3: CreateForkliftInput = {
  unit_number: 'FL003',
  brand: 'Caterpillar',
  model: 'GC30K',
  year: 2021,
  serial_number: 'CAT345678',
  status: 'inactive'
};

describe('getForklifts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all forklifts when no filter is provided', async () => {
    // Create test forklifts
    await db.insert(forkliftsTable).values([testForklift1, testForklift2, testForklift3]).execute();

    const result = await getForklifts();

    expect(result).toHaveLength(3);
    expect(result[0].unit_number).toEqual('FL001');
    expect(result[0].brand).toEqual('Toyota');
    expect(result[0].status).toEqual('active');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify all forklifts are returned
    const unitNumbers = result.map(f => f.unit_number).sort();
    expect(unitNumbers).toEqual(['FL001', 'FL002', 'FL003']);
  });

  it('should return empty array when no forklifts exist', async () => {
    const result = await getForklifts();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should filter forklifts by active status', async () => {
    // Create test forklifts
    await db.insert(forkliftsTable).values([testForklift1, testForklift2, testForklift3]).execute();

    const input: GetForkliftStatusInput = { status: 'active' };
    const result = await getForklifts(input);

    expect(result).toHaveLength(1);
    expect(result[0].unit_number).toEqual('FL001');
    expect(result[0].status).toEqual('active');
    expect(result[0].brand).toEqual('Toyota');
  });

  it('should filter forklifts by maintenance status', async () => {
    // Create test forklifts
    await db.insert(forkliftsTable).values([testForklift1, testForklift2, testForklift3]).execute();

    const input: GetForkliftStatusInput = { status: 'maintenance' };
    const result = await getForklifts(input);

    expect(result).toHaveLength(1);
    expect(result[0].unit_number).toEqual('FL002');
    expect(result[0].status).toEqual('maintenance');
    expect(result[0].brand).toEqual('Hyster');
  });

  it('should filter forklifts by inactive status', async () => {
    // Create test forklifts
    await db.insert(forkliftsTable).values([testForklift1, testForklift2, testForklift3]).execute();

    const input: GetForkliftStatusInput = { status: 'inactive' };
    const result = await getForklifts(input);

    expect(result).toHaveLength(1);
    expect(result[0].unit_number).toEqual('FL003');
    expect(result[0].status).toEqual('inactive');
    expect(result[0].brand).toEqual('Caterpillar');
  });

  it('should return empty array when filtering by status with no matches', async () => {
    // Create only active forklifts
    await db.insert(forkliftsTable).values([testForklift1]).execute();

    const input: GetForkliftStatusInput = { status: 'maintenance' };
    const result = await getForklifts(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
