import { Router } from 'express';
import tableController from '../controllers/table.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

// Public routes
router.get('/qr/:qrCode', tableController.getByQrCode);

// Admin routes
router.get('/', authenticate, authorize(2, 3), tableController.getAll);
router.get('/active', authenticate, authorize(2, 3), tableController.getActive);
router.get('/:id', authenticate, authorize(2, 3), tableController.getById);
router.post('/', authenticate, authorize(2, 3), tableController.create);
router.put('/:id', authenticate, authorize(2, 3), tableController.update);
router.delete('/:id', authenticate, authorize(2, 3), tableController.delete);
router.get('/:id/products', authenticate, authorize(2, 3), tableController.getProducts);
router.put('/:id/products', authenticate, authorize(2, 3), tableController.setProducts);
router.get('/:id/qr', authenticate, authorize(2, 3), tableController.getQRCode);

export default router;
