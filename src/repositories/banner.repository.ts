import pool from '../config/database';
import { Banner } from '../types';

export class BannerRepository {
  async findAll(): Promise<Banner[]> {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY sort_order ASC');
    return rows as Banner[];
  }

  async findActive(): Promise<Banner[]> {
    const [rows] = await pool.query('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC');
    return rows as Banner[];
  }

  async findById(id: number): Promise<Banner | null> {
    const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
    const banners = rows as Banner[];
    return banners[0] || null;
  }

  async create(data: { title: string; image: string; link?: string; sort_order?: number }): Promise<Banner> {
    const [result] = await pool.query(
      'INSERT INTO banners (title, image, link, sort_order) VALUES (?, ?, ?, ?)',
      [data.title, data.image, data.link || null, data.sort_order || 0]
    );
    return this.findById((result as any).insertId) as Promise<Banner>;
  }

  async update(id: number, data: { title?: string; image?: string; link?: string; sort_order?: number; is_active?: boolean }): Promise<Banner> {
    const banner = await this.findById(id);
    if (!banner) throw new Error('Banner not found');
    
    await pool.query(
      'UPDATE banners SET title = ?, image = ?, link = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [data.title || banner.title, data.image || banner.image, data.link !== undefined ? data.link : banner.link, data.sort_order !== undefined ? data.sort_order : banner.sort_order, data.is_active !== undefined ? data.is_active : banner.is_active, id]
    );
    return this.findById(id) as Promise<Banner>;
  }

  async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM banners WHERE id = ?', [id]);
  }
}

export default new BannerRepository();
