const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testUpdate() {
  try {
    // Find a DRAFT NCR
    const res = await pool.query("SELECT id FROM ncrs WHERE status = 'DRAFT' LIMIT 1");
    if (res.rows.length === 0) {
      console.log('No DRAFT NCR found');
      return;
    }
    const id = res.rows[0].id;
    console.log(`Testing update for NCR ${id}...`);

    // Try to update to ASSIGNED
    const updateRes = await pool.query(
      'UPDATE ncrs SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *',
      ['ASSIGNED', new Date(), id]
    );
    console.log('Update successful:', updateRes.rows[0].status);
  } catch (err) {
    console.error('Error during update:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
  } finally {
    await pool.end();
  }
}

testUpdate();
