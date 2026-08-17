import { Request, Response, NextFunction } from 'express';
import categoryService from '../services/category.service';
import { ResponseHelper } from '../utils/response';

export class CategoryController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoryService.getAll();
      ResponseHelper.success(res, categories, 'Daftar kategori');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const category = await categoryService.getById(id);
      ResponseHelper.success(res, category, 'Detail kategori');
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.getBySlug(req.params.slug);
      ResponseHelper.success(res, category, 'Detail kategori');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.create(req.body);
      ResponseHelper.created(res, category, 'Kategori berhasil dibuat');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const category = await categoryService.update(id, req.body);
      ResponseHelper.success(res, category, 'Kategori berhasil diupdate');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await categoryService.delete(id);
      ResponseHelper.success(res, null, 'Kategori berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
