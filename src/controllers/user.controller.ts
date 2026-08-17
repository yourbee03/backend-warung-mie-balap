import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import { ResponseHelper } from '../utils/response';

export class UserController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, role_id, search } = req.query;
      const users = await userService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        role_id: role_id ? parseInt(role_id as string) : undefined,
        search: search as string,
      });
      ResponseHelper.success(res, users, 'Daftar pengguna');
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(parseInt(req.params.id));
      ResponseHelper.success(res, user, 'Detail pengguna');
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body);
      ResponseHelper.created(res, user, 'Pengguna berhasil dibuat');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.update(parseInt(req.params.id), req.body);
      ResponseHelper.success(res, user, 'Pengguna berhasil diupdate');
    } catch (error) { next(error); }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.updateRole(parseInt(req.params.id), req.body.role_id);
      ResponseHelper.success(res, null, 'Role berhasil diupdate');
    } catch (error) { next(error); }
  }

  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.toggleActive(parseInt(req.params.id));
      ResponseHelper.success(res, null, 'Status berhasil diupdate');
    } catch (error) { next(error); }
  }

  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.updatePassword(parseInt(req.params.id), req.body.password);
      ResponseHelper.success(res, null, 'Password berhasil diupdate');
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.delete(parseInt(req.params.id));
      ResponseHelper.success(res, null, 'Pengguna berhasil dihapus');
    } catch (error) { next(error); }
  }

  async count(_req: Request, res: Response, next: NextFunction) {
    try {
      const count = await userService.count();
      ResponseHelper.success(res, { total_users: count }, 'Jumlah pengguna');
    } catch (error) { next(error); }
  }
}

export default new UserController();
