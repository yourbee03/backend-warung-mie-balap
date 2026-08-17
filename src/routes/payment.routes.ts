import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import {
  getPaymentByOrderIdSchema,
  getPaymentByIdSchema,
  createPaymentSchema,
  confirmPaymentSchema,
  rejectPaymentSchema,
  getAllPaymentsSchema,
} from '../validators/payment.validator';

const router = Router();

// User routes
router.get('/order/:orderId', authenticate, validate(getPaymentByOrderIdSchema), paymentController.getByOrderId);
router.post('/', authenticate, validate(createPaymentSchema), paymentController.create);

// Admin routes
router.get('/', authenticate, authorize(2, 3), validate(getAllPaymentsSchema), paymentController.getAll);
router.get('/:id', authenticate, authorize(2, 3), validate(getPaymentByIdSchema), paymentController.getById);
router.put('/:id/confirm', authenticate, authorize(2, 3), validate(confirmPaymentSchema), paymentController.confirmPayment);
router.put('/:id/reject', authenticate, authorize(2, 3), validate(rejectPaymentSchema), paymentController.rejectPayment);

export default router;
