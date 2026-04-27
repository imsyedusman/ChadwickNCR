import { db } from '../db';
import { departments, users, ncrs } from '../db/schema';
import { eq, count, or } from 'drizzle-orm';

export class DepartmentService {
  static async getAllDepartments() {
    return db.query.departments.findMany({
      orderBy: (departments, { asc }) => [asc(departments.name)],
    });
  }

  static async createDepartment(name: string) {
    const [newDept] = await db.insert(departments).values({ name }).returning();
    return newDept;
  }

  static async updateDepartment(id: string, data: { name?: string; primaryHandlerId?: string | null }) {
    const [updatedDept] = await db.update(departments)
      .set(data)
      .where(eq(departments.id, id))
      .returning();
    return updatedDept;
  }

  static async deleteDepartment(id: string) {
    // Check for active users
    const userCountResult = await db.select({ value: count() }).from(users).where(eq(users.departmentId, id));
    const userCount = userCountResult[0].value;
    if (userCount > 0) {
      throw new Error(`Cannot delete department: ${userCount} active user(s) are assigned to it.`);
    }

    // Check for active NCRs (issued to this department)
    const ncrCountResult = await db.select({ value: count() }).from(ncrs).where(eq(ncrs.issuedToDepartmentId, id));
    const ncrCount = ncrCountResult[0].value;
    if (ncrCount > 0) {
      throw new Error(`Cannot delete department: ${ncrCount} NCR(s) are associated with it.`);
    }

    await db.delete(departments).where(eq(departments.id, id));
  }
}
