import { hash } from "bcrypt";
import { db } from "@/lib/db";

const withClose = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      const result = await fn();
      return result;
    } finally {
      await db.client.end();
    }
  };

export async function createUser(data: { 
  email: string; 
  password: string; 
  username: string;
  dailyCalorieGoal?: number;
}) {
  const validatedData = authSchema.parse(data);
  
  return withClose(async () => {
    const hashedPassword = await hash(validatedData.password, 10);
    
    return await db.insert(users)
      .values({
        email: validatedData.email,
        password: hashedPassword,
        username: validatedData.username,
        dailyCalorieGoal: data.dailyCalorieGoal ?? 2000,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
      });
  });
}
