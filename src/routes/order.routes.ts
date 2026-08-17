import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import {
  getAllOrdersSchema,
  getOrderByIdSchema,
  getByOrderNumberSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  deleteOrderSchema,
} from '../validators/order.validator';

const router = Router();

// Public routes (QR order)
router.post('/qr', validate(createOrderSchema), orderController.create);
router.get('/track/:orderNumber', validate(getByOrderNumberSchema), orderController.getByOrderNumber);

// Admin routes — static paths BEFORE :id
router.get('/admin/all', authenticate, authorize(2, 3), validate(getAllOrdersSchema), orderController.getAllAdmin);
router.post('/admin/create', authenticate, authorize(2, 3), validate(createOrderSchema), orderController.adminCreate);

// Authenticated user routes — :id LAST
router.get('/', authenticate, validate(getAllOrdersSchema), orderController.getAll);
router.get('/:id', authenticate, validate(getOrderByIdSchema), orderController.getById);
router.post('/', authenticate, validate(createOrderSchema), orderController.create);
router.put('/:id/status', authenticate, authorize(2, 3), validate(updateOrderStatusSchema), orderController.updateStatus);
router.delete('/:id', authenticate, authorize(2, 3), validate(deleteOrderSchema), orderController.delete);

export default router;
