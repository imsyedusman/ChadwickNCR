import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { UserService } from '../services/user.service';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = email?.toLowerCase().trim();
    console.log(`[DEBUG] Login Attempt: "${normalizedEmail}" (Length: ${normalizedEmail?.length})`);
    
    const user = await AuthService.findUserByEmail(normalizedEmail);
    if (!user) {
      console.log(`[DEBUG] User not found in database: "${normalizedEmail}"`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`[DEBUG] User found! ID: ${user.id}`);
    console.log(`[DEBUG] Password Length Received: ${password?.length}`);
    console.log(`[DEBUG] Stored Hash Prefix: ${user.passwordHash.substring(0, 10)}...`);

    const isMatch = await AuthService.comparePassword(password, user.passwordHash);
    console.log(`[DEBUG] Bcrypt Match Result: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = AuthService.generateToken(user);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        role: user.role, 
        departmentId: user.departmentId,
        mustChangePassword: user.mustChangePassword
      } 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/change-password-enforced', authenticate, async (req: AuthRequest, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }
    await UserService.forceChangePassword(req.user!.id, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
