const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkFunction() {
  try {
    const res = await pool.query("SELECT prosrc FROM pg_proc WHERE proname = 'check_issued_at_immutability'");
    if (res.rows.length > 0) {
      console.log('Function Source:', res.rows[0].prosrc);
    } else {
      console.log('Function not found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkFunction();
