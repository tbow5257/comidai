import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    dailyCalorieGoal?: number
  }
  
  interface Session {
    user: User & {
      id: string
      dailyCalorieGoal?: number
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    dailyCalorieGoal?: number
  }
}
