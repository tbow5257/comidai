'use server'

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { compare } from "bcrypt"
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type AuthState = {
    error?: string
  }


export async function login(prevState: AuthState, formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const mode = formData.get('mode') as 'login' | 'register'

  if (mode === 'login') {
    try {
      const user = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .then(rows => rows[0])

      if (!user?.password) {
        return { error: "Invalid credentials" }
      }

      const isPasswordValid = await compare(password, user.password)
      if (!isPasswordValid) {
        return { error: "Invalid credentials" }
      }
      const cookieStore = await cookies();

      cookieStore.set('auth-token', user.id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      })

      cookieStore.set('flash-message', 'Successfully logged in', {
        maxAge: 3,
        path: '/',
      })  


    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Authentication failed' 
       }
    }

    return redirect('/')

  }

  // TODO: Add register logic here
  return { error: "Not implemented" }
}
