
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  if (!token) return null;

  const user = await db.select()
    .from(users)
    .where(eq(users.id, parseInt(token.value)))
    .then(rows => rows[0]);

  return user || null;
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}
