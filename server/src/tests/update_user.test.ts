
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper to create a test user
const createTestUser = async () => {
  const testUserInput: CreateUserInput = {
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'user',
    is_active: true
  };

  const result = await db.insert(usersTable)
    .values(testUserInput)
    .returning()
    .execute();

  return result[0];
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user fields', async () => {
    const testUser = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: testUser.id,
      email: 'updated@example.com',
      first_name: 'Jane',
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUser.id);
    expect(result.email).toEqual('updated@example.com');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Doe'); // Unchanged
    expect(result.role).toEqual('admin');
    expect(result.is_active).toEqual(true); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testUser.updated_at.getTime());
  });

  it('should save updated user to database', async () => {
    const testUser = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: testUser.id,
      email: 'saved@example.com',
      is_active: false
    };

    await updateUser(updateInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUser.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('saved@example.com');
    expect(users[0].is_active).toEqual(false);
    expect(users[0].first_name).toEqual('John'); // Unchanged
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const testUser = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: testUser.id,
      last_name: 'Smith'
    };

    const result = await updateUser(updateInput);

    expect(result.email).toEqual('test@example.com'); // Unchanged
    expect(result.first_name).toEqual('John'); // Unchanged
    expect(result.last_name).toEqual('Smith'); // Updated
    expect(result.role).toEqual('user'); // Unchanged
    expect(result.is_active).toEqual(true); // Unchanged
  });

  it('should throw error when user does not exist', async () => {
    const updateInput: UpdateUserInput = {
      id: 999,
      email: 'nonexistent@example.com'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/user with id 999 not found/i);
  });

  it('should handle email uniqueness constraint', async () => {
    const testUser1 = await createTestUser();
    
    // Create second user
    const testUser2 = await db.insert(usersTable)
      .values({
        email: 'second@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'user',
        is_active: true
      })
      .returning()
      .execute();

    // Try to update first user with second user's email
    const updateInput: UpdateUserInput = {
      id: testUser1.id,
      email: 'second@example.com'
    };

    await expect(updateUser(updateInput)).rejects.toThrow();
  });
});
