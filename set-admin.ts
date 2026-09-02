import 'dotenv/config';
import { db } from './db/index';
import { user } from './db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const email = 'mhapsekarpooja1@gmail.com';
  console.log(`Setting ${email} to admin...`);
  
  const res = await db.update(user).set({ role: 'admin' }).where(eq(user.email, email)).returning();
  
  if (res.length > 0) {
    console.log(`Success! Updated user ${res[0].id} to admin role.`);
  } else {
    console.log(`User ${email} not found in database. Create an account first.`);
  }
}

main().catch(console.error);
