import { Request, Response, NextFunction } from 'express';
import paymentService from '../services/payment.service';
import { ResponseHelper } from '../utils/response';

export class PaymentController {
  async getByOrderId(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = parseInt(req.params.orderId);
      const payment = await paymentService.getByOrderId(orderId);
      ResponseHelper.success(res, payment, 'Detail pembayaran');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const payment = await paymentService.getById(id);
      ResponseHelper.success(res, payment, 'Detail pembayaran');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.create(req.body);
      ResponseHelper.created(res, payment, 'Pembayaran berhasil dibuat');
    } catch (error) {
      next(error);
    }
  }

  async confirmPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const verifiedBy = (req as any).user.id;
      const payment = await paymentService.confirmPayment(id, verifiedBy);
      ResponseHelper.success(res, payment, 'Pembayaran berhasil dikonfirmasi');
    } catch (error) {
      next(error);
    }
  }

  async rejectPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const verifiedBy = (req as any).user.id;
      const payment = await paymentService.rejectPayment(id, verifiedBy);
      ResponseHelper.success(res, payment, 'Pembayaran ditolak');
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status } = req.query;
      const payments = await paymentService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string,
      });
      ResponseHelper.success(res, payments, 'Daftar pembayaran');
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
