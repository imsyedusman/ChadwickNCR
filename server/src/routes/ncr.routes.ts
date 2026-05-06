import { Router } from 'express';
import { db } from '../db';
import { ncrs, departments, capaActions, auditLogs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { NcrService } from '../services/ncr.service';
import { AuditService } from '../services/audit.service';

const router = Router();

router.use(authenticate);

router.get('/departments', async (req, res) => {
  try {
    const allDepts = await db.query.departments.findMany();
    res.json(allDepts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const allUsers = await db.query.users.findMany({
      columns: { id: true, name: true, role: true },
    });
    res.json(allUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const allNcrs = await db.query.ncrs.findMany({
      with: {
        issuedBy: true,
        issuedToDepartment: true,
        handler: true,
        capaActions: true,
        auditLogs: true,
      },
      orderBy: [desc(ncrs.createdAt)],
    });
    res.json(allNcrs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/capa-actions', async (req: AuthRequest, res) => {
  try {
    const actions = await db.query.capaActions.findMany({
      where: eq(capaActions.ownerId, req.user!.id),
      with: {
        ncr: {
          columns: {
            id: true,
            autoId: true,
            title: true,
          }
        },
      },
      orderBy: [desc(capaActions.dueDate)],
    });
    res.json(actions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db.query.auditLogs.findMany({
      with: {
        user: { columns: { name: true } },
        ncr: { columns: { autoId: true, title: true } },
      },
      orderBy: (logs, { desc }) => [desc(logs.timestamp)],
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authorize(['ADMIN', 'QA_MANAGER', 'HANDLER']), async (req: AuthRequest, res) => {
  try {
    const ncr = await NcrService.createNcr(req.body, req.user!.id);
    res.status(201).json(ncr);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    console.log(`[GET /api/ncrs/${req.params.id}] Fetching NCR...`);
    const ncr = await db.query.ncrs.findFirst({
      where: eq(ncrs.id, req.params.id as string),
      with: {
        issuedBy: true,
        issuedToDepartment: true,
        handler: true,
        capaActions: { with: { owner: true } },
        auditLogs: { with: { user: true }, orderBy: (logs, { desc }) => [desc(logs.timestamp)] },
        signatures: { with: { user: true } },
      },
    });

    if (!ncr) {
      console.warn(`[GET /api/ncrs/${req.params.id}] NCR not found in database`);
      return res.status(404).json({ error: 'NCR not found' });
    }

    console.log(`[GET /api/ncrs/${req.params.id}] Found NCR: ${ncr.autoId} - ${ncr.title}`);
    res.json(ncr);
  } catch (error: any) {
    console.error(`[GET /api/ncrs/${req.params.id}] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const data = req.body;

    // Prevent updating protected fields
    delete data.id;
    delete data.autoId;
    delete data.status;

    const [updated] = await db
      .update(ncrs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ncrs.id, req.params.id as string))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res) => {
  const { status, reason } = req.body;
  try {
    const updated = await NcrService.updateStatus(req.params.id as string, req.user!.id, req.user!.role, status, reason);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/rca', async (req: AuthRequest, res) => {
  try {
    const { rootCauseAnalysis } = req.body;
    const [updated] = await db.update(ncrs)
      .set({ rootCauseAnalysis, updatedAt: new Date() })
      .where(eq(ncrs.id, req.params.id as string))
      .returning();

    if (updated) {
      await AuditService.log(updated.id, req.user!.id, 'RCA_UPDATE', { count: rootCauseAnalysis?.length || 0 });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/capa', authorize(['ADMIN', 'QA_MANAGER', 'HANDLER']), async (req: AuthRequest, res) => {
  try {
    const { description, ownerId, dueDate } = req.body;
    const action = await db.insert(capaActions).values({
      ncrId: req.params.id as string,
      description,
      ownerId,
      dueDate: new Date(dueDate),
      status: 'PENDING',
    }).returning();
    res.status(201).json(action[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/capa/:actionId', async (req, res) => {
  try {
    const { status, completionPercentage } = req.body;
    const updated = await db.update(capaActions)
      .set({ status, completionPercentage, updatedAt: new Date() })
      .where(eq(capaActions.id, req.params.actionId as string))
      .returning();
    res.json(updated[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/sign', async (req: AuthRequest, res) => {
  const { stage, metadata } = req.body;
  try {
    await NcrService.signOff(req.params.id as string, req.user!.id, stage, metadata);
    res.status(204).end();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
