const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateRole() {
  try {
    const res = await pool.query(
      `UPDATE "user" SET role = 'super_admin' WHERE email = 'mhapsekarpooja1@gmail.com'`
    );
    console.log(`Updated ${res.rowCount} row(s)`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

updateRole();
