import orderRepository from '../repositories/order.repository';
import productRepository from '../repositories/product.repository';
import notificationService from './notification.service';
import { calculateShippingCost } from '../utils/shipping';
import { ApiError } from '../utils/helpers';

export class OrderService {
  async getAll(options: {
    page?: number;
    limit?: number;
    user_id?: number;
    status?: string;
    order_type?: string;
  }) {
    return orderRepository.findAll(options);
  }

  async getById(id: number) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new ApiError(404, 'Pesanan tidak ditemukan');
    }
    return order;
  }

  async getByOrderNumber(orderNumber: string) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new ApiError(404, 'Pesanan tidak ditemukan');
    }
    return order;
  }

  async create(data: {
    user_id?: number | null;
    table_id?: number;
    order_type: 'online' | 'qr' | 'takeaway';
    order_service_type?: 'takeaway' | 'delivery' | 'dine_in';
    payment_method?: 'cash' | 'qris';
    items: { product_id: number; quantity: number; price: number; notes?: string; options_price?: number }[];
    guest_name?: string;
    guest_phone?: string;
    shipping_address?: string;
    user_latitude?: number;
    user_longitude?: number;
    notes?: string;
    created_by?: number;
  }) {
    // Anti fake-order validation untuk pesanan online:
    // - wajib nomor HP yang valid
    // - wajib alamat jika delivery
    // - pesanan dimulai dengan status 'pending' (belum dikonfirmasi)
    if (data.order_type === 'online') {
      const phone = (data.guest_phone || '').replace(/[^0-9]/g, '');
      if (phone.length < 9) {
        throw new ApiError(400, 'Nomor HP wajib diisi untuk pesanan online');
      }
      if (data.order_service_type === 'delivery' && !data.shipping_address?.trim()) {
        throw new ApiError(400, 'Alamat pengiriman wajib diisi untuk pesanan delivery');
      }
    }

    // Validate products and get current prices
    const validatedItems = [];
    for (const item of data.items) {
      const product = await productRepository.findById(item.product_id);
      if (!product) {
        throw new ApiError(400, `Produk dengan ID ${item.product_id} tidak ditemukan`);
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Stok produk ${product.name} tidak mencukupi`);
      }
      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: Number(product.price) + (item.options_price || 0),
        options_price: item.options_price || 0,
        notes: item.notes || null,
      });
    }

    // Calculate shipping cost for online delivery with coordinates
    let shippingCost = 0;
    let shippingDistance: number | undefined;
    if (data.order_type === 'online' && data.order_service_type === 'delivery' && data.user_latitude && data.user_longitude) {
      const result = await calculateShippingCost(data.user_latitude, data.user_longitude);
      shippingCost = result.cost;
      shippingDistance = result.distance;
    }

    // Strip null/undefined optional fields
    const orderData: any = {
      order_type: data.order_type,
      order_service_type: data.order_type === 'online' ? data.order_service_type || 'dine_in' : null,
      payment_method: data.payment_method || 'cash',
      items: validatedItems,
      shipping_cost: shippingCost,
    };
    if (data.user_id) orderData.user_id = data.user_id;
    if (data.table_id) orderData.table_id = data.table_id;
    if (data.guest_name) orderData.guest_name = data.guest_name;
    if (data.guest_phone) orderData.guest_phone = data.guest_phone;
    if (data.shipping_address) orderData.shipping_address = data.shipping_address;
    if (shippingDistance !== undefined) orderData.shipping_distance = shippingDistance;
    if (data.notes) orderData.notes = data.notes;

    const order = await orderRepository.create(orderData);

    // Notify admins about new order
    await notificationService.notifyNewOrder(order);

    return order;
  }

  async updateStatus(id: number, status: string) {
    const order = await this.getById(id);
    const updatedOrder = await orderRepository.updateStatus(id, status);
    
    // Notify about status change
    await notificationService.notifyOrderStatusChanged(updatedOrder);
    
    return updatedOrder;
  }

  async delete(id: number) {
    await this.getById(id);
    await orderRepository.delete(id);
  }

  async getStats() {
    const totalOrders = await orderRepository.count();
    const todayOrders = await orderRepository.getTodayOrders();
    const totalRevenue = await orderRepository.getTotalRevenue();

    return {
      total_orders: totalOrders,
      today_orders: todayOrders,
      total_revenue: totalRevenue,
    };
  }
}

export default new OrderService();
