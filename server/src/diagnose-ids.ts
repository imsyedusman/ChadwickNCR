
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function diagnose() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('--- Database ID Diagnosis ---');
    
    // Check latest 10 NCRs
    const resNcrs = await pool.query('SELECT auto_id, title, created_at FROM ncrs ORDER BY auto_id DESC LIMIT 10');
    console.log('\nLatest NCR IDs in "ncrs" table:');
    console.table(resNcrs.rows);

    // Check counters
    const resCounters = await pool.query("SELECT * FROM counters WHERE name = 'ncr'");
    console.log('\nCurrent counter for "ncr" in "counters" table:');
    console.table(resCounters.rows);

    if (resCounters.rows.length > 0) {
        const currentValue = resCounters.rows[0].value;
        const nextIdValue = currentValue + 1;
        const nextIdStr = `NCR-${nextIdValue.toString().padStart(4, '0')}`;
        
        console.log(`\nNext generated ID will be: ${nextIdStr}`);

        const collision = await pool.query('SELECT auto_id FROM ncrs WHERE auto_id = $1', [nextIdStr]);
        if (collision.rows.length > 0) {
            console.log(`\n!!! COLLISION DETECTED !!!`);
            console.log(`The ID "${nextIdStr}" already exists in the "ncrs" table.`);
            console.log(`The counter is out of sync with the actual data.`);
        } else {
            console.log(`\nNo collision detected for the next ID.`);
        }
    } else {
        console.log('\nCounter entry for "ncr" not found.');
    }

    // Check for specific IDs from the error message
    const targetUserId = 'e57861b5-cef4-4854-a461-b0f9bcd8a9ab';
    const targetDeptId = '0349eb83-3e00-4f3e-b5a2-5ae1c13b7124';

    console.log('\n--- Foreign Key Verification ---');
    
    const userCheck = await pool.query('SELECT id, name FROM users WHERE id = $1', [targetUserId]);
    if (userCheck.rows.length > 0) {
        console.log(`User ${targetUserId} exists: ${userCheck.rows[0].name}`);
    } else {
        console.log(`!!! ERROR: User ${targetUserId} NOT FOUND !!!`);
    }

    const deptCheck = await pool.query('SELECT id, name FROM departments WHERE id = $1', [targetDeptId]);
    if (deptCheck.rows.length > 0) {
        console.log(`Department ${targetDeptId} exists: ${deptCheck.rows[0].name}`);
    } else {
        console.log(`!!! ERROR: Department ${targetDeptId} NOT FOUND !!!`);
    }

    console.log('\n--- All Users in Database ---');
    const allUsers = await pool.query('SELECT id, name, email FROM users');
    console.table(allUsers.rows);

  } catch (err) {
    console.error('\nDiagnosis failed:', err);
  } finally {
    await pool.end();
  }
}

diagnose();
