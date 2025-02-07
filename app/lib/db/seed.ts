import { db } from "./";
import { users } from "./schema";
import { hash } from "bcrypt";
import { eq } from 'drizzle-orm';

async function seed() {
    const exists = await db
      .select()
      .from(users)
      .where(eq(users.username, "test"))
      .execute();
  
    if (!exists.length) {
      const hashedPassword = await hash("pw", 10);
      await db.insert(users).values({
        username: "test",
        password: hashedPassword,
      }).execute();
    }
  }
  
seed().catch(console.error);
