import { Router } from 'express';
import orderController from '../controllers/order.controller';
import tableController from '../controllers/table.controller';
import { validate } from '../middlewares/validation.middleware';
import { createOrderSchema } from '../validators/order.validator';

const router = Router();

// QR Order routes - no authentication needed
router.get('/table/:tableId', tableController.getByTableId);
router.post('/order', validate(createOrderSchema), orderController.create);
router.get('/track/:orderNumber', orderController.getByOrderNumber);

export default router;
