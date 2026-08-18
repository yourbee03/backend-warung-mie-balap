import pool from '../config/database';
import { Payment } from '../types';

export class PaymentRepository {
  async findByOrderId(orderId: number): Promise<Payment | null> {
    const [rows] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [orderId]);
    const payments = rows as Payment[];
    return payments[0] || null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Payment | null> {
    const [rows] = await pool.query(
      `SELECT p.* FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE o.order_number = ?`,
      [orderNumber]
    );
    const payments = rows as Payment[];
    return payments[0] || null;
  }

  async findById(id: number): Promise<Payment | null> {
    const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
    const payments = rows as Payment[];
    return payments[0] || null;
  }

  async findByQrId(qrId: string): Promise<Payment | null> {
    const [rows] = await pool.query('SELECT * FROM payments WHERE snap_token = ?', [qrId]);
    const payments = rows as Payment[];
    return payments[0] || null;
  }

  async create(data: {
    order_id: number;
    method: 'cash' | 'bank_transfer' | 'qris';
    amount: number;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    snap_token?: string;
    redirect_url?: string;
  }): Promise<Payment> {
    const [result] = await pool.query(
      `INSERT INTO payments (order_id, method, status, amount, bank_name, account_number, account_name, snap_token, redirect_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.order_id,
        data.method,
        'pending',
        data.amount,
        data.bank_name || null,
        data.account_number || null,
        data.account_name || null,
        data.snap_token || null,
        data.redirect_url || null,
      ]
    );
    const insertId = (result as any).insertId;
    return this.findById(insertId) as Promise<Payment>;
  }

  async updateQris(id: number, snapToken: string): Promise<Payment> {
    await pool.query(
      'UPDATE payments SET method = ?, snap_token = ? WHERE id = ?',
      ['qris', snapToken, id]
    );
    return this.findById(id) as Promise<Payment>;
  }

  async updateStatus(id: number, status: 'pending' | 'paid' | 'rejected' | 'expired', verifiedBy?: number): Promise<Payment> {
    const updates: string[] = ['status = ?'];
    const params: any[] = [status];

    if (status === 'paid') {
      updates.push('paid_at = NOW()');
    }

    if (verifiedBy) {
      updates.push('verified_by = ?', 'verified_at = NOW()');
      params.push(verifiedBy);
    }

    params.push(id);
    await pool.query(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`, params);
    return this.findById(id) as Promise<Payment>;
  }

  async updateBankInfo(id: number, data: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  }): Promise<Payment> {
    await pool.query(
      'UPDATE payments SET bank_name = ?, account_number = ?, account_name = ? WHERE id = ?',
      [data.bank_name || null, data.account_number || null, data.account_name || null, id]
    );
    return this.findById(id) as Promise<Payment>;
  }

  async findAll(options: { page?: number; limit?: number; status?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (options.status) {
      whereClause += ' AND p.status = ?';
      params.push(options.status);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM payments p ${whereClause}`,
      params
    );
    const total = (countResult as any)[0].total;

    const [rows] = await pool.query(
      `SELECT p.*, o.order_number, o.total_amount as order_amount
       FROM payments p
       LEFT JOIN orders o ON p.order_id = o.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new PaymentRepository();
