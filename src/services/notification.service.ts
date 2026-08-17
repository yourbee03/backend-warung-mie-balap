import notificationRepository from '../repositories/notification.repository';
import { emitToUser, emitToAdmins, emitToOrder, broadcast } from '../config/socket';

export class NotificationService {
  async getByUserId(userId: number, limit?: number) {
    return notificationRepository.findByUserId(userId, limit);
  }

  async getUnreadCount(userId: number) {
    return notificationRepository.findUnreadCount(userId);
  }

  async create(data: { user_id?: number; type: string; title: string; message: string; data?: any }) {
    const notification = await notificationRepository.create(data);
    
    // Emit to specific user if user_id is provided
    if (data.user_id) {
      emitToUser(data.user_id, 'notification', notification);
    }
    
    return notification;
  }

  async markAsRead(id: number) {
    await notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: number) {
    await notificationRepository.markAllAsRead(userId);
  }

  async delete(id: number) {
    await notificationRepository.delete(id);
  }

  async broadcast(data: { type: string; title: string; message: string; data?: any }) {
    const notification = await this.create(data);
    broadcast('notification', notification);
    return notification;
  }

  // Order-related notifications
  async notifyNewOrder(order: any) {
    // Notify admins about new order
    emitToAdmins('new-order', order);
    
    // Create notification in database
    await this.broadcast({
      type: 'new_order',
      title: 'Pesanan Baru',
      message: `Pesanan ${order.order_number} dari ${order.user_name || order.guest_name || 'Pelanggan'}`,
      data: { order_id: order.id, order_number: order.order_number },
    });
  }

  async notifyOrderStatusChanged(order: any) {
    // Notify the user who made the order
    if (order.user_id) {
      emitToUser(order.user_id, 'order-updated', order);
    }
    
    // Notify via order tracking
    emitToOrder(order.order_number, 'order-updated', order);
    
    // Notify admins
    emitToAdmins('order-updated', order);
    
    // Create notification
    const statusMessages: Record<string, string> = {
      processing: 'sedang diproses',
      ready: 'siap diambil',
      completed: 'telah selesai',
      cancelled: 'dibatalkan',
    };

    await this.create({
      user_id: order.user_id,
      type: 'order_status',
      title: 'Status Pesanan Diperbarui',
      message: `Pesanan ${order.order_number} ${statusMessages[order.status] || order.status}`,
      data: { order_id: order.id, status: order.status },
    });
  }

  async notifyPaymentConfirmed(payment: any, order: any) {
    if (order.user_id) {
      emitToUser(order.user_id, 'payment-confirmed', { payment, order });
    }
    
    emitToOrder(order.order_number, 'payment-confirmed', { payment, order });
    
    // Notify admins
    emitToAdmins('payment-confirmed', { payment, order });
    
    await this.create({
      user_id: order.user_id,
      type: 'payment_confirmed',
      title: 'Pembayaran Dikonfirmasi',
      message: `Pembayaran untuk pesanan ${order.order_number} telah dikonfirmasi`,
      data: { order_id: order.id, payment_id: payment.id },
    });
  }
}

export default new NotificationService();
