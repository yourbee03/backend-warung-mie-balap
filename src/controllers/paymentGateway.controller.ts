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

      // Build callback URL (backend URL, not frontend)
      const backendUrl = config.backendUrl || config.frontendUrl;
      const callbackUrl = `${backendUrl.replace(/\/$/, '')}/api/payment-gateway/webhook`;

      // Create QR Code via Xendit (unique external_id dengan suffix timestamp)
      const externalId = `${order.order_number}-${Date.now()}`;
      const qrCode = await xenditService.createQrCode(
        externalId,
        order.total_amount,
        callbackUrl
      );

      // Save or update payment record
      let payment;
      if (existingPayment) {
        payment = await paymentRepository.updateQris(existingPayment.id, qrCode.id, qrCode.external_id);
      } else {
        payment = await paymentRepository.create({
          order_id,
          method: 'qris',
          amount: order.total_amount,
          snap_token: qrCode.id,
          redirect_url: qrCode.external_id,
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

      // Xendit QR webhook: { event: "qr.payment", data: { id, qr_id, status, amount, ... } }
      const body = req.body as { event?: string; data?: any };
      const payload = body.data || body;

      console.log(`✅ Xendit webhook received: event=${body.event} qr_id=${payload.qr_id} status=${payload.status}`);
      console.log(`📋 Webhook full payload:`, JSON.stringify(body));

      // Find payment by qr_id (stored in snap_token)
      const qrId = payload.qr_id || payload.id;
      if (!qrId) {
        return res.status(400).json({ error: 'Missing qr_id' });
      }

      console.log(`🔍 Looking for payment with snap_token: ${qrId}`);
      const payment = await paymentRepository.findByQrId(qrId);
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

  async simulatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { order_id } = req.body;

      if (!order_id) {
        throw new ApiError(400, 'order_id wajib diisi');
      }

      const payment = await paymentRepository.findByOrderId(order_id);
      if (!payment) {
        throw new ApiError(404, 'Pembayaran tidak ditemukan');
      }

      if (!payment.snap_token) {
        throw new ApiError(400, 'QR Code belum dibuat');
      }

      const externalId = payment.redirect_url || payment.snap_token;
      const result = await xenditService.simulatePayment(externalId, Number(payment.amount));

      res.status(200).json({
        success: true,
        message: 'Simulasi pembayaran berhasil',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentGatewayController();
