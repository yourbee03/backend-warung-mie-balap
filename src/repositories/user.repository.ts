import pool from '../config/database';
import { User } from '../types';
import { calculatePagination } from '../utils/helpers';

export class UserRepository {
  async findAll(options: { page?: number; limit?: number; role_id?: number; search?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (options.role_id) {
      whereClause += ' AND u.role_id = ?';
      params.push(options.role_id);
    }

    if (options.search) {
      whereClause += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM users u ${whereClause}`, params);
    const total = (countResult as any)[0].total;

    const [rows] = await pool.query(
      `SELECT u.id, u.role_id, u.name, u.username, u.email, u.phone, u.address, u.avatar, u.is_active, u.created_at, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows,
      pagination: calculatePagination(total, page, limit),
    };
  }

  async findById(id: number): Promise<User | null> {
    const [rows] = await pool.query(
      'SELECT id, role_id, name, username, email, phone, address, avatar, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    const users = rows as User[];
    return users[0] || null;
  }

  async create(data: {
    name: string;
    username?: string;
    email: string;
    password: string;
    phone?: string;
    role_id?: number;
  }): Promise<User> {
    const [result] = await pool.query(
      'INSERT INTO users (role_id, name, username, email, password, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [data.role_id || 1, data.name, data.username || null, data.email, data.password, data.phone || null]
    );
    return this.findById((result as any).insertId) as Promise<User>;
  }

  async update(id: number, data: {
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar?: string;
  }): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.username !== undefined) { fields.push('username = ?'); values.push(data.username || null); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone || null); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address || null); }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar || null); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async updateRole(id: number, roleId: number): Promise<void> {
    await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, id]);
  }

  async toggleActive(id: number): Promise<void> {
    await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [id]);
  }

  async updatePassword(id: number, password: string): Promise<void> {
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [password, id]);
  }

  async delete(id: number): Promise<void> {
    // Soft delete: deactivate instead of hard delete (FK constraints)
    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    return (rows as any)[0].count;
  }
}

export default new UserRepository();
