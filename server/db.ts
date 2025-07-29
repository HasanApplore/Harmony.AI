import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

console.log('Environment variables:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'exists' : 'missing',
  NODE_ENV: process.env.NODE_ENV
});

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not set - application will not function correctly");
  throw new Error("DATABASE_URL environment variable is required");
}

// Initialize database connection with improved error handling
let db: any = null;
let pool: any = null;

try {
  // Create a connection to the Neon serverless PostgreSQL database
  const sql = neon(process.env.DATABASE_URL);
  
  // Test the connection with a simple query
  sql('SELECT 1 AS test')
    .then(() => console.log('✅ Database connection test successful'))
    .catch(err => console.error('❌ Database connection test failed:', err.message));
  
  // Initialize Drizzle ORM with the connection
  db = drizzle(sql, { schema });
  
  // Set up the pool for raw queries
  pool = {
    query: sql,
    end: () => Promise.resolve(),
  };
  
  console.log('✅ Database connection initialized');
} catch (error) {
  console.error('❌ Database connection failed:', (error as Error).message);
  console.error('Please check your DATABASE_URL environment variable and ensure your database is accessible');
  throw new Error(`Database connection failed: ${(error as Error).message}`);
}

export { db, pool };