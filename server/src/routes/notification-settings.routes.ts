import { Router } from 'express';
import { db } from '../db';
import { notificationSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

// GET settings
router.get('/', async (req, res) => {
  try {
    let settings = await db.query.notificationSettings.findFirst({
      where: eq(notificationSettings.id, 1),
    });

    if (!settings) {
      // Initialize if doesn't exist
      const [newSettings] = await db.insert(notificationSettings).values({ id: 1 }).returning();
      settings = newSettings;
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH settings
router.patch('/', async (req, res) => {
  try {
    const data = req.body;
    delete data.id; // Prevent changing ID
    
    const [updated] = await db
      .update(notificationSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notificationSettings.id, 1))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
