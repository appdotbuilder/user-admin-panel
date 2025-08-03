
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type GetUserInput, type CreateUserInput } from '../schema';
import { getUser } from '../handlers/get_user';

// Test user data
const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'user',
  is_active: true
};

describe('getUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when found', async () => {
    // Create a test user first
    const insertResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();

    const createdUser = insertResult[0];
    const input: GetUserInput = { id: createdUser.id };

    const result = await getUser(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.email).toEqual('test@example.com');
    expect(result!.first_name).toEqual('John');
    expect(result!.last_name).toEqual('Doe');
    expect(result!.role).toEqual('user');
    expect(result!.is_active).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user not found', async () => {
    const input: GetUserInput = { id: 999 };

    const result = await getUser(input);

    expect(result).toBeNull();
  });

  it('should handle multiple users correctly', async () => {
    // Create multiple test users
    const user1Input = { ...testUserInput, email: 'user1@example.com' };
    const user2Input = { ...testUserInput, email: 'user2@example.com', first_name: 'Jane' };

    const insertResult1 = await db.insert(usersTable)
      .values(user1Input)
      .returning()
      .execute();

    const insertResult2 = await db.insert(usersTable)
      .values(user2Input)
      .returning()
      .execute();

    const user1Id = insertResult1[0].id;
    const user2Id = insertResult2[0].id;

    // Test getting first user
    const result1 = await getUser({ id: user1Id });
    expect(result1).not.toBeNull();
    expect(result1!.email).toEqual('user1@example.com');
    expect(result1!.first_name).toEqual('John');

    // Test getting second user
    const result2 = await getUser({ id: user2Id });
    expect(result2).not.toBeNull();
    expect(result2!.email).toEqual('user2@example.com');
    expect(result2!.first_name).toEqual('Jane');
  });
});
