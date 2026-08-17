import { Router } from 'express';
import paymentGatewayController from '../controllers/paymentGateway.controller';

const router = Router();

// Public webhook endpoint (no auth)
router.post('/webhook', paymentGatewayController.handleWebhook);

// Authenticated user routes
router.post('/create-qris', paymentGatewayController.createQrisPayment);
router.get('/status/:orderId', paymentGatewayController.getQrisStatus);

export default router;
