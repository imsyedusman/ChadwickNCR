import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export class AuthService {
  static async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  static generateToken(user: { id: string; role: string; departmentId: string; mustChangePassword: boolean }) {
    return jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        departmentId: user.departmentId,
        mustChangePassword: user.mustChangePassword 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static async findUserByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }
}
