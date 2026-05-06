import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkUsers() {
  console.log('Checking users in database...');
  try {
    const allUsers = await db.query.users.findMany();
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(u => {
      console.log(`- ${u.name} (${u.email}), Role: ${u.role}, Active: ${u.isActive}`);
    });
  } catch (err) {
    console.error('Failed to check users:', err);
  }
}

checkUsers();
