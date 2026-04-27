import { db } from './index';
import { departments, users } from './schema';
import { AuthService } from '../services/auth.service';
import { eq, sql } from 'drizzle-orm';

async function seed() {
  const dbUrl = process.env.DATABASE_URL || 'UNDEFINED';
  const maskedUrl = dbUrl.replace(/\/\/.*@/, '//****:****@');
  
  console.log('🌱 Seeding database...');
  console.log(`📡 Connection: ${maskedUrl}`);

  try {
    // 1. Seed Departments
    const departmentNames = [
      'Management',
      'Operations',
      'Engineering',
      'Procurement',
      'Production',
      'Administration',
      'Testing & QA',
      'Assembly',
      'Wiring',
      'Site Works',
    ];

    console.log('🏢 Processing departments...');
    for (const name of departmentNames) {
      const existing = await db.query.departments.findFirst({
        where: eq(departments.name, name),
      });
      if (!existing) {
        await db.insert(departments).values({ name });
        console.log(`  + Created Department: ${name}`);
      } else {
        console.log(`  - Department exists: ${name}`);
      }
    }

    const allDepts = await db.query.departments.findMany();
    const deptMap = Object.fromEntries(allDepts.map((d) => [d.name, d.id]));

    // 2. Seed Users
    const defaultPassword = 'Chadwick@2026';
    const passwordHash = await AuthService.hashPassword(defaultPassword);

    const userData = [
      { name: 'Alex Alvarado', email: 'alexalvapsn@hotmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Brendan Thomas Williams', email: 'brendan.williams13b@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Chris Walsh', email: 'chris@redarrowconsulting.com.au', role: 'ADMIN', department: 'Management' },
      { name: 'Christine Fittler', email: 'reception@chadwickswitchboards.com.au', role: 'VIEWER', department: 'Administration' },
      { name: 'Dirk Lopez', email: 'joe@chadwickswitchboards.com.au', role: 'ADMIN', department: 'Operations' },
      { name: 'Dona Combatti', email: 'admin@chadwickswitchboards.com.au', role: 'VIEWER', department: 'Administration' },
      { name: 'Farina Hasan', email: 'farina@chadwickswitchboards.com.au', role: 'ADMIN', department: 'Management' },
      { name: 'Geovane De Alencar', email: 'alencar.geovane@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Gleidson Sampaio Cavalcante', email: 'dj.gleidson@yahoo.com.br', role: 'HANDLER', department: 'Production' },
      { name: 'Huy The (Gary) Hos', email: 'ps.safepowerservices@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'James Keegan', email: 'jkeegan@chadwickswitchboards.com.au', role: 'ADMIN', department: 'Management' },
      { name: 'Jarrod Hanania', email: 'jhanania@chadwickswitchboards.com.au', role: 'HANDLER', department: 'Operations' },
      { name: 'Jason Kuy', email: 'jason.k8484@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Joshua Salem', email: 'joshuasalem72@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Justin Hristovski', email: 'justinhrist@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Keala Davey', email: 'keala.davey203@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Khanh Han Nguyen', email: 'handuyenjw@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Loc Lu', email: 'locluwp@live.com', role: 'HANDLER', department: 'Production' },
      { name: 'Luke Samuel Sultan', email: 'alsultana2903@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Mark Cochrane', email: 'markcochrane@fryingpan.org', role: 'HANDLER', department: 'Production' },
      { name: 'Mark Pitts', email: 'mark82@live.co.uk', role: 'HANDLER', department: 'Production' },
      { name: 'Martin James', email: 'martin.james@live.com.au', role: 'HANDLER', department: 'Production' },
      { name: 'Matthew Maroney', email: 'matthew.maroney7@outlook.com', role: 'HANDLER', department: 'Production' },
      { name: 'Minh Dang Tran', email: 'reason2realize@hotmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Moein Adhami', email: 'moein@chadwickswitchboards.com.au', role: 'HANDLER', department: 'Engineering' },
      { name: 'Muhammad Raqeeb Mohamed Zaky', email: 'raqeebzaky@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Nguyen Quoc Vu Nguyen', email: 'nnqv21@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Nithin Ramadevan', email: 'nithin@chadwickswitchboards.com.au', role: 'HANDLER', department: 'Engineering' },
      { name: 'Petaia Phoenix Mataio', email: 'petaiamataio08@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Peter Hong', email: 'peterh@chadwickswitchboards.com.au', role: 'QA_MANAGER', department: 'Engineering' },
      { name: 'Peter Stathakis', email: 'peter.stathakis.93@hotmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Raj Chandiok', email: 'rchandiok@chadwickswitchboards.com.au', role: 'ADMIN', department: 'Management' },
      { name: 'Rakesh Jaiswal', email: 'rrjaiswal777@yahoo.com.au', role: 'HANDLER', department: 'Production' },
      { name: 'Sofie Devine', email: 'sdevine@bovara.com.au', role: 'ADMIN', department: 'Management' },
      { name: 'Steven Dick', email: 'jalirunn@gmail.com', role: 'HANDLER', department: 'Production' },
      { name: 'Syed Usman', email: 'susman@chadwickswitchboards.com.au', role: 'ADMIN', department: 'Management' },
      { name: 'Tat Hung Nguyen', email: 'ngtathung@yahoo.com', role: 'HANDLER', department: 'Production' },
      { name: 'Tony Chut', email: 'chu@chadwickswitchboards.com.au', role: 'HANDLER', department: 'Engineering' },
      { name: 'Victor Hugo Sarria Garcia', email: 'vsarria@chadwickswitchboards.com.au', role: 'HANDLER', department: 'Engineering' },
      { name: 'Zeeshan Zafar', email: 'zeeshanz@chadwickswitchboards.com.au', role: 'HANDLER', department: 'Procurement' },
      { name: 'Zongquan Zhu', email: 'zongquanzhu@gmail.com', role: 'HANDLER', department: 'Production' },
    ];

    console.log('👤 Processing users...');
    for (const user of userData) {
      const email = user.email.toLowerCase().trim();
      const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      const deptId = deptMap[user.department];
      if (!deptId) {
        console.error(`  ❌ Department not found for user ${user.name}: ${user.department}`);
        continue;
      }

      if (!existing) {
        await db.insert(users).values({
          name: user.name,
          email,
          passwordHash,
          role: user.role as any,
          departmentId: deptId,
          mustChangePassword: true,
          isActive: true,
        });
        console.log(`  + Created User: ${email}`);
      } else {
        // FORCE update everything
        await db.update(users)
          .set({
            name: user.name,
            passwordHash,
            role: user.role as any,
            departmentId: deptId,
            mustChangePassword: true,
            isActive: true, // Ensure they are active
          })
          .where(eq(users.id, existing.id));
        console.log(`  ↻ Updated User: ${email}`);
      }
    }

    console.log('✅ Seeding complete! All passwords reset to: Chadwick@2026');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with error:');
    console.error(err);
    process.exit(1);
  }
}

seed().catch((err) => {
  console.error('❌ Unhandled seeding error:', err);
  process.exit(1);
});
