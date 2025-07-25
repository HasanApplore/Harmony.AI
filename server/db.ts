import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

console.log('Environment variables:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'exists' : 'missing',
  NODE_ENV: process.env.NODE_ENV
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use HTTP connection instead of WebSocket to avoid connection issues
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// For backward compatibility, export a mock pool
export const pool = {
  query: sql,
  end: () => Promise.resolve(),
};