import { Router } from 'express';
import settingController from '../controllers/setting.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.get('/', settingController.getAll);
router.put('/', authenticate, authorize(2, 3), settingController.update);

export default router;
