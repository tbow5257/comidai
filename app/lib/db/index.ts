import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Configure WebSocket for server-side only
// if (process.env.NODE_ENV !== 'production') {
//   neonConfig.webSocketConstructor = ws;
// } else {
  // In production (edge/serverless), WebSocket is globally available
  neonConfig.webSocketConstructor = WebSocket;
// }

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
