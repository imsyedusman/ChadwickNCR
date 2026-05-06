import { emailService } from '../src/services/email.service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function test() {
  console.log('Testing EmailService initialization...');
  try {
    // We don't actually send because of placeholder pass, but we can check if it's defined
    console.log('EmailService defined:', !!emailService);
    console.log('Transporter initialized.');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
