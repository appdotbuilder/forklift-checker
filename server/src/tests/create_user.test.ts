
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input for operator role
const testInputOperator: CreateUserInput = {
  username: 'test_operator',
  full_name: 'Test Operator User',
  role: 'operator'
};

// Test input for mechanic role
const testInputMechanic: CreateUserInput = {
  username: 'test_mechanic',
  full_name: 'Test Mechanic User',
  role: 'mechanic'
};

// Test input for supervisor role
const testInputSupervisor: CreateUserInput = {
  username: 'test_supervisor',
  full_name: 'Test Supervisor User',
  role: 'supervisor'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an operator user', async () => {
    const result = await createUser(testInputOperator);

    // Basic field validation
    expect(result.username).toEqual('test_operator');
    expect(result.full_name).toEqual('Test Operator User');
    expect(result.role).toEqual('operator');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a mechanic user', async () => {
    const result = await createUser(testInputMechanic);

    expect(result.username).toEqual('test_mechanic');
    expect(result.full_name).toEqual('Test Mechanic User');
    expect(result.role).toEqual('mechanic');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a supervisor user', async () => {
    const result = await createUser(testInputSupervisor);

    expect(result.username).toEqual('test_supervisor');
    expect(result.full_name).toEqual('Test Supervisor User');
    expect(result.role).toEqual('supervisor');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInputOperator);

    // Query database to verify the user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('test_operator');
    expect(users[0].full_name).toEqual('Test Operator User');
    expect(users[0].role).toEqual('operator');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique username constraint', async () => {
    // Create first user
    await createUser(testInputOperator);

    // Try to create another user with same username
    await expect(createUser(testInputOperator)).rejects.toThrow(/unique/i);
  });

  it('should handle different username formats', async () => {
    const specialUsernameInput: CreateUserInput = {
      username: 'user_123',
      full_name: 'User with Numbers',
      role: 'mechanic'
    };

    const result = await createUser(specialUsernameInput);

    expect(result.username).toEqual('user_123');
    expect(result.full_name).toEqual('User with Numbers');
    expect(result.role).toEqual('mechanic');
  });
});
