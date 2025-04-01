import { db } from "./";
import { users } from "./schema";
import { hash } from "bcrypt";
import { eq } from 'drizzle-orm';

async function seed() {
    const testUser = await db
      .select()
      .from(users)
      .where(eq(users.username, "test"))
      .execute();
  
    if (!testUser.length) {
      const hashedPassword = await hash("pw", 10);
      await db.insert(users).values({
        username: "test",
        password: hashedPassword,
      }).execute();
    }

    const jackUser = await db
      .select()
      .from(users)
      .where(eq(users.username, "jack"))
      .execute();

    if (!jackUser.length) {
      const hashedPassword = await hash("temp420", 10);
      await db.insert(users).values({
        username: "jack",
        password: hashedPassword,
      }).execute();
    }

    const anthonyUser = await db
      .select()
      .from(users)
      .where(eq(users.username, "anthony"))
      .execute();

    if (!anthonyUser.length) {
      const hashedPassword = await hash("temp69", 10);
      await db.insert(users).values({
        username: "anthony",
        password: hashedPassword,
      }).execute();
    }

    console.log('seed completed!');
}
  
seed().catch(console.error);
