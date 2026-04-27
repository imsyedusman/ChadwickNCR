import { Router } from 'express';
import { DepartmentService } from '../services/department.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Publicly readable for authenticated users
router.get('/', authenticate, async (req, res) => {
  try {
    const depts = await DepartmentService.getAllDepartments();
    res.json(depts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin only routes
router.post('/', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { name } = req.body;
    const dept = await DepartmentService.createDepartment(name);
    res.status(201).json(dept);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { name, primaryHandlerId } = req.body;
    const dept = await DepartmentService.updateDepartment(req.params.id, { name, primaryHandlerId });
    res.json(dept);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    await DepartmentService.deleteDepartment(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
