import { Request, Response, NextFunction } from 'express';
import orderService from '../services/order.service';
import { ResponseHelper } from '../utils/response';

export class OrderController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, order_type } = req.query;
      const userId = (req as any).user?.id;
      
      const orders = await orderService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        user_id: userId,
        status: status as string,
        order_type: order_type as string,
      });
      ResponseHelper.success(res, orders, 'Daftar pesanan');
    } catch (error) {
      next(error);
    }
  }

  async getAllAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, order_type, user_id } = req.query;
      
      const orders = await orderService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        user_id: user_id ? parseInt(user_id as string) : undefined,
        status: status as string,
        order_type: order_type as string,
      });
      ResponseHelper.success(res, orders, 'Daftar pesanan');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const order = await orderService.getById(id);
      ResponseHelper.success(res, order, 'Detail pesanan');
    } catch (error) {
      next(error);
    }
  }

  async getByOrderNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getByOrderNumber(req.params.orderNumber);
      ResponseHelper.success(res, order, 'Detail pesanan');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const order = await orderService.create({
        ...req.body,
        user_id: userId,
      });
      ResponseHelper.created(res, order, 'Pesanan berhasil dibuat');
    } catch (error) {
      next(error);
    }
  }

  async adminCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id;
      const order = await orderService.create({
        ...req.body,
        user_id: null,
        created_by: adminId,
      });
      ResponseHelper.created(res, order, 'Pesanan berhasil dibuat');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await orderService.updateStatus(id, status);
      ResponseHelper.success(res, order, 'Status pesanan berhasil diupdate');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await orderService.delete(id);
      ResponseHelper.success(res, null, 'Pesanan berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }

  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await orderService.getStats();
      ResponseHelper.success(res, stats, 'Statistik pesanan');
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();
