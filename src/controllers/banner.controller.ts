import { Request, Response, NextFunction } from 'express';
import bannerService from '../services/banner.service';
import { ResponseHelper } from '../utils/response';

export class BannerController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await bannerService.getAll();
      ResponseHelper.success(res, banners, 'Daftar banner');
    } catch (error) { next(error); }
  }

  async getActive(_req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await bannerService.getActive();
      ResponseHelper.success(res, banners, 'Daftar banner aktif');
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.getById(parseInt(req.params.id));
      ResponseHelper.success(res, banner, 'Detail banner');
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.create(req.body);
      ResponseHelper.created(res, banner, 'Banner berhasil dibuat');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.update(parseInt(req.params.id), req.body);
      ResponseHelper.success(res, banner, 'Banner berhasil diupdate');
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await bannerService.delete(parseInt(req.params.id));
      ResponseHelper.success(res, null, 'Banner berhasil dihapus');
    } catch (error) { next(error); }
  }
}

export default new BannerController();
