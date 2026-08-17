import QRCode from 'qrcode';
import { config } from '../config/env';

export class QRService {
  // Generate QR code as data URL (base64)
  static async generateDataURL(url: string): Promise<string> {
    return QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  }

  // Generate QR code as buffer
  static async generateBuffer(url: string): Promise<Buffer> {
    return QRCode.toBuffer(url, {
      width: 300,
      margin: 2,
    });
  }

  // Generate QR code for table
  static async generateTableQR(tableId: number, tableNumber: string): Promise<string> {
    const url = `${config.frontendUrl}/qr/${tableId}`;
    return this.generateDataURL(url);
  }

  // Generate QR code for table with products
  static async generateTableQRWithProducts(tableId: number, tableNumber: string): Promise<string> {
    const url = `${config.frontendUrl}/qr/${tableId}`;
    return this.generateDataURL(url);
  }

  // Get table URL
  static getTableUrl(tableId: number): string {
    return `${config.frontendUrl}/qr/${tableId}`;
  }
}

export default QRService;
