const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  try {
    const res = await pool.query('SELECT * FROM users');
    console.log('Users found:', res.rows.length);
    res.rows.forEach(u => {
      console.log(`- ${u.name} (${u.email}), Role: ${u.role}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
