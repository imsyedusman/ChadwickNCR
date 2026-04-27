const { Client } = require('pg');
const client = new Client('postgresql://ncr_user:Developer%402k25%21@localhost:5432/chadwick_ncr');

client.connect().then(async () => {
  try {
    await client.query(`
      insert into ncrs (auto_id, title, description, severity, status, project_id, location, category, issued_by_user_id, issued_to_department_id) 
      values ('NCR-0001', 'asdasd', 'asdadsasd', 'MAJOR', 'DRAFT', '234234', 'SITE', 'SAFETY', (select id from users limit 1), (select id from departments limit 1))
    `);
    console.log('success');
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    client.end();
  }
});
