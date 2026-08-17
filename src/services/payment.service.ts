import paymentRepository from '../repositories/payment.repository';
import orderRepository from '../repositories/order.repository';
import notificationService from './notification.service';
import { ApiError } from '../utils/helpers';

export class PaymentService {
  async getByOrderId(orderId: number) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new ApiError(404, 'Pembayaran tidak ditemukan');
    }
    return payment;
  }

  async getById(id: number) {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      throw new ApiError(404, 'Pembayaran tidak ditemukan');
    }
    return payment;
  }

  async create(data: {
    order_id: number;
    method: 'cash' | 'bank_transfer';
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  }) {
    const order = await orderRepository.findById(data.order_id);
    if (!order) {
      throw new ApiError(404, 'Pesanan tidak ditemukan');
    }

    const existingPayment = await paymentRepository.findByOrderId(data.order_id);
    if (existingPayment) {
      throw new ApiError(400, 'Pesanan ini sudah memiliki pembayaran');
    }

    return paymentRepository.create({
      ...data,
      amount: order.total_amount,
    });
  }

  async confirmPayment(id: number, verifiedBy: number) {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      throw new ApiError(404, 'Pembayaran tidak ditemukan');
    }

    if (payment.status === 'paid') {
      throw new ApiError(400, 'Pembayaran sudah dikonfirmasi');
    }

    // Update payment status
    await paymentRepository.updateStatus(id, 'paid', verifiedBy);

    // Update order status to processing
    await orderRepository.updateStatus(payment.order_id, 'processing');

    const updatedPayment = await paymentRepository.findById(id);
    const order = await orderRepository.findById(payment.order_id);

    // Notify about payment confirmation
    if (order) {
      await notificationService.notifyPaymentConfirmed(updatedPayment, order);
    }

    return updatedPayment;
  }

  async rejectPayment(id: number, verifiedBy: number) {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      throw new ApiError(404, 'Pembayaran tidak ditemukan');
    }

    await paymentRepository.updateStatus(id, 'rejected', verifiedBy);

    // Update order status to cancelled
    await orderRepository.updateStatus(payment.order_id, 'cancelled');

    return paymentRepository.findById(id);
  }

  async updateBankInfo(id: number, data: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  }) {
    await paymentRepository.findById(id);
    return paymentRepository.updateBankInfo(id, data);
  }

  async getAll(options: { page?: number; limit?: number; status?: string }) {
    return paymentRepository.findAll(options);
  }
}

export default new PaymentService();
