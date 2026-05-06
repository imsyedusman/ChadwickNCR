const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const email = 'susman@chadwickswitchboards.com.au';
  try {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      console.log('User not found');
      return;
    }
    const user = res.rows[0];
    console.log('User found:', user.email);
    console.log('Stored Hash:', user.password_hash);

    const passwordsToTest = ['Developer@2k25!', 'Developer@2k26!'];
    for (const pwd of passwordsToTest) {
      const match = await bcrypt.compare(pwd, user.password_hash);
      console.log(`Testing "${pwd}": ${match ? 'MATCH' : 'NO MATCH'}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
