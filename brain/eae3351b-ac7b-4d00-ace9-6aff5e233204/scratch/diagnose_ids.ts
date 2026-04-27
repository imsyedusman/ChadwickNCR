
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the server directory
dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function diagnose() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('--- Database Diagnosis ---');
    
    // Check ncrs
    const resNcrs = await pool.query('SELECT auto_id FROM ncrs ORDER BY auto_id DESC LIMIT 5');
    console.log('Latest NCR IDs in table:');
    console.table(resNcrs.rows);

    // Check counters
    const resCounters = await pool.query("SELECT * FROM counters WHERE name = 'ncr'");
    console.log('Current counter for "ncr":');
    console.table(resCounters.rows);

    // Check if there is a collision
    if (resCounters.rows.length > 0) {
        const nextId = `NCR-${(resCounters.rows[0].value + 1).toString().padStart(4, '0')}`;
        const collision = await pool.query('SELECT id FROM ncrs WHERE auto_id = $1', [nextId]);
        if (collision.rows.length > 0) {
            console.log(`\n!!! COLLISION DETECTED !!!`);
            console.log(`Next generated ID would be ${nextId}, but it already exists in the ncrs table.`);
        } else {
            console.log(`\nNext ID ${nextId} is available.`);
        }
    }

  } catch (err) {
    console.error('Diagnosis failed:', err);
  } finally {
    await pool.end();
  }
}

diagnose();
