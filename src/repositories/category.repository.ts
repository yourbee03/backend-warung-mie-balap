import pool from '../config/database';
import { Category } from '../types';
import { generateSlug } from '../utils/helpers';

export class CategoryRepository {
  async findAll(): Promise<Category[]> {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return rows as Category[];
  }

  async findById(id: number): Promise<Category | null> {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    const categories = rows as Category[];
    return categories[0] || null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug]);
    const categories = rows as Category[];
    return categories[0] || null;
  }

  async create(data: { name: string; description?: string; image?: string }): Promise<Category> {
    const slug = generateSlug(data.name);
    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, description, image) VALUES (?, ?, ?, ?)',
      [data.name, slug, data.description || null, data.image || null]
    );
    const insertId = (result as any).insertId;
    return this.findById(insertId) as Promise<Category>;
  }

  async update(id: number, data: { name?: string; description?: string; image?: string; is_active?: boolean }): Promise<Category> {
    const category = await this.findById(id);
    if (!category) throw new Error('Category not found');

    const slug = data.name ? generateSlug(data.name) : category.slug;
    await pool.query(
      'UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, is_active = ? WHERE id = ?',
      [
        data.name || category.name,
        slug,
        data.description !== undefined ? data.description : category.description,
        data.image !== undefined ? data.image : category.image,
        data.is_active !== undefined ? data.is_active : category.is_active,
        id,
      ]
    );
    return this.findById(id) as Promise<Category>;
  }

  async delete(id: number): Promise<void> {
    // Soft delete: deactivate instead of hard delete (FK constraint on products)
    await pool.query('UPDATE categories SET is_active = 0 WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM categories');
    return (rows as any)[0].count;
  }
}

export default new CategoryRepository();
