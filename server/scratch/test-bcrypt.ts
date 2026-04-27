
import bcrypt from 'bcryptjs';

async function test() {
  const password = 'Chadwick@2026';
  console.log('Hashing password:', password);
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated Hash:', hash);
  
  const match = await bcrypt.compare(password, hash);
  console.log('Match:', match);
  
  const wrongMatch = await bcrypt.compare('wrong', hash);
  console.log('Wrong Match:', wrongMatch);
}

test().catch(console.error);
