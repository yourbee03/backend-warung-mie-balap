import pool from '../config/database';
import { calculatePagination } from '../utils/helpers';

export class EditRequestRepository {
  async findAll(options: {
    page?: number;
    limit?: number;
    status?: string;
    order_id?: number;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (options.status) {
      whereClause += ' AND er.status = ?';
      params.push(options.status);
    }

    if (options.order_id) {
      whereClause += ' AND er.order_id = ?';
      params.push(options.order_id);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM order_edit_requests er ${whereClause}`,
      params
    );
    const total = (countResult as any)[0].total;

    const [rows] = await pool.query(
      `SELECT er.*,
       o.order_number, o.order_type, o.order_service_type, o.total_amount, o.guest_name,
       req.name as requested_by_name,
       adm.name as admin_name
       FROM order_edit_requests er
       JOIN orders o ON o.id = er.order_id
       LEFT JOIN users req ON req.id = er.requested_by
       LEFT JOIN users adm ON adm.id = er.admin_verified_by
       ${whereClause}
       ORDER BY er.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows as any[],
      pagination: calculatePagination(total, page, limit),
    };
  }

  async findById(id: number): Promise<any | null> {
    const [rows] = await pool.query(
      `SELECT er.*,
       o.order_number, o.order_type, o.order_service_type, o.total_amount, o.guest_name, o.shipping_cost,
       req.name as requested_by_name,
       adm.name as admin_name,
       app.name as applied_by_name
       FROM order_edit_requests er
       JOIN orders o ON o.id = er.order_id
       LEFT JOIN users req ON req.id = er.requested_by
       LEFT JOIN users adm ON adm.id = er.admin_verified_by
       LEFT JOIN users app ON app.id = er.applied_by
       WHERE er.id = ?`,
      [id]
    );
    const request = (rows as any[])[0];
    if (!request) return null;

    // Attach old/new items parsed
    request.old_items = request.old_items ? JSON.parse(request.old_items) : [];
    request.new_items = request.new_items ? JSON.parse(request.new_items) : [];

    // Attach order items current
    const [items] = await pool.query(
      `SELECT oi.*, p.name as product_name, p.slug as product_slug
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [request.order_id]
    );
    request.order_items = items;

    return request;
  }

  async create(data: {
    order_id: number;
    requested_by: number;
    reason?: string;
    old_items: any[];
    new_items: any[];
  }): Promise<number> {
    const [result] = await pool.query(
      `INSERT INTO order_edit_requests (order_id, requested_by, reason, old_items, new_items, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        data.order_id,
        data.requested_by,
        data.reason || null,
        JSON.stringify(data.old_items),
        JSON.stringify(data.new_items),
      ]
    );
    return (result as any).insertId;
  }

  async verifyAdmin(id: number, adminId: number, approve: boolean, reason?: string): Promise<void> {
    await pool.query(
      `UPDATE order_edit_requests
       SET admin_verified_by = ?, admin_verified_at = NOW(),
           status = ?, reject_reason = ?
       WHERE id = ?`,
      [adminId, approve ? 'approved' : 'rejected', reason || null, id]
    );
  }

  async markApplied(id: number, appliedBy: number): Promise<void> {
    await pool.query(
      `UPDATE order_edit_requests SET applied_at = NOW(), applied_by = ? WHERE id = ?`,
      [appliedBy, id]
    );
  }
}

export class AuditLogRepository {
  async create(data: {
    order_id?: number;
    edit_request_id?: number;
    action: string;
    actor_id: number;
    actor_name?: string;
    actor_role?: string;
    old_data?: any;
    new_data?: any;
    description?: string;
    status?: string;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO order_audit_logs (order_id, edit_request_id, action, actor_id, actor_name, actor_role, old_data, new_data, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.order_id || null,
        data.edit_request_id || null,
        data.action,
        data.actor_id,
        data.actor_name || null,
        data.actor_role || null,
        data.old_data !== undefined ? JSON.stringify(data.old_data) : null,
        data.new_data !== undefined ? JSON.stringify(data.new_data) : null,
        data.description || null,
        data.status || 'pending',
      ]
    );
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    order_id?: number;
    status?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (options.order_id) {
      whereClause += ' AND log.order_id = ?';
      params.push(options.order_id);
    }

    if (options.status) {
      whereClause += ' AND log.status = ?';
      params.push(options.status);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM order_audit_logs log ${whereClause}`,
      params
    );
    const total = (countResult as any)[0].total;

    const [rows] = await pool.query(
      `SELECT log.*
       FROM order_audit_logs log
       ${whereClause}
       ORDER BY log.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows as any[],
      pagination: calculatePagination(total, page, limit),
    };
  }
}

export default new EditRequestRepository();
export const auditLogRepository = new AuditLogRepository();