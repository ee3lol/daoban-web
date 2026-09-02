import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function updateRole() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const result = await sql`
      UPDATE "user" 
      SET role = 'super_admin' 
      WHERE email = 'mhapsekarpooja1@gmail.com'
    `;
    console.log('Updated user role successfully!', result);
  } catch (error) {
    console.error('Failed to update role:', error);
  }
}

updateRole();
