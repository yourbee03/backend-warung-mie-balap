import pool from '../config/database';
import { Product } from '../types';
import { generateSlug } from '../utils/helpers';
import { calculatePagination } from '../utils/helpers';

export class ProductRepository {
  async findAll(options: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
    is_active?: boolean;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 12;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (options.is_active !== undefined) {
      whereClause += ' AND p.is_active = ?';
      params.push(options.is_active);
    }

    if (options.category) {
      whereClause += ' AND c.slug = ?';
      params.push(options.category);
    }

    if (options.search) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    let orderClause = 'ORDER BY p.created_at DESC';
    if (options.sort) {
      switch (options.sort) {
        case 'price_asc':
          orderClause = 'ORDER BY p.price ASC';
          break;
        case 'price_desc':
          orderClause = 'ORDER BY p.price DESC';
          break;
        case 'name_asc':
          orderClause = 'ORDER BY p.name ASC';
          break;
        case 'name_desc':
          orderClause = 'ORDER BY p.name DESC';
          break;
      }
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       ${whereClause}`,
      params
    );
    const total = (countResult as any)[0].total;

    // Get products
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
       (SELECT image FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       ${whereClause} 
       ${orderClause} 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const products = rows as any[];

    // Get images for each product
    for (let product of products) {
      const [images] = await pool.query(
        'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
        [product.id]
      );
      product.images = images;
    }

    return {
      items: products,
      pagination: calculatePagination(total, page, limit),
    };
  }

  async findById(id: number): Promise<any | null> {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id]
    );
    const products = rows as any[];
    if (!products[0]) return null;

    const product = products[0];
    const [images] = await pool.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
      [id]
    );
    product.images = images;

    return product;
  }

  async findBySlug(slug: string): Promise<any | null> {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.slug = ?`,
      [slug]
    );
    const products = rows as any[];
    if (!products[0]) return null;

    const product = products[0];
    const [images] = await pool.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
      [product.id]
    );
    product.images = images;

    return product;
  }

  async create(data: {
    category_id: number;
    name: string;
    description?: string;
    custom_options?: any;
    price: number;
    stock: number;
    images?: { image: string; is_primary?: boolean }[];
  }): Promise<any> {
    const slug = generateSlug(data.name);
    const [result] = await pool.query(
      'INSERT INTO products (category_id, name, slug, description, custom_options, price, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.category_id, data.name, slug, data.description || null, data.custom_options ? JSON.stringify(data.custom_options) : null, data.price, data.stock]
    );
    const insertId = (result as any).insertId;

    // Add images
    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        await pool.query(
          'INSERT INTO product_images (product_id, image, is_primary, sort_order) VALUES (?, ?, ?, ?)',
          [insertId, data.images[i].image, data.images[i].is_primary || i === 0, i]
        );
      }
    }

    return this.findById(insertId);
  }

  async update(id: number, data: {
    category_id?: number;
    name?: string;
    description?: string;
    custom_options?: any;
    price?: number;
    stock?: number;
    is_active?: boolean;
  }): Promise<any> {
    const product = await this.findById(id);
    if (!product) throw new Error('Product not found');

    const slug = data.name ? generateSlug(data.name) : product.slug;
    await pool.query(
      `UPDATE products SET 
       category_id = ?, name = ?, slug = ?, description = ?, custom_options = ?, price = ?, stock = ?, is_active = ? 
       WHERE id = ?`,
      [
        data.category_id || product.category_id,
        data.name || product.name,
        slug,
        data.description !== undefined ? data.description : product.description,
        data.custom_options !== undefined ? (data.custom_options && data.custom_options.length > 0 ? JSON.stringify(data.custom_options) : null) : (product.custom_options || null),
        data.price !== undefined ? data.price : product.price,
        data.stock !== undefined ? data.stock : product.stock,
        data.is_active !== undefined ? data.is_active : product.is_active,
        id,
      ]
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    // Soft delete: deactivate instead of hard delete (FK constraint on order_items)
    await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    await pool.query('DELETE FROM product_images WHERE product_id = ?', [id]);
  }

  async addImage(productId: number, image: string, isPrimary: boolean = false): Promise<any> {
    const [maxOrder] = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM product_images WHERE product_id = ?',
      [productId]
    );
    const sortOrder = (maxOrder as any)[0].next_order;

    // Auto-set as primary if no primary exists yet
    if (!isPrimary) {
      const [existing] = await pool.query(
        'SELECT id FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1',
        [productId]
      );
      if ((existing as any[]).length === 0) {
        isPrimary = true;
      }
    }

    await pool.query(
      'INSERT INTO product_images (product_id, image, is_primary, sort_order) VALUES (?, ?, ?, ?)',
      [productId, image, isPrimary, sortOrder]
    );

    return this.findById(productId);
  }

  async deleteImage(imageId: number): Promise<void> {
    await pool.query('DELETE FROM product_images WHERE id = ?', [imageId]);
  }

  async count(): Promise<number> {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM products');
    return (rows as any)[0].count;
  }

  async toggleStock(id: number): Promise<any> {
    await pool.query('UPDATE products SET stock = CASE WHEN stock > 0 THEN 0 ELSE 100 END WHERE id = ?', [id]);
    return this.findById(id);
  }

  async setStock(id: number, stock: number): Promise<any> {
    await pool.query('UPDATE products SET stock = ? WHERE id = ?', [stock, id]);
    return this.findById(id);
  }
}

export default new ProductRepository();
