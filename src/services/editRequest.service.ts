import orderRepository from '../repositories/order.repository';
import productRepository from '../repositories/product.repository';
import editRequestRepository, { auditLogRepository } from '../repositories/editRequest.repository';
import notificationService from './notification.service';
import { ApiError } from '../utils/helpers';
import { emitToAdmins } from '../config/socket';
import pool from '../config/database';

export class EditRequestService {
  async getAll(options: {
    page?: number;
    limit?: number;
    status?: string;
    order_id?: number;
  }) {
    return editRequestRepository.findAll(options);
  }

  async getById(id: number, user: any) {
    const request = await editRequestRepository.findById(id);
    if (!request) {
      throw new ApiError(404, 'Permintaan edit tidak ditemukan');
    }

    // Access: owner (3) & admin (2) only
    if (![2, 3].includes(user.role_id)) {
      throw new ApiError(403, 'Tidak memiliki akses');
    }

    return request;
  }

  // Owner/Super Admin mengajukan perubahan pesanan
  async requestEdit(ownerId: number, orderId: number, data: {
    items: { product_id: number; quantity: number; notes?: string; options_price?: number }[];
    reason?: string;
  }, ownerName?: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Pesanan tidak ditemukan');
    }

    // Build old_items snapshot dari isi pesanan saat ini
    const oldItems = (order.items || []).map((item: any) => ({
      product_id: item.product_id,
      name: item.product_name || item.product?.name || `Produk ${item.product_id}`,
      quantity: item.quantity,
      price: Number(item.price),
      options_price: Number(item.options_price || 0),
      subtotal: Number(item.subtotal),
      notes: item.notes || undefined,
    }));

    // Validate new items and get current prices
    const newItems = [];
    for (const item of data.items) {
      const product = await productRepository.findById(item.product_id);
      if (!product) {
        throw new ApiError(400, `Produk dengan ID ${item.product_id} tidak ditemukan`);
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Stok produk ${product.name} tidak mencukupi`);
      }
      const basePrice = Number(product.price);
      const optPrice = item.options_price || 0;
      newItems.push({
        product_id: item.product_id,
        name: product.name,
        quantity: item.quantity,
        price: basePrice + optPrice,
        subtotal: (basePrice + optPrice) * item.quantity,
        notes: item.notes || undefined,
        options_price: optPrice,
      });
    }

    const requestId = await editRequestRepository.create({
      order_id: orderId,
      requested_by: ownerId,
      reason: data.reason,
      old_items: oldItems,
      new_items: newItems,
    });

    await auditLogRepository.create({
      order_id: orderId,
      edit_request_id: requestId,
      action: 'edit_requested',
      actor_id: ownerId,
      actor_name: ownerName || undefined,
      actor_role: 'owner',
      old_data: oldItems,
      new_data: newItems,
      description: `Owner mengajukan perubahan pesanan ${order.order_number}`,
      status: 'pending',
    });

    await notificationService.broadcast({
      type: 'order_edit_requested',
      title: 'Permintaan Edit Pesanan',
      message: `Owner mengajukan perubahan untuk pesanan ${order.order_number}. Mohon verifikasi oleh Admin.`,
      data: { order_id: orderId, edit_request_id: requestId, order_number: order.order_number },
    });

    emitToAdmins('edit-request-updated', { order_id: orderId, edit_request_id: requestId });

    return editRequestRepository.findById(requestId);
  }

  // Admin memverifikasi permintaan edit
  async verify(adminId: number, requestId: number, data: {
    approve: boolean;
    reason?: string;
  }, adminName?: string) {
    const request = await editRequestRepository.findById(requestId);
    if (!request) {
      throw new ApiError(404, 'Permintaan edit tidak ditemukan');
    }
    if (request.status !== 'pending') {
      throw new ApiError(400, 'Permintaan edit sudah diverifikasi');
    }

    const approve = data.approve;

    if (approve) {
      // Apply perubahan ke order + stock, lalu tandai approved & applied
      await this.applyChanges(request, adminId);
    } else {
      // Tolak: tidak diterapkan
      await editRequestRepository.verifyAdmin(requestId, adminId, false, data.reason);
    }

    await auditLogRepository.create({
      order_id: request.order_id,
      edit_request_id: requestId,
      action: approve ? 'applied' : 'rejected',
      actor_id: adminId,
      actor_name: adminName || undefined,
      actor_role: 'admin',
      old_data: request.old_items,
      new_data: approve ? request.new_items : undefined,
      description: approve
        ? `Admin menyetujui dan perubahan pesanan ${request.order_number} diterapkan.`
        : `Admin menolak perubahan pesanan ${request.order_number}. Catatan: ${data.reason || '-'}`,
      status: approve ? 'approved' : 'rejected',
    });

    if (approve) {
      await notificationService.broadcast({
        type: 'order_edit_applied',
        title: 'Perubahan Pesanan Diterapkan',
        message: `Perubahan pesanan ${request.order_number} telah diverifikasi dan diterapkan oleh Admin.`,
        data: { order_id: request.order_id, edit_request_id: requestId, order_number: request.order_number },
      });
    } else {
      await notificationService.broadcast({
        type: 'order_edit_rejected',
        title: 'Perubahan Pesanan Ditolak',
        message: `Perubahan pesanan ${request.order_number} ditolak oleh Admin.`,
        data: { order_id: request.order_id, edit_request_id: requestId, order_number: request.order_number },
      });
    }

    emitToAdmins('edit-request-updated', { order_id: request.order_id, edit_request_id: requestId });

    return editRequestRepository.findById(requestId);
  }

  // Terapkan perubahan: perbarui order_items, total_amount, payments & kembalikan/tambahkan stock
  private async applyChanges(request: any, appliedBy: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const orderId = request.order_id;
      const oldItems = request.old_items || [];
      const newItems = request.new_items || [];

      // Return old stock
      for (const old of oldItems) {
        await connection.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [old.quantity, old.product_id]
        );
      }

      // Deduct new stock (validated earlier)
      for (const item of newItems) {
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Replace order items
      await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of newItems) {
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price, options_price, subtotal, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.price, (item as any).options_price || 0, item.subtotal, item.notes || null]
        );
      }

      // Recompute total (items + existing shipping cost)
      const itemsTotal = newItems.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
      const order = await orderRepository.findById(orderId);
      const shippingCost = Number(order?.shipping_cost) || 0;
      const totalAmount = itemsTotal + shippingCost;
      await connection.query('UPDATE orders SET total_amount = ? WHERE id = ?', [totalAmount, orderId]);

      // Update payment amount if exists
      await connection.query(
        'UPDATE payments SET amount = ? WHERE order_id = ?',
        [totalAmount, orderId]
      );

      // Mark edit request as verified & applied
      await connection.query(
        `UPDATE order_edit_requests
         SET admin_verified_by = ?, admin_verified_at = NOW(), status = 'approved',
             applied_at = NOW(), applied_by = ?
         WHERE id = ?`,
        [appliedBy, appliedBy, request.id]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getAuditLogs(options: {
    page?: number;
    limit?: number;
    order_id?: number;
    status?: string;
  }) {
    return auditLogRepository.findAll(options);
  }
}

export default new EditRequestService();