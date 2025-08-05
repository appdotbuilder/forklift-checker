
import { db } from '../db';
import { forkliftsTable } from '../db/schema';
import { type CreateForkliftInput, type Forklift } from '../schema';

export const createForklift = async (input: CreateForkliftInput): Promise<Forklift> => {
  try {
    // Insert forklift record
    const result = await db.insert(forkliftsTable)
      .values({
        unit_number: input.unit_number,
        brand: input.brand,
        model: input.model,
        year: input.year,
        serial_number: input.serial_number,
        status: input.status
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Forklift creation failed:', error);
    throw error;
  }
};
