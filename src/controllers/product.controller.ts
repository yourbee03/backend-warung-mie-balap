import { Request, Response, NextFunction } from 'express';
import productService from '../services/product.service';
import { ResponseHelper } from '../utils/response';
import { uploadToCloudinary } from '../middlewares/upload.middleware';

export class ProductController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, category, search, sort } = req.query;
      const products = await productService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        category: category as string,
        search: search as string,
        sort: sort as string,
        is_active: true,
      });
      ResponseHelper.success(res, products, 'Daftar produk');
    } catch (error) {
      next(error);
    }
  }

  async getAllAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, category, search, sort } = req.query;
      const products = await productService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        category: category as string,
        search: search as string,
        sort: sort as string,
      });
      ResponseHelper.success(res, products, 'Daftar produk');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const product = await productService.getById(id);
      ResponseHelper.success(res, product, 'Detail produk');
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getBySlug(req.params.slug);
      ResponseHelper.success(res, product, 'Detail produk');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.create(req.body);
      ResponseHelper.created(res, product, 'Produk berhasil dibuat');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const product = await productService.update(id, req.body);
      ResponseHelper.success(res, product, 'Produk berhasil diupdate');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await productService.delete(id);
      ResponseHelper.success(res, null, 'Produk berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }

  async addImage(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { image, is_primary } = req.body;
      const product = await productService.addImage(id, image, is_primary);
      ResponseHelper.success(res, product, 'Gambar berhasil ditambahkan');
    } catch (error) {
      next(error);
    }
  }

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        ResponseHelper.badRequest(res, 'File gambar wajib diupload');
        return;
      }
      const imageUrl = await uploadToCloudinary(file.buffer, 'products');
      const id = parseInt(req.params.id);
      const is_primary = req.body.is_primary === 'true' || req.body.is_primary === true;
      const product = await productService.addImage(id, imageUrl, is_primary);
      ResponseHelper.success(res, product, 'Gambar berhasil diupload');
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const imageId = parseInt(req.params.imageId);
      await productService.deleteImage(imageId);
      ResponseHelper.success(res, null, 'Gambar berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }

  async toggleStock(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const product = await productService.toggleStock(id);
      ResponseHelper.success(res, product, 'Stok produk berhasil diupdate');
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
