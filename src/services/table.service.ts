import tableRepository from '../repositories/table.repository';
import { ApiError } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import QRService from './qr.service';
import pool from '../config/database';

export class TableService {
  async getAll() {
    const tables = await tableRepository.findAll();
    // Add QR code URL to each table
    return tables.map(table => ({
      ...table,
      qr_url: QRService.getTableUrl(table.id),
    }));
  }

  async getActive() {
    return tableRepository.findActive();
  }

  async getById(id: number) {
    const table = await tableRepository.findById(id);
    if (!table) throw new ApiError(404, 'Meja tidak ditemukan');
    return {
      ...table,
      qr_url: QRService.getTableUrl(table.id),
    };
  }

  async getByIdWithProducts(id: number) {
    const table = await tableRepository.findById(id);
    if (!table) throw new ApiError(404, 'Meja tidak ditemukan');
    const productIds = await tableRepository.getProductIds(id);
    let products: any[] = [];
    if (productIds.length > 0) {
      const [rows] = await pool.query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug,
          COALESCE(
            (SELECT image FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1),
            (SELECT image FROM product_images WHERE product_id = p.id LIMIT 1)
          ) as primary_image
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id IN (${productIds.map(() => '?').join(',')}) AND p.is_active = 1`,
        productIds
      );
      products = rows as any[];
    }
    return {
      ...table,
      qr_url: QRService.getTableUrl(table.id),
      products,
    };
  }

  async getByQrCode(qrCode: string) {
    const table = await tableRepository.findByQrCode(qrCode);
    if (!table) throw new ApiError(404, 'Meja tidak ditemukan');
    return {
      ...table,
      qr_url: QRService.getTableUrl(table.id),
    };
  }

  async create(data: { table_number: string }) {
    const qrCode = uuidv4();
    const table = await tableRepository.create({ table_number: data.table_number, qr_code: qrCode });
    return {
      ...table,
      qr_url: QRService.getTableUrl(table.id),
    };
  }

  async update(id: number, data: { table_number?: string; is_active?: boolean }) {
    await this.getById(id);
    const table = await tableRepository.update(id, data);
    return {
      ...table,
      qr_url: QRService.getTableUrl(table.id),
    };
  }

  async delete(id: number) {
    await this.getById(id);
    await tableRepository.delete(id);
  }

  async getProducts(tableId: number) {
    await this.getById(tableId);
    return tableRepository.getProductIds(tableId);
  }

  async setProducts(tableId: number, productIds: number[]) {
    await this.getById(tableId);
    await tableRepository.setProducts(tableId, productIds);
  }

  async getQRCode(tableId: number) {
    const table = await tableRepository.findById(tableId);
    if (!table) throw new ApiError(404, 'Meja tidak ditemukan');
    return QRService.generateTableQR(table.id, table.table_number);
  }
}

export default new TableService();
