import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { compare } from "bcrypt";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { NextApiRequest, NextApiResponse } from "next";
import GoogleProvider from "next-auth/providers/google";

// Utility for managing Neon connections
const withClose = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    const result = await fn();
    return result;
  } finally {
    await db.client.end();
  }
};

// export const authOptions: AuthOptions = {
//   secret: process.env.NEXTAUTH_SECRET,
//   session: {
//     strategy: "jwt"
//   },
//   pages: {
//     signIn: "/",
//   },
//   providers: [
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         username: { label: "Username", type: "text" },
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         console.log('entered credentials', credentials)
//         if (!credentials?.username || !credentials?.password) {
//           return null;
//         }

//         const user =  await db.select()
//             .from(users)
//             .where(eq(users.username, credentials.username))
//             .then(rows => rows[0]);

//         if (!user || !user.password) {
//           return null;
//         }

//         const isPasswordValid = await compare(credentials.password, user.password);

//         if (!isPasswordValid) {
//           return null;
//         }

//         return {
//           id: user.id.toString(),
//           username: user.username,
//           dailyCalorieGoal: user.dailyCalorieGoal ?? undefined,
//         };
//       }
//     })
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       console.log('is jwt callback')

//       if (user) {
//         return {
//           ...token,
//           id: user.id,
//           username: user.username,
//           dailyCalorieGoal: user.dailyCalorieGoal,
//         };
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       console.log('is session callback')
//       return {
//         ...session,
//         user: {
//           ...session.user,
//           id: token.id,
//           username: token.username,
//           dailyCalorieGoal: token.dailyCalorieGoal,
//         },
//       };
//     },
//     async signIn({ user, account, profile, email, credentials }) {
//       return true
//     },
//   },
// }

export const handlers = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
    session: {
    strategy: "jwt"
  },
  // pages: {
  //   signIn: "/auth/signin",
  //   signOut: "/auth/signout",
  // },
  providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: {},
        password: {}
      },
      authorize: async (credentials) => {
        console.log('entered credentials', credentials)
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user =  await db.select()
            .from(users)
            .where(eq(users.username, credentials.username))
            .then(rows => rows[0]);

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id.toString(),
          username: user.username,
          dailyCalorieGoal: user.dailyCalorieGoal ?? undefined,
        };
      }
    })
  ],
    callbacks: {
    async jwt({ token, user }) {
      console.log('is jwt callback')

      if (user) {
        return {
          ...token,
          id: user.id,
          username: user.username,
          dailyCalorieGoal: user.dailyCalorieGoal,
        };
      }
      return token;
    },
    async session({ session, token }) {
      console.log('is session callback')
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          username: token.username,
          dailyCalorieGoal: token.dailyCalorieGoal,
        },
      };
    },
    async signIn({ user, account, profile, email, credentials }) {
      return true
    },
  },
})


export { handlers as GET, handlers as POST }
