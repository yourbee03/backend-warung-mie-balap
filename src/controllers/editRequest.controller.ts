import { Request, Response, NextFunction } from 'express';
import editRequestService from '../services/editRequest.service';
import { ResponseHelper } from '../utils/response';

export class EditRequestController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, order_id } = req.query;
      const user = (req as any).user;
      if (![2, 3].includes(user.role_id)) {
        ResponseHelper.forbidden(res, 'Tidak memiliki akses');
        return;
      }
      const requests = await editRequestService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string,
        order_id: order_id ? parseInt(order_id as string) : undefined,
      });
      ResponseHelper.success(res, requests, 'Daftar permintaan edit');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await editRequestService.getById(parseInt(req.params.id), (req as any).user);
      ResponseHelper.success(res, request, 'Detail permintaan edit');
    } catch (error) {
      next(error);
    }
  }

  // Admin mengajukan perubahan
  async requestEdit(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = parseInt(req.params.id);
      const ownerId = (req as any).user.id;
      const request = await editRequestService.requestEdit(ownerId, orderId, req.body, (req as any).user.name);
      ResponseHelper.created(res, request, 'Permintaan edit pesanan diajukan ke Admin');
    } catch (error) {
      next(error);
    }
  }

  // Owner memverifikasi
  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (user.role_id !== 3) {
        ResponseHelper.forbidden(res, 'Hanya Owner yang dapat memverifikasi');
        return;
      }
      const request = await editRequestService.verify(
        user.id,
        parseInt(req.params.id),
        req.body,
        user.name
      );
      ResponseHelper.success(res, request, 'Verifikasi berhasil');
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, order_id, status } = req.query;
      const logs = await editRequestService.getAuditLogs({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        order_id: order_id ? parseInt(order_id as string) : undefined,
        status: status as string,
      });
      ResponseHelper.success(res, logs, 'Log audit pesanan');
    } catch (error) {
      next(error);
    }
  }
}

export default new EditRequestController();