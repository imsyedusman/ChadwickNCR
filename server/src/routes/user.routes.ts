import { Router } from 'express';
import { UserService } from '../services/user.service';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Admin only routes
router.get('/', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    console.log(`[DEBUG] Fetched ${users.length} users for admin ${req.user!.id}`);
    res.json(users);
  } catch (error: any) {
    console.error(`[ERROR] Failed to fetch users:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { name, email, role, departmentId } = req.body;
    const result = await UserService.createUser({ name, email, role, departmentId }, req.user!.id);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { name, role, departmentId } = req.body;
    const user = await UserService.updateUser(req.params.id as string, { name, role, departmentId }, req.user!.id);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/status', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { isActive } = req.body;
    const user = await UserService.setUserStatus(req.params.id as string, isActive, req.user!.id);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/reset-password', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const tempPassword = await UserService.resetPassword(req.params.id as string, req.user!.id);
    res.json({ tempPassword });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Self-service routes
router.patch('/me/password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await UserService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
