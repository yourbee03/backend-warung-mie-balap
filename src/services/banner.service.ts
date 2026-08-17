import bannerRepository from '../repositories/banner.repository';
import { ApiError } from '../utils/helpers';

export class BannerService {
  async getAll() {
    return bannerRepository.findAll();
  }

  async getActive() {
    return bannerRepository.findActive();
  }

  async getById(id: number) {
    const banner = await bannerRepository.findById(id);
    if (!banner) throw new ApiError(404, 'Banner tidak ditemukan');
    return banner;
  }

  async create(data: { title: string; image: string; link?: string; sort_order?: number }) {
    return bannerRepository.create(data);
  }

  async update(id: number, data: { title?: string; image?: string; link?: string; sort_order?: number; is_active?: boolean }) {
    await this.getById(id);
    return bannerRepository.update(id, data);
  }

  async delete(id: number) {
    await this.getById(id);
    await bannerRepository.delete(id);
  }
}

export default new BannerService();
