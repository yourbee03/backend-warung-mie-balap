import pool from '../config/database';
import { Order } from '../types';
import { generateOrderNumber, calculatePagination } from '../utils/helpers';

export class OrderRepository {
  async findAll(options: {
    page?: number;
    limit?: number;
    user_id?: number;
    status?: string;
    order_type?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (options.user_id) {
      whereClause += ' AND o.user_id = ?';
      params.push(options.user_id);
    }

    if (options.status) {
      whereClause += ' AND o.status = ?';
      params.push(options.status);
    }

    if (options.order_type) {
      whereClause += ' AND o.order_type = ?';
      params.push(options.order_type);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );
    const total = (countResult as any)[0].total;

    const [rows] = await pool.query(
      `SELECT o.*, 
       u.name as user_name, u.email as user_email,
       t.table_number,
       p.method as payment_method, p.status as payment_status
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN payments p ON o.id = p.order_id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const orders = rows as any[];

    // Get items and payment for each order
    for (let order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.name as product_name, p.slug as product_slug
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;

      // Attach payment object
      if (order.payment_method) {
        order.payment = {
          method: order.payment_method,
          status: order.payment_status,
        };
      }
    }

    return {
      items: orders,
      pagination: calculatePagination(total, page, limit),
    };
  }

  async findById(id: number): Promise<any | null> {
    const [rows] = await pool.query(
      `SELECT o.*, 
       u.name as user_name, u.email as user_email,
       t.table_number,
       p.method as payment_method, p.status as payment_status, p.amount as payment_amount
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.id = ?`,
      [id]
    );
    const orders = rows as any[];
    if (!orders[0]) return null;

    const order = orders[0];
    const [items] = await pool.query(
      `SELECT oi.*, pr.name as product_name, pr.slug as product_slug
       FROM order_items oi
       LEFT JOIN products pr ON oi.product_id = pr.id
       WHERE oi.order_id = ?`,
      [id]
    );
    order.items = items;

    // Attach payment object
    if (order.payment_method) {
      order.payment = {
        method: order.payment_method,
        status: order.payment_status,
        amount: order.payment_amount,
      };
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<any | null> {
    const [rows] = await pool.query(
      `SELECT o.*, 
       u.name as user_name, u.email as user_email,
       t.table_number,
       p.method as payment_method, p.status as payment_status
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.order_number = ?`,
      [orderNumber]
    );
    const orders = rows as any[];
    if (!orders[0]) return null;

    const order = orders[0];
    const [items] = await pool.query(
      `SELECT oi.*, p.name as product_name, p.slug as product_slug
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    order.items = items;

    // Attach payment object
    if (order.payment_method) {
      order.payment = {
        method: order.payment_method,
        status: order.payment_status,
      };
    }

    return order;
  }

  async create(data: {
    user_id?: number | null;
    table_id?: number;
    order_type: 'online' | 'qr' | 'takeaway';
    order_service_type?: 'takeaway' | 'delivery' | 'dine_in' | null;
    payment_method?: 'cash' | 'qris';
    items: { product_id: number; quantity: number; price: number; notes?: string | null; options_price?: number }[];
    guest_name?: string;
    guest_phone?: string;
    shipping_address?: string;
    shipping_cost?: number;
    shipping_distance?: number;
    notes?: string;
  }): Promise<any> {
    const orderNumber = generateOrderNumber(data.order_type);
    const itemsTotal = data.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const shippingCost = data.shipping_cost || 0;
    const totalAmount = itemsTotal + shippingCost;

    const [result] = await pool.query(
      `INSERT INTO orders (user_id, table_id, order_number, order_type, order_service_type, status, total_amount, guest_name, guest_phone, shipping_address, shipping_cost, shipping_distance, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id || null,
        data.table_id || null,
        orderNumber,
        data.order_type,
        data.order_service_type || null,
        data.order_type === 'online' || data.order_type === 'qr' ? 'pending' : 'processing',
        totalAmount,
        data.guest_name || null,
        data.guest_phone || null,
        data.shipping_address || null,
        shippingCost,
        data.shipping_distance || null,
        data.notes || null,
      ]
    );
    const orderId = (result as any).insertId;

    // Add order items
    for (const item of data.items) {
      const itemSubtotal = Number(item.price) * item.quantity;
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, options_price, subtotal, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price, (item as any).options_price || 0, itemSubtotal, item.notes || null]
      );

      // Decrease stock
      await pool.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Create payment record for online orders
    if (data.order_type === 'online') {
      const paymentMethod = data.payment_method || 'cash';
      await pool.query(
        'INSERT INTO payments (order_id, method, status, amount) VALUES (?, ?, ?, ?)',
        [orderId, paymentMethod, 'pending', totalAmount]
      );
    }

    return this.findById(orderId);
  }

  async updateStatus(id: number, status: string): Promise<any> {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    await pool.query('DELETE FROM payments WHERE order_id = ?', [id]);
    await pool.query('DELETE FROM orders WHERE id = ?', [id]);
  }

  async count(): Promise<number> {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM orders');
    return (rows as any)[0].count;
  }

  async getTodayOrders(): Promise<number> {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()"
    );
    return (rows as any)[0].count;
  }

  async getTotalRevenue(): Promise<number> {
    const [rows] = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'completed'"
    );
    return (rows as any)[0].total;
  }
}

export default new OrderRepository();
