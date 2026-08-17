import pool from '../config/database';
import { Table } from '../types';

export class TableRepository {
  async findAll(): Promise<Table[]> {
    const [rows] = await pool.query('SELECT * FROM tables ORDER BY table_number ASC');
    return rows as Table[];
  }

  async findActive(): Promise<Table[]> {
    const [rows] = await pool.query('SELECT * FROM tables WHERE is_active = 1 ORDER BY table_number ASC');
    return rows as Table[];
  }

  async findById(id: number): Promise<Table | null> {
    const [rows] = await pool.query('SELECT * FROM tables WHERE id = ?', [id]);
    const tables = rows as Table[];
    return tables[0] || null;
  }

  async findByQrCode(qrCode: string): Promise<Table | null> {
    const [rows] = await pool.query('SELECT * FROM tables WHERE qr_code = ?', [qrCode]);
    const tables = rows as Table[];
    return tables[0] || null;
  }

  async create(data: { table_number: string; qr_code: string }): Promise<Table> {
    const [result] = await pool.query(
      'INSERT INTO tables (table_number, qr_code) VALUES (?, ?)',
      [data.table_number, data.qr_code]
    );
    return this.findById((result as any).insertId) as Promise<Table>;
  }

  async update(id: number, data: { table_number?: string; is_active?: boolean }): Promise<Table> {
    const table = await this.findById(id);
    if (!table) throw new Error('Table not found');
    
    await pool.query(
      'UPDATE tables SET table_number = ?, is_active = ? WHERE id = ?',
      [data.table_number || table.table_number, data.is_active !== undefined ? data.is_active : table.is_active, id]
    );
    return this.findById(id) as Promise<Table>;
  }

  async delete(id: number): Promise<void> {
    // Soft delete: deactivate instead of hard delete (FK constraints)
    await pool.query('UPDATE tables SET is_active = 0 WHERE id = ?', [id]);
  }

  async getProductIds(tableId: number): Promise<number[]> {
    const [rows] = await pool.query(
      'SELECT product_id FROM table_products WHERE table_id = ? AND is_available = 1',
      [tableId]
    );
    return (rows as any[]).map(r => r.product_id);
  }

  async setProducts(tableId: number, productIds: number[]): Promise<void> {
    await pool.query('DELETE FROM table_products WHERE table_id = ?', [tableId]);
    for (const productId of productIds) {
      await pool.query(
        'INSERT INTO table_products (table_id, product_id, is_available) VALUES (?, ?, 1)',
        [tableId, productId]
      );
    }
  }
}

export default new TableRepository();
