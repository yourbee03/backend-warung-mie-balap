import settingRepository from '../repositories/setting.repository';
import { ApiError } from '../utils/helpers';

export class SettingService {
  async getAll() {
    return settingRepository.findAll();
  }

  async getByKey(key: string) {
    const setting = await settingRepository.findByKey(key);
    if (!setting) throw new ApiError(404, 'Setting tidak ditemukan');
    return setting;
  }

  async update(settings: { key: string; value: string }[]) {
    for (const setting of settings) {
      const existing = await settingRepository.findByKey(setting.key);
      if (!existing) {
        throw new ApiError(400, `Setting ${setting.key} tidak ditemukan`);
      }
    }
    await settingRepository.updateMultiple(settings);
    return this.getAll();
  }
}

export default new SettingService();
