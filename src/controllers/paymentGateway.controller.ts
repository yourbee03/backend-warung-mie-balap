import { Request, Response, NextFunction } from 'express';
import xenditService from '../services/xendit.service';
import paymentRepository from '../repositories/payment.repository';
import orderRepository from '../repositories/order.repository';
import notificationService from '../services/notification.service';
import { emitToOrder, emitToAdmins, emitToUser } from '../config/socket';
import { ApiError } from '../utils/helpers';
import { config } from '../config/env';

export class PaymentGatewayController {
  async createQrisPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { order_id } = req.body;

      if (!order_id) {
        throw new ApiError(400, 'order_id wajib diisi');
      }

      const order = await orderRepository.findById(order_id);
      if (!order) {
        throw new ApiError(404, 'Pesanan tidak ditemukan');
      }

      let existingPayment = await paymentRepository.findByOrderId(order_id);

      // Build callback URL
      const callbackUrl = `${config.frontendUrl.replace(/\/$/, '')}/api/payment-gateway/webhook`;

      // Create QR Code via Xendit
      const qrCode = await xenditService.createQrCode(
        order.order_number,
        order.total_amount,
        callbackUrl
      );

      // Save or update payment record
      let payment;
      if (existingPayment) {
        payment = await paymentRepository.updateQris(existingPayment.id, qrCode.id);
      } else {
        payment = await paymentRepository.create({
          order_id,
          method: 'qris',
          amount: order.total_amount,
          snap_token: qrCode.id,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Pembayaran QRIS berhasil dibuat',
        data: {
          payment_id: payment.id,
          order_id,
          amount: order.total_amount,
          qr_code_id: qrCode.id,
          qr_string: qrCode.qr_string,
          external_id: qrCode.external_id,
          status: qrCode.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Verify webhook token
      if (!xenditService.verifyWebhook(req.headers, req.body)) {
        console.error('🚨 Xendit webhook ditolak: Invalid token');
        return res.status(401).json({ error: 'Invalid token' });
      }

      const payload = req.body as {
        id: string;
        external_id: string;
        amount: number;
        status: string;
        [key: string]: any;
      };

      console.log(`✅ Xendit webhook received: ${payload.external_id} - ${payload.status}`);

      // Find payment by order number (external_id)
      const payment = await paymentRepository.findByOrderNumber(payload.external_id);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (payment.status === 'paid') {
        return res.status(200).json({ message: 'Already processed' });
      }

      // Check if payment is completed
      if (xenditService.isPaymentCompleted(payload.status)) {
        await paymentRepository.updateStatus(payment.id, 'paid');
        await orderRepository.updateStatus(payment.order_id, 'processing');

        const order = await orderRepository.findById(payment.order_id);
        const updatedPayment = await paymentRepository.findById(payment.id);

        if (order) {
          await notificationService.notifyPaymentConfirmed(updatedPayment, order);

          if (order.user_id) {
            emitToUser(order.user_id, 'payment-confirmed', {
              payment: updatedPayment,
              order,
            });
          }
          emitToOrder(order.order_number, 'payment-confirmed', {
            payment: updatedPayment,
            order,
          });
          emitToAdmins('payment-confirmed', {
            payment: updatedPayment,
            order,
          });
        }
      } else if (xenditService.isPaymentFailed(payload.status)) {
        await paymentRepository.updateStatus(payment.id, 'rejected');
        await orderRepository.updateStatus(payment.order_id, 'cancelled');
      }

      res.status(200).json({ message: 'OK' });
    } catch (error) {
      next(error);
    }
  }

  async getQrisStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;

      const payment = await paymentRepository.findByOrderId(parseInt(orderId));
      if (!payment) {
        throw new ApiError(404, 'Pembayaran tidak ditemukan');
      }

      res.status(200).json({
        success: true,
        data: {
          payment_id: payment.id,
          status: payment.status,
          method: payment.method,
          amount: payment.amount,
          qr_code_id: payment.snap_token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentGatewayController();
