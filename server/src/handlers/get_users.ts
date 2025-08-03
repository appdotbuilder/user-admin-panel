
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { desc } from 'drizzle-orm';

export const getUsers = async (): Promise<User[]> => {
  try {
    const results = await db.select()
      .from(usersTable)
      .orderBy(desc(usersTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
