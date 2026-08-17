import { Request, Response, NextFunction } from 'express';
import dashboardService from '../services/dashboard.service';
import { ResponseHelper } from '../utils/response';

export class DashboardController {
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getStats();
      ResponseHelper.success(res, stats, 'Statistik dashboard');
    } catch (error) { next(error); }
  }

  async getRecentOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const orders = await dashboardService.getRecentOrders(limit);
      ResponseHelper.success(res, orders, 'Pesanan terbaru');
    } catch (error) { next(error); }
  }

  async getTopProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const products = await dashboardService.getTopProducts(limit);
      ResponseHelper.success(res, products, 'Produk terlaris');
    } catch (error) { next(error); }
  }

  async getSalesChart(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : undefined;
      const chart = await dashboardService.getSalesChart(days);
      ResponseHelper.success(res, chart, 'Grafik penjualan');
    } catch (error) { next(error); }
  }
}

export default new DashboardController();
