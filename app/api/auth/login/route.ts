
import { NextResponse } from "next/server";
import { compare } from "bcrypt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .then(rows => rows[0]);
      console.log('user = await db.select', user)

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { 
        user: {
          id: user.id,
          username: user.username,
          dailyCalorieGoal: user.dailyCalorieGoal
        }
      },
      { status: 200 }
    );

    // Set HTTP-only cookie that expires when browser closes
    response.cookies.set('auth-token', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
