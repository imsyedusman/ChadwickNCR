import { db } from '../db';
import { ncrs, counters, auditLogs, signatures } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { AuditService } from './audit.service';

export class NcrService {
  static async generateAutoId() {
    const [counter] = await db
      .insert(counters)
      .values({ name: 'ncr', value: 1 })
      .onConflictDoUpdate({
        target: counters.name,
        set: { value: sql`${counters.value} + 1` },
      })
      .returning();
    
    return `NCR-${counter.value.toString().padStart(4, '0')}`;
  }

  static async createNcr(data: any, userId: string) {
    const autoId = await this.generateAutoId();
    const [ncr] = await db
      .insert(ncrs)
      .values({
        ...data,
        autoId,
        issuedByUserId: userId,
        status: 'DRAFT',
      })
      .returning();
    
    await AuditService.log(ncr.id, userId, 'CREATE', { ncrId: autoId });
    return ncr;
  }

  static async updateStatus(ncrId: string, userId: string, userRole: string, newStatus: string, reason?: string) {
    const ncr = await db.query.ncrs.findFirst({
      where: eq(ncrs.id, ncrId),
    });

    if (!ncr) throw new Error('NCR not found');

    // Role-based transition logic
    const isQA = userRole === 'ADMIN' || userRole === 'QA_MANAGER';
    const isHandler = userRole === 'HANDLER';

    // Transition rules
    if (!isQA) {
      // Handlers locked to linear forward progression only
      const isValidLinear = (
        (newStatus === 'ASSIGNED' && ncr.status === 'DRAFT') ||
        (newStatus === 'AWAITING_APPROVAL' && ncr.status === 'ASSIGNED')
      );
      
      if (!isValidLinear || !isHandler) {
        throw new Error('Unauthorized transition or permission denied. Handlers are locked to linear forward progression.');
      }
    }

    // Rejected status logic: must be available from Awaiting Approval and Approved
    if (newStatus === 'REJECTED') {
      if (!isQA) throw new Error('Only QA Managers can reject records');
      if (ncr.status !== 'AWAITING_APPROVAL' && ncr.status !== 'APPROVED') {
        throw new Error('Rejection is only valid from Awaiting Approval or Approved status');
      }
    }

    // Closed logic
    if (newStatus === 'CLOSED') {
      if (!isQA) throw new Error('Only QA Managers can close records');
    }

    // Cancelled logic
    if (newStatus === 'CANCELLED') {
      if (!isQA) throw new Error('Only QA Managers can cancel records');
    }

    // Stage-gating logic
    if (ncr.status === 'DRAFT' && newStatus !== 'DRAFT' && newStatus !== 'CANCELLED') {
      if (!ncr.issuedToDepartmentId) {
        throw new Error('Issued To (Department) is required before moving out of Draft');
      }
    }

    const [updated] = await db
      .update(ncrs)
      .set({ 
        status: newStatus as any, 
        updatedAt: new Date(),
        ...(newStatus === 'CANCELLED' || newStatus === 'REJECTED' ? { cancellationReason: reason, cancellationUserId: userId } : {})
      })
      .where(eq(ncrs.id, ncrId))
      .returning();

    await AuditService.log(ncrId, userId, 'STATUS_CHANGE', { from: ncr.status, to: newStatus, reason });
    return updated;
  }

  static async signOff(ncrId: string, userId: string, stage: string, metadata: any = {}) {
    await db.insert(signatures).values({
      ncrId,
      userId,
      stage,
      metadata,
    });
    
    await AuditService.log(ncrId, userId, 'SIGN_OFF', { stage });
  }
}
