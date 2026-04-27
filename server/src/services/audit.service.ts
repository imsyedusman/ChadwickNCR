import { db } from '../db';
import { auditLogs } from '../db/schema';

export class AuditService {
  static async log(ncrId: string, userId: string, action: string, details: any = {}) {
    await db.insert(auditLogs).values({
      ncrId,
      userId,
      action,
      details,
    });
  }
}
