import { Router } from 'express';
import shippingController from '../controllers/shipping.controller';

const router = Router();

router.post('/calculate', shippingController.calculate);

export default router;
