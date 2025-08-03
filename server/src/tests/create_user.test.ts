
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateUserInput = {
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'user',
  is_active: true
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.role).toEqual('user');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user with default values', async () => {
    const minimalInput = {
      email: 'minimal@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'user' as const,
      is_active: true
    };

    const result = await createUser(minimalInput);

    expect(result.email).toEqual('minimal@example.com');
    expect(result.role).toEqual('user');
    expect(result.is_active).toEqual(true);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Doe');
    expect(users[0].role).toEqual('user');
    expect(users[0].is_active).toEqual(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create admin user', async () => {
    const adminInput: CreateUserInput = {
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true
    };

    const result = await createUser(adminInput);

    expect(result.role).toEqual('admin');
    expect(result.email).toEqual('admin@example.com');
  });

  it('should handle duplicate email constraint', async () => {
    await createUser(testInput);

    // Try to create another user with the same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com', // Same email
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'user',
      is_active: true
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should create inactive user', async () => {
    const inactiveInput: CreateUserInput = {
      email: 'inactive@example.com',
      first_name: 'Inactive',
      last_name: 'User',
      role: 'user',
      is_active: false
    };

    const result = await createUser(inactiveInput);

    expect(result.is_active).toEqual(false);
    expect(result.email).toEqual('inactive@example.com');
  });
});
