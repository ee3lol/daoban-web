import { db } from './db/index';
import { session } from './db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const res = await db.select().from(session).where(eq(session.token, 'test')).execute();
    console.log('Success:', res);
  } catch (e) {
    console.error('Error:', e);
  }
}
main();
