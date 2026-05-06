const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  try {
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ncrs'");
    console.log('Columns:', cols.rows.map(r => r.column_name));

    const triggers = await pool.query("SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'ncrs'");
    console.log('Triggers:', triggers.rows.map(r => r.trigger_name));

    if (triggers.rows.length > 0) {
      for (const t of triggers.rows) {
        const def = await pool.query(`SELECT pg_get_triggerdef(oid) FROM pg_trigger WHERE tgname = $1`, [t.trigger_name]);
        console.log(`Trigger ${t.trigger_name} definition:`, def.rows[0].pg_get_triggerdef);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
