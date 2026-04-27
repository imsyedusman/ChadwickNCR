import { db } from '../db';
import { users, userAuditLogs, departments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthService } from './auth.service';
import crypto from 'crypto';

export class UserService {
  static async getAllUsers() {
    return db.query.users.findMany({
      with: {
        department: true,
      },
      orderBy: (users, { asc }) => [asc(users.name)],
    });
  }

  static async getUserById(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        department: true,
      },
    });
  }

  static async createUser(data: {
    name: string;
    email: string;
    role: 'ADMIN' | 'QA_MANAGER' | 'HANDLER' | 'VIEWER';
    departmentId: string;
  }, actingUserId: string) {
    // Check if email exists
    const existing = await AuthService.findUserByEmail(data.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Generate temp password
    const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 chars
    const passwordHash = await AuthService.hashPassword(tempPassword);

    const [newUser] = await db.insert(users).values({
      ...data,
      passwordHash,
      isActive: true,
      mustChangePassword: true,
    }).returning();

    // Log creation
    await db.insert(userAuditLogs).values({
      targetUserId: newUser.id,
      actingUserId,
      action: 'USER_CREATED',
      details: { role: data.role, departmentId: data.departmentId },
    });

    return { user: newUser, tempPassword };
  }

  static async updateUser(id: string, data: {
    name?: string;
    role?: 'ADMIN' | 'QA_MANAGER' | 'HANDLER' | 'VIEWER';
    departmentId?: string;
  }, actingUserId: string) {
    const user = await this.getUserById(id);
    if (!user) throw new Error('User not found');

    const updates: any = {};
    const logDetails: any = {};

    if (data.name) updates.name = data.name;
    
    if (data.role && data.role !== user.role) {
      updates.role = data.role;
      logDetails.oldRole = user.role;
      logDetails.newRole = data.role;
      
      await db.insert(userAuditLogs).values({
        targetUserId: id,
        actingUserId,
        action: 'ROLE_CHANGE',
        details: { oldRole: user.role, newRole: data.role },
      });
    }

    if (data.departmentId && data.departmentId !== user.departmentId) {
      updates.departmentId = data.departmentId;
      logDetails.oldDeptId = user.departmentId;
      logDetails.newDeptId = data.departmentId;

      await db.insert(userAuditLogs).values({
        targetUserId: id,
        actingUserId,
        action: 'DEPT_CHANGE',
        details: { oldDeptId: user.departmentId, newDeptId: data.departmentId },
      });
    }

    if (Object.keys(updates).length === 0) return user;

    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  static async setUserStatus(id: string, isActive: boolean, actingUserId: string) {
    const [updatedUser] = await db.update(users)
      .set({ isActive })
      .where(eq(users.id, id))
      .returning();

    await db.insert(userAuditLogs).values({
      targetUserId: id,
      actingUserId,
      action: 'STATUS_CHANGE',
      details: { isActive },
    });

    return updatedUser;
  }

  static async resetPassword(id: string, actingUserId: string) {
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const passwordHash = await AuthService.hashPassword(tempPassword);

    await db.update(users)
      .set({ 
        passwordHash,
        mustChangePassword: true
      })
      .where(eq(users.id, id));

    await db.insert(userAuditLogs).values({
      targetUserId: id,
      actingUserId,
      action: 'PASSWORD_RESET',
      details: {},
    });

    return tempPassword;
  }

  static async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) throw new Error('User not found');

    const isValid = await AuthService.comparePassword(currentPassword, user.passwordHash);
    if (!isValid) throw new Error('Invalid current password');

    const newHash = await AuthService.hashPassword(newPassword);
    await db.update(users)
      .set({ 
        passwordHash: newHash,
        mustChangePassword: false
      })
      .where(eq(users.id, id));
  }

  static async forceChangePassword(id: string, newPassword: string) {
    const newHash = await AuthService.hashPassword(newPassword);
    await db.update(users)
      .set({ 
        passwordHash: newHash,
        mustChangePassword: false
      })
      .where(eq(users.id, id));
  }
}
