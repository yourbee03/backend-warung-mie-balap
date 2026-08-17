import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { ResponseHelper } from '../utils/response';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      ResponseHelper.created(res, result, 'Registrasi berhasil');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      ResponseHelper.success(res, result, 'Login berhasil');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const result = await authService.refreshToken(token);
      ResponseHelper.success(res, result, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const user = await authService.getMe(userId);
      ResponseHelper.success(res, user, 'User profile');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const user = await authService.updateProfile(userId, req.body);
      ResponseHelper.success(res, user, 'Profile berhasil diupdate');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { current_password, new_password } = req.body;
      await authService.changePassword(userId, current_password, new_password);
      ResponseHelper.success(res, null, 'Password berhasil diubah');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      ResponseHelper.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, new_password } = req.body;
      await authService.resetPassword(token, new_password);
      ResponseHelper.success(res, null, 'Password berhasil direset');
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      ResponseHelper.success(res, null, 'Logout berhasil');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
