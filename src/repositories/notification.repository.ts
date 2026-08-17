import pool from '../config/database';
import { Notification } from '../types';

export class NotificationRepository {
  async findByUserId(userId: number, limit: number = 20): Promise<Notification[]> {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows as Notification[];
  }

  async findUnreadCount(userId: number): Promise<number> {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return (rows as any)[0].count;
  }

  async create(data: { user_id?: number; type: string; title: string; message: string; data?: any }): Promise<Notification> {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [data.user_id || null, data.type, data.title, data.message, data.data ? JSON.stringify(data.data) : null]
    );
    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [(result as any).insertId]);
    return (rows as Notification[])[0];
  }

  async markAsRead(id: number): Promise<void> {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  }

  async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM notifications WHERE id = ?', [id]);
  }

  async broadcast(data: { type: string; title: string; message: string; data?: any }): Promise<void> {
    await pool.query(
      'INSERT INTO notifications (type, title, message, data) VALUES (?, ?, ?, ?)',
      [data.type, data.title, data.message, data.data ? JSON.stringify(data.data) : null]
    );
  }
}

export default new NotificationRepository();
