import userRepository from '../repositories/user.repository';
import { ApiError } from '../utils/helpers';
import { BcryptHelper } from '../utils/bcrypt';

export class UserService {
  async getAll(options: { page?: number; limit?: number; role_id?: number; search?: string }) {
    return userRepository.findAll(options);
  }

  async getById(id: number) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(404, 'User tidak ditemukan');
    return user;
  }

  async create(data: {
    name: string;
    username?: string;
    email: string;
    password: string;
    phone?: string;
    role_id?: number;
  }) {
    const existing = await userRepository.findAll({ search: data.email, limit: 1 });
    const found = existing as any;
    if (found.items && found.items.length > 0 && found.items[0].email === data.email) {
      throw new ApiError(400, 'Email sudah digunakan');
    }
    const hashedPassword = await BcryptHelper.hashPassword(data.password);
    return userRepository.create({ ...data, password: hashedPassword });
  }

  async update(id: number, data: {
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar?: string;
  }) {
    await this.getById(id);
    return userRepository.update(id, data);
  }

  async updateRole(id: number, roleId: number) {
    const user = await this.getById(id);
    if (user.role_id === 3 && roleId !== 3) {
      const allUsers = await userRepository.findAll({});
      const ownerCount = (allUsers as any).items.filter((u: any) => u.role_id === 3).length;
      if (ownerCount <= 1) {
        throw new ApiError(400, 'Tidak dapat mengubah role satu-satunya owner');
      }
    }
    await userRepository.updateRole(id, roleId);
  }

  async toggleActive(id: number) {
    await this.getById(id);
    await userRepository.toggleActive(id);
  }

  async updatePassword(id: number, password: string) {
    await this.getById(id);
    const hashedPassword = await BcryptHelper.hashPassword(password);
    await userRepository.updatePassword(id, hashedPassword);
  }

  async delete(id: number) {
    const user = await this.getById(id);
    if (user.role_id === 3) {
      throw new ApiError(400, 'Tidak dapat menghapus akun owner');
    }
    await userRepository.delete(id);
  }

  async count() {
    return userRepository.count();
  }
}

export default new UserService();
