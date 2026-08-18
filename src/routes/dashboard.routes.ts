import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

// Public routes
router.get('/top-products', dashboardController.getTopProducts);

// Admin routes
router.get('/stats', authenticate, authorize(2, 3), dashboardController.getStats);
router.get('/recent-orders', authenticate, authorize(2, 3), dashboardController.getRecentOrders);
router.get('/sales-chart', authenticate, authorize(2, 3), dashboardController.getSalesChart);

export default router;
