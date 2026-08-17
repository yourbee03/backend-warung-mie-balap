import pool from '../config/database';
import { calculatePagination } from '../utils/helpers';

export class DashboardRepository {
  async getStats() {
    const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
    const [orderCount] = await pool.query('SELECT COUNT(*) as count FROM orders');
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = 1');
    const [todayOrders] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()");
    const [totalRevenue] = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'");

    return {
      total_products: (productCount as any)[0].count,
      total_orders: (orderCount as any)[0].count,
      total_users: (userCount as any)[0].count,
      today_orders: (todayOrders as any)[0].count,
      total_revenue: (totalRevenue as any)[0].total,
    };
  }

  async getRecentOrders(limit: number = 5) {
    const [rows] = await pool.query(
      `SELECT o.*, u.name as user_name, t.table_number
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN tables t ON o.table_id = t.id
       ORDER BY o.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  async getTopProducts(limit: number = 5) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.price, SUM(oi.quantity) as total_sold
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled'
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  async getSalesChart(days: number = 7) {
    const [rows] = await pool.query(
      `SELECT DATE(o.created_at) as date, COUNT(*) as orders, SUM(o.total_amount) as revenue
       FROM orders o
       WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(o.created_at)
       ORDER BY date ASC`,
      [days]
    );
    return rows;
  }
}

export default new DashboardRepository();
