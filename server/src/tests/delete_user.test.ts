
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type DeleteUserInput } from '../schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async (userData: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      is_active: userData.is_active
    })
    .returning()
    .execute();
  
  return result[0];
};

const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'user',
  is_active: true
};

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing user', async () => {
    // Create a test user first
    const createdUser = await createTestUser(testUserInput);
    
    const deleteInput: DeleteUserInput = {
      id: createdUser.id
    };

    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(true);

    // Verify user was actually deleted from database
    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(deletedUser).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent user', async () => {
    const deleteInput: DeleteUserInput = {
      id: 99999 // Non-existent user ID
    };

    await expect(deleteUser(deleteInput)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should validate user exists before deletion', async () => {
    // Create and then manually delete a user to simulate non-existence
    const createdUser = await createTestUser(testUserInput);
    
    // Manually delete the user directly from database
    await db.delete(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    const deleteInput: DeleteUserInput = {
      id: createdUser.id
    };

    // Now try to delete again - should fail
    await expect(deleteUser(deleteInput)).rejects.toThrow(/User with id .* not found/i);
  });

  it('should handle database constraints properly', async () => {
    // Create multiple users to ensure we're only deleting the target user
    const user1 = await createTestUser({
      ...testUserInput,
      email: 'user1@example.com'
    });
    
    const user2 = await createTestUser({
      ...testUserInput,
      email: 'user2@example.com'
    });

    // Delete only user1
    const result = await deleteUser({ id: user1.id });
    expect(result.success).toBe(true);

    // Verify user1 is deleted but user2 still exists
    const remainingUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(remainingUsers).toHaveLength(1);
    expect(remainingUsers[0].id).toBe(user2.id);
    expect(remainingUsers[0].email).toBe('user2@example.com');
  });
});
