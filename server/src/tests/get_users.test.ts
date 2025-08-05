
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    const testUsers: CreateUserInput[] = [
      {
        username: 'operator1',
        full_name: 'John Operator',
        role: 'operator'
      },
      {
        username: 'mechanic1',
        full_name: 'Jane Mechanic',
        role: 'mechanic'
      },
      {
        username: 'supervisor1',
        full_name: 'Bob Supervisor',
        role: 'supervisor'
      }
    ];

    // Insert test users
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Check that all roles are represented
    const roles = result.map(user => user.role);
    expect(roles).toContain('operator');
    expect(roles).toContain('mechanic');
    expect(roles).toContain('supervisor');

    // Verify user data structure
    result.forEach(user => {
      expect(user.id).toBeDefined();
      expect(typeof user.username).toBe('string');
      expect(typeof user.full_name).toBe('string');
      expect(['operator', 'mechanic', 'supervisor']).toContain(user.role);
      expect(user.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return users in creation order', async () => {
    // Create users in specific order
    await db.insert(usersTable)
      .values({
        username: 'first_user',
        full_name: 'First User',
        role: 'operator'
      })
      .execute();

    await db.insert(usersTable)
      .values({
        username: 'second_user',
        full_name: 'Second User',
        role: 'mechanic'
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].username).toBe('first_user');
    expect(result[1].username).toBe('second_user');
    expect(result[0].id).toBeLessThan(result[1].id);
  });
});
