
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test user inputs
const testUser1: CreateUserInput = {
  email: 'user1@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'user',
  is_active: true
};

const testUser2: CreateUserInput = {
  email: 'admin@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'admin',
  is_active: true
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
  });

  it('should return all users ordered by creation date (newest first)', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          email: testUser1.email,
          first_name: testUser1.first_name,
          last_name: testUser1.last_name,
          role: testUser1.role,
          is_active: testUser1.is_active
        },
        {
          email: testUser2.email,
          first_name: testUser2.first_name,
          last_name: testUser2.last_name,
          role: testUser2.role,
          is_active: testUser2.is_active
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Verify all fields are present
    expect(result[0].id).toBeDefined();
    expect(result[0].email).toBeDefined();
    expect(result[0].first_name).toBeDefined();
    expect(result[0].last_name).toBeDefined();
    expect(result[0].role).toBeDefined();
    expect(result[0].is_active).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify ordering (newest first)
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return users with correct field types', async () => {
    await db.insert(usersTable)
      .values({
        email: testUser1.email,
        first_name: testUser1.first_name,
        last_name: testUser1.last_name,
        role: testUser1.role,
        is_active: testUser1.is_active
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    expect(typeof user.id).toBe('number');
    expect(typeof user.email).toBe('string');
    expect(typeof user.first_name).toBe('string');
    expect(typeof user.last_name).toBe('string');
    expect(typeof user.role).toBe('string');
    expect(typeof user.is_active).toBe('boolean');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should return users with different roles and statuses', async () => {
    await db.insert(usersTable)
      .values([
        {
          email: 'active@example.com',
          first_name: 'Active',
          last_name: 'User',
          role: 'user',
          is_active: true
        },
        {
          email: 'inactive@example.com',
          first_name: 'Inactive',
          last_name: 'User',
          role: 'moderator',
          is_active: false
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check that both active and inactive users are returned
    const activeUser = result.find(u => u.email === 'active@example.com');
    const inactiveUser = result.find(u => u.email === 'inactive@example.com');
    
    expect(activeUser).toBeDefined();
    expect(activeUser!.is_active).toBe(true);
    expect(activeUser!.role).toBe('user');
    
    expect(inactiveUser).toBeDefined();
    expect(inactiveUser!.is_active).toBe(false);
    expect(inactiveUser!.role).toBe('moderator');
  });
});
