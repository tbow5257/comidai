"use client"
import { signIn, signOut, useSession } from "next-auth/react";
import type { InsertUser } from "../lib/db/schema";

export function useAuth() {
  const { data: session, status } = useSession();

  const login = async (credentials: InsertUser) => {
    console.log('login credentials arg', credentials)
    const result = await signIn("credentials", ...credentials)
    console.log('login result ', result)
  };
  const logout = () => signOut({ redirect: false });
  console.log('use auth session ', session)
  return {
    user: session?.user || null,
    isLoading: status === "loading",
    login,
    logout,
  };
}
