import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Only set WebSocket constructor if it's not already defined
if (typeof WebSocket === 'undefined') {
  console.log('WebSocket not found, configuring ws package for production...');
  import('ws').then(ws => {
    neonConfig.webSocketConstructor = ws.default;
  });
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
