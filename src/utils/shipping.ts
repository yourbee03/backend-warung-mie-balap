import settingRepository from '../repositories/setting.repository';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export async function calculateShippingCost(
  userLat: number,
  userLng: number
): Promise<{ distance: number; cost: number }> {
  const shopLatSetting = await settingRepository.findByKey('shop_latitude');
  const shopLngSetting = await settingRepository.findByKey('shop_longitude');
  const pricePerKmSetting = await settingRepository.findByKey('shipping_cost_per_km');
  const minKmSetting = await settingRepository.findByKey('minimum_shipping_km');

  const shopLat = parseFloat(shopLatSetting?.value || '0.0003379');
  const shopLng = parseFloat(shopLngSetting?.value || '100.2203118');
  const pricePerKm = parseInt(pricePerKmSetting?.value || '3000', 10);
  const minimumKm = parseInt(minKmSetting?.value || '1', 10);

  let distance = haversineDistance(shopLat, shopLng, userLat, userLng);

  if (distance < minimumKm) {
    distance = minimumKm;
  }

  distance = Math.ceil(distance);

  const cost = distance * pricePerKm;

  return { distance, cost };
}
