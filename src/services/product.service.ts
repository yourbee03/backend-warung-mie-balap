import productRepository from '../repositories/product.repository';
import categoryRepository from '../repositories/category.repository';
import { ApiError } from '../utils/helpers';
import { broadcast } from '../config/socket';

export class ProductService {
  async getAll(options: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
    is_active?: boolean;
  }) {
    return productRepository.findAll(options);
  }

  async getById(id: number) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new ApiError(404, 'Produk tidak ditemukan');
    }
    return product;
  }

  async getBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw new ApiError(404, 'Produk tidak ditemukan');
    }
    return product;
  }

  async create(data: {
    category_id: number;
    name: string;
    description?: string;
    custom_options?: any;
    price: number;
    stock: number;
    images?: { image: string; is_primary?: boolean }[];
  }) {
    const category = await categoryRepository.findById(data.category_id);
    if (!category) {
      throw new ApiError(400, 'Kategori tidak ditemukan');
    }

    return productRepository.create(data);
  }

  async update(id: number, data: {
    category_id?: number;
    name?: string;
    description?: string;
    custom_options?: any;
    price?: number;
    stock?: number;
    is_active?: boolean;
  }) {
    await this.getById(id);

    if (data.category_id) {
      const category = await categoryRepository.findById(data.category_id);
      if (!category) {
        throw new ApiError(400, 'Kategori tidak ditemukan');
      }
    }

    return productRepository.update(id, data);
  }

  async delete(id: number) {
    await this.getById(id);
    await productRepository.delete(id);
  }

  async addImage(productId: number, image: string, isPrimary: boolean = false) {
    await this.getById(productId);
    return productRepository.addImage(productId, image, isPrimary);
  }

  async deleteImage(imageId: number) {
    await productRepository.deleteImage(imageId);
  }

  async toggleStock(id: number) {
    await this.getById(id);
    const product = await productRepository.toggleStock(id);
    broadcast('stock-changed', { id: product.id, stock: product.stock, name: product.name });
    return product;
  }
}

export default new ProductService();
