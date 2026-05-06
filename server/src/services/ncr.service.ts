import { db } from '../db';
import { ncrs, counters, auditLogs, signatures, users, departments } from '../db/schema';
import { eq, sql, or, and } from 'drizzle-orm';
import { AuditService } from './audit.service';
import { emailService } from './email.service';

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

  static async updateNcrFields(ncrId: string, data: any, userId: string) {
    const oldNcr = await db.query.ncrs.findFirst({
      where: eq(ncrs.id, ncrId),
    });

    if (!oldNcr) throw new Error('NCR not found');

    const [updated] = await db
      .update(ncrs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ncrs.id, ncrId))
      .returning();

    // Trigger: NCR Assigned to Owner (Fire-and-Forget)
    if (data.handlerId && data.handlerId !== oldNcr.handlerId) {
      (async () => {
        try {
          const fullNcr = await db.query.ncrs.findFirst({
            where: eq(ncrs.id, ncrId),
            with: {
              handler: true,
              issuedToDepartment: true,
            }
          });
          const actingUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
          if (fullNcr?.handler?.email) {
            emailService.notifyNcrAssigned(fullNcr, fullNcr.handler.email, actingUser?.name || 'System');
          }
        } catch (err) {
          console.error('[NcrService] Assignment notification background task failed:', err);
        }
      })();
    }

    return updated;
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
        ...(newStatus === 'CLOSED' ? { dateClosed: new Date() } : {}),
        ...(newStatus !== 'CLOSED' && ncr.status === 'CLOSED' ? { dateClosed: null } : {}),
        ...(newStatus === 'CANCELLED' || newStatus === 'REJECTED' ? { cancellationReason: reason, cancellationUserId: userId } : {})
      })
      .where(eq(ncrs.id, ncrId))
      .returning();

    await AuditService.log(ncrId, userId, 'STATUS_CHANGE', { from: ncr.status, to: newStatus, reason });

    // --- Notification Triggers (Fire-and-Forget) ---
    (async () => {
      try {
        const actingUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
        const actingUserName = actingUser?.name || 'System';

        // Load full NCR with relations for notifications
        const fullNcr = await db.query.ncrs.findFirst({
          where: eq(ncrs.id, ncrId),
          with: {
            issuedBy: true,
            handler: true,
            issuedToDepartment: { with: { users: true } },
          }
        });

        if (!fullNcr) return;

        const recipients = new Set<string>();
        const addRecipient = (user: any) => { if (user?.email) recipients.add(user.email); };

        // Get Dept Handler
        const deptHandlerId = fullNcr.issuedToDepartment?.primaryHandlerId;
        let deptHandler: any = null;
        if (deptHandlerId) {
          deptHandler = await db.query.users.findFirst({ where: eq(users.id, deptHandlerId) });
        }

        // 1. NCR Created/Issued (DRAFT -> ASSIGNED)
        if (newStatus === 'ASSIGNED' && ncr.status === 'DRAFT') {
          recipients.clear();
          addRecipient(deptHandler);
          addRecipient(fullNcr.handler);
          emailService.notifyNcrIssued(fullNcr, Array.from(recipients));
        }

        // 3. Status Change (General)
        recipients.clear();
        addRecipient(fullNcr.handler);
        addRecipient(deptHandler);
        addRecipient(fullNcr.issuedBy);
        emailService.notifyStatusChange(fullNcr, Array.from(recipients), ncr.status, newStatus, actingUserName);

        // 5. Verification Required
        if (newStatus === 'AWAITING_APPROVAL' || newStatus === 'VERIFICATION') {
          recipients.clear();
          // Users with QA_MANAGER role in the relevant department
          const verifiers = await db.query.users.findMany({
            where: and(
              eq(users.departmentId, fullNcr.issuedToDepartmentId),
              eq(users.role, 'QA_MANAGER')
            )
          });
          verifiers.forEach(addRecipient);

          // Fallback to Admins if no verifiers assigned to dept
          if (recipients.size === 0) {
            const admins = await db.query.users.findMany({ where: eq(users.role, 'ADMIN') });
            admins.forEach(addRecipient);
          }
          emailService.notifyVerificationRequired(fullNcr, Array.from(recipients), actingUserName);
        }

        // 6. Verification Rejected
        if (newStatus === 'REJECTED') {
          recipients.clear();
          addRecipient(fullNcr.handler);
          addRecipient(deptHandler);
          emailService.notifyVerificationRejected(fullNcr, Array.from(recipients), actingUserName, reason || 'No reason provided');
        }

        // 7. NCR Closed
        if (newStatus === 'CLOSED') {
          recipients.clear();
          addRecipient(fullNcr.handler);
          addRecipient(fullNcr.issuedBy);
          addRecipient(deptHandler);
          emailService.notifyNcrClosed(fullNcr, Array.from(recipients), actingUserName);
        }

        // 8. NCR Cancelled
        if (newStatus === 'CANCELLED') {
          recipients.clear();
          addRecipient(fullNcr.handler);
          addRecipient(deptHandler);
          addRecipient(fullNcr.issuedBy);
          emailService.notifyNcrCancelled(fullNcr, Array.from(recipients), actingUserName, reason || 'No reason provided');
        }
      } catch (err) {
        console.error('[NcrService] Notification background task failed:', err);
      }
    })();

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
