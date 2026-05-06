import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the server directory regardless of where the process is started
dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL is not set in environment variables. Drizzle may fail to connect.');
} else {
  console.log(`[DB] Connecting to: ${process.env.DATABASE_URL.split('@')[1]}`);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
