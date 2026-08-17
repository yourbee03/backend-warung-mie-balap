import { Request, Response, NextFunction } from 'express';
import { calculateShippingCost } from '../utils/shipping';
import { ResponseHelper } from '../utils/response';

export class ShippingController {
  async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const { latitude, longitude } = req.body;

      if (latitude === undefined || longitude === undefined) {
        ResponseHelper.error(res, 'Koordinat lokasi diperlukan', 400);
        return;
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        ResponseHelper.error(res, 'Koordinat tidak valid', 400);
        return;
      }

      const result = await calculateShippingCost(lat, lng);
      ResponseHelper.success(res, result, 'Perhitungan ongkir');
    } catch (error) {
      next(error);
    }
  }
}

export default new ShippingController();
