import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import paymentGatewayRoutes from './paymentGateway.routes';
import userRoutes from './user.routes';
import bannerRoutes from './banner.routes';
import tableRoutes from './table.routes';
import qrOrderRoutes from './qrOrder.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';
import settingRoutes from './setting.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/payment-gateway', paymentGatewayRoutes);
router.use('/users', userRoutes);
router.use('/banners', bannerRoutes);
router.use('/tables', tableRoutes);
router.use('/qr', qrOrderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingRoutes);

export default router;
