
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

async function fetchUserById(id?: number | string) {
  if (!id) {
    return null
  };

  const formattedInputId = typeof id === 'string' ? parseInt(id) : id;
  const user = await db.select().from(users).where(eq(users.id, formattedInputId)).then(rows => rows[0]);
  return user || null;
}

export async function getMiddlewareUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  const user = await fetchUserById(token)

  return user || null;
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('auth-token');

  if (!tokenCookie) return null;

  const user = await fetchUserById(tokenCookie.value)

  return user || null;
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}
