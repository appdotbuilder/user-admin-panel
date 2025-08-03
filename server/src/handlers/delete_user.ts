
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type DeleteUserInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteUser = async (input: DeleteUserInput): Promise<{ success: boolean }> => {
  try {
    // Check if user exists before attempting deletion
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    // Delete the user
    const result = await db.delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    // Return success status based on whether any rows were affected
    return { success: result.length > 0 };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};
