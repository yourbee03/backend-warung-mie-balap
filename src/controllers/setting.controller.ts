import { Request, Response, NextFunction } from 'express';
import settingService from '../services/setting.service';
import { ResponseHelper } from '../utils/response';

export class SettingController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.getAll();
      ResponseHelper.success(res, settings, 'Daftar pengaturan');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.update(req.body.settings);
      ResponseHelper.success(res, settings, 'Pengaturan berhasil diupdate');
    } catch (error) { next(error); }
  }
}

export default new SettingController();
