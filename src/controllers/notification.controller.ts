import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import { ResponseHelper } from '../utils/response';

export class NotificationController {
  async getByUserId(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const notifications = await notificationService.getByUserId(userId);
      ResponseHelper.success(res, notifications, 'Daftar notifikasi');
    } catch (error) { next(error); }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const count = await notificationService.getUnreadCount(userId);
      ResponseHelper.success(res, { unread_count: count }, 'Jumlah notifikasi belum dibaca');
    } catch (error) { next(error); }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAsRead(parseInt(req.params.id));
      ResponseHelper.success(res, null, 'Notifikasi ditandai sudah dibaca');
    } catch (error) { next(error); }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      await notificationService.markAllAsRead(userId);
      ResponseHelper.success(res, null, 'Semua notifikasi ditandai sudah dibaca');
    } catch (error) { next(error); }
  }
}

export default new NotificationController();
