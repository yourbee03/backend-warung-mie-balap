import categoryRepository from '../repositories/category.repository';
import { ApiError } from '../utils/helpers';

export class CategoryService {
  async getAll() {
    return categoryRepository.findAll();
  }

  async getById(id: number) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new ApiError(404, 'Kategori tidak ditemukan');
    }
    return category;
  }

  async getBySlug(slug: string) {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) {
      throw new ApiError(404, 'Kategori tidak ditemukan');
    }
    return category;
  }

  async create(data: { name: string; description?: string; image?: string }) {
    const existing = await categoryRepository.findBySlug(
      data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    );
    if (existing) {
      throw new ApiError(400, 'Nama kategori sudah ada');
    }
    return categoryRepository.create(data);
  }

  async update(id: number, data: { name?: string; description?: string; image?: string; is_active?: boolean }) {
    await this.getById(id);
    return categoryRepository.update(id, data);
  }

  async delete(id: number) {
    await this.getById(id);
    await categoryRepository.delete(id);
  }
}

export default new CategoryService();
