import { Router } from 'express';
import bannerController from '../controllers/banner.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.get('/', bannerController.getAll);
router.get('/active', bannerController.getActive);
router.get('/:id', bannerController.getById);
router.post('/', authenticate, authorize(2, 3), bannerController.create);
router.put('/:id', authenticate, authorize(2, 3), bannerController.update);
router.delete('/:id', authenticate, authorize(2, 3), bannerController.delete);

export default router;
