import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

// All routes require authentication + owner role (3) only
router.use(authenticate, authorize(3));

router.get('/', userController.getAll);
router.get('/count', userController.count);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.put('/:id/role', userController.updateRole);
router.put('/:id/toggle-active', userController.toggleActive);
router.put('/:id/password', userController.updatePassword);
router.delete('/:id', userController.delete);

export default router;
