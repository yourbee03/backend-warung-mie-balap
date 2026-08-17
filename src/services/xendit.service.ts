import crypto from 'crypto';
import { config } from '../config/env';
import { ApiError } from '../utils/helpers';

interface XenditQRCodeResponse {
  id: string;
  external_id: string;
  amount: number | null;
  qr_string: string;
  callback_url: string;
  type: 'DYNAMIC' | 'STATIC';
  status: 'ACTIVE' | 'INACTIVE';
  metadata: any;
  created: string;
  updated: string;
}

interface XenditWebhookPayload {
  id: string;
  external_id: string;
  amount: number;
  status: string;
  created: string;
  updated: string;
  payment_method?: any;
  metadata?: any;
}

export class XenditService {
  private secretKey: string;
  private callbackToken: string;
  private baseUrl = 'https://api.xendit.co';

  constructor() {
    this.secretKey = config.xendit.secretKey;
    this.callbackToken = config.xendit.callbackToken;
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`;
  }

  async createQrCode(externalId: string, amount: number, callbackUrl: string): Promise<XenditQRCodeResponse> {
    const response = await fetch(`${this.baseUrl}/qr_codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify({
        external_id: externalId,
        type: 'DYNAMIC',
        amount,
        callback_url: callbackUrl,
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('Xendit create QR error:', JSON.stringify({ status: response.status, data }));
      throw new ApiError(500, data.message || data.error?.message || `Xendit error ${response.status}`);
    }

    return data as XenditQRCodeResponse;
  }

  async getQrCode(externalId: string): Promise<XenditQRCodeResponse> {
    const response = await fetch(`${this.baseUrl}/qr_codes?external_id=${externalId}`, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    const data = await response.json() as any;

    if (!response.ok) {
      throw new ApiError(500, 'Gagal mengambil data QR Code');
    }

    return data as XenditQRCodeResponse;
  }

  async simulatePayment(externalId: string, amount: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/qr_codes/${externalId}/payments/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      throw new ApiError(500, data.message || 'Gagal simulasi pembayaran');
    }

    return data;
  }

  verifyWebhook(headers: any, payload: any): boolean {
    // Xendit uses x-callback-token header for webhook verification
    const callbackToken = this.callbackToken;

    if (!callbackToken || callbackToken === 'your_callback_token_here') {
      console.warn('⚠️  XENDIT_CALLBACK_TOKEN belum dikonfigurasi, skip verifikasi');
      return true;
    }

    const receivedToken = headers['x-callback-token'];
    if (!receivedToken) {
      return false;
    }

    return receivedToken === callbackToken;
  }

  isPaymentCompleted(status: string): boolean {
    return status === 'SUCCEEDED' || status === 'COMPLETED';
  }

  isPaymentPending(status: string): boolean {
    return status === 'PENDING' || status === 'ACTIVE';
  }

  isPaymentFailed(status: string): boolean {
    return ['FAILED', 'EXPIRED', 'INACTIVE'].includes(status);
  }
}

export default new XenditService();
