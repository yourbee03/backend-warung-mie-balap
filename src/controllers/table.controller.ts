import { Request, Response, NextFunction } from 'express';
import tableService from '../services/table.service';
import { ResponseHelper } from '../utils/response';

export class TableController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const tables = await tableService.getAll();
      ResponseHelper.success(res, tables, 'Daftar meja');
    } catch (error) { next(error); }
  }

  async getActive(_req: Request, res: Response, next: NextFunction) {
    try {
      const tables = await tableService.getActive();
      ResponseHelper.success(res, tables, 'Daftar meja aktif');
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const table = await tableService.getById(parseInt(req.params.id));
      ResponseHelper.success(res, table, 'Detail meja');
    } catch (error) { next(error); }
  }

  async getByTableId(req: Request, res: Response, next: NextFunction) {
    try {
      const table = await tableService.getByIdWithProducts(parseInt(req.params.tableId));
      ResponseHelper.success(res, table, 'Detail meja');
    } catch (error) { next(error); }
  }

  async getByQrCode(req: Request, res: Response, next: NextFunction) {
    try {
      const table = await tableService.getByQrCode(req.params.qrCode);
      ResponseHelper.success(res, table, 'Detail meja');
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const table = await tableService.create(req.body);
      ResponseHelper.created(res, table, 'Meja berhasil dibuat');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const table = await tableService.update(parseInt(req.params.id), req.body);
      ResponseHelper.success(res, table, 'Meja berhasil diupdate');
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await tableService.delete(parseInt(req.params.id));
      ResponseHelper.success(res, null, 'Meja berhasil dihapus');
    } catch (error) { next(error); }
  }

  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await tableService.getProducts(parseInt(req.params.id));
      ResponseHelper.success(res, products, 'Daftar produk meja');
    } catch (error) { next(error); }
  }

  async setProducts(req: Request, res: Response, next: NextFunction) {
    try {
      await tableService.setProducts(parseInt(req.params.id), req.body.product_ids);
      ResponseHelper.success(res, null, 'Produk meja berhasil diupdate');
    } catch (error) { next(error); }
  }

  async getQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const qrCode = await tableService.getQRCode(parseInt(req.params.id));
      ResponseHelper.success(res, { qr_code: qrCode }, 'QR Code meja');
    } catch (error) { next(error); }
  }
}

export default new TableController();
