import pool from '../config/database';
import { User } from '../types';

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows as User[];
    return users[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const users = rows as User[];
    return users[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    const users = rows as User[];
    return users[0] || null;
  }

  async create(data: { name: string; email: string; password: string; phone?: string; username?: string }): Promise<User> {
    const [result] = await pool.query(
      'INSERT INTO users (role_id, name, username, email, password, phone) VALUES (1, ?, ?, ?, ?, ?)',
      [data.name, data.username || null, data.email, data.password, data.phone || null]
    );
    const insertId = (result as any).insertId;
    return this.findById(insertId) as Promise<User>;
  }

  async updatePassword(id: number, password: string): Promise<void> {
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [password, id]);
  }

  async updateProfile(id: number, data: { name?: string; phone?: string; address?: string; avatar?: string }): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async updateResetToken(id: number, token: string, expires: Date): Promise<void> {
    await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, id]);
  }

  async findByResetToken(token: string): Promise<User | null> {
    const [rows] = await pool.query('SELECT * FROM users WHERE reset_token = ?', [token]);
    const users = rows as User[];
    return users[0] || null;
  }

  async clearResetToken(id: number): Promise<void> {
    await pool.query('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [id]);
  }
}

export default new AuthRepository();
