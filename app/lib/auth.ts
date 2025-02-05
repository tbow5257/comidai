
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function getAuthUser() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('auth-token');

  if (!tokenCookie) return null;

  const user = await db.select()
    .from(users)
    .where(eq(users.id, parseInt(tokenCookie.value)))
    .then(rows => rows[0]);

  return user || null;
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}
