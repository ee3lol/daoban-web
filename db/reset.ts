import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function reset() {
  console.log('Dropping old tables...');
  await sql`DROP TABLE IF EXISTS favorites CASCADE`;
  await sql`DROP TABLE IF EXISTS watch_later CASCADE`;
  await sql`DROP TABLE IF EXISTS movies CASCADE`;
  await sql`DROP TABLE IF EXISTS rate_limits CASCADE`;
  await sql`DROP TABLE IF EXISTS sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  // Also drop any better-auth tables if they exist
  await sql`DROP TABLE IF EXISTS verification CASCADE`;
  await sql`DROP TABLE IF EXISTS account CASCADE`;
  await sql`DROP TABLE IF EXISTS session CASCADE`;
  await sql`DROP TABLE IF EXISTS "user" CASCADE`;
  console.log('All tables dropped successfully!');
}

reset().catch(console.error);
