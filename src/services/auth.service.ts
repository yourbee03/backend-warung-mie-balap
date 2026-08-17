import authRepository from '../repositories/auth.repository';
import { BcryptHelper } from '../utils/bcrypt';
import { JwtHelper } from '../utils/jwt';
import { ApiError } from '../utils/helpers';
import { User } from '../types';
import crypto from 'crypto';

export class AuthService {
  async register(data: { name: string; email: string; password: string; phone?: string; username?: string }) {
    const existingUser = await authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ApiError(400, 'Email sudah terdaftar');
    }

    if (data.username) {
      const existingUsername = await authRepository.findByUsername(data.username);
      if (existingUsername) {
        throw new ApiError(400, 'Username sudah digunakan');
      }
    }

    const hashedPassword = await BcryptHelper.hashPassword(data.password);
    const user = await authRepository.create({
      ...data,
      password: hashedPassword,
    });

    const token = JwtHelper.generateToken({
      id: user.id,
      email: user.email,
      role_id: user.role_id,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(username: string, password: string) {
    const user = await authRepository.findByUsername(username);
    if (!user) {
      throw new ApiError(401, 'Username atau password salah');
    }

    if (!user.is_active) {
      throw new ApiError(403, 'Akun tidak aktif');
    }

    const isPasswordValid = await BcryptHelper.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Username atau password salah');
    }

    const token = JwtHelper.generateToken({
      id: user.id,
      email: user.email,
      role_id: user.role_id,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async refreshToken(token: string) {
    const decoded = JwtHelper.verifyRefreshToken(token);
    if (!decoded) {
      throw new ApiError(401, 'Token tidak valid');
    }

    const user = await authRepository.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'User tidak ditemukan');
    }

    if (!user.is_active) {
      throw new ApiError(403, 'Akun tidak aktif');
    }

    const newToken = JwtHelper.generateToken({
      id: user.id,
      email: user.email,
      role_id: user.role_id,
    });

    return {
      user: this.sanitizeUser(user),
      token: newToken,
    };
  }

  async getMe(userId: number) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User tidak ditemukan');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: number, data: { name?: string; phone?: string; address?: string; avatar?: string }) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User tidak ditemukan');
    }
    const updated = await authRepository.updateProfile(userId, data);
    return this.sanitizeUser(updated!);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User tidak ditemukan');
    }
    const isPasswordValid = await BcryptHelper.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError(400, 'Password lama salah');
    }
    const hashedPassword = await BcryptHelper.hashPassword(newPassword);
    await authRepository.updatePassword(userId, hashedPassword);
  }

  async forgotPassword(email: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'Jika email terdaftar, link reset password telah dikirim' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await authRepository.updateResetToken(user.id, resetToken, resetTokenExpires);

    // In production, send email here. For now, return the token directly.
    return {
      message: 'Link reset password telah dikirim ke email Anda',
      resetToken, // Only for development/demo
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await authRepository.findByResetToken(token);
    if (!user) {
      throw new ApiError(400, 'Token reset password tidak valid atau sudah kedaluwarsa');
    }

    if (user.reset_token_expires && new Date(user.reset_token_expires) < new Date()) {
      throw new ApiError(400, 'Token reset password sudah kedaluwarsa');
    }

    const hashedPassword = await BcryptHelper.hashPassword(newPassword);
    await authRepository.updatePassword(user.id, hashedPassword);
    await authRepository.clearResetToken(user.id);
  }

  private sanitizeUser(user: User) {
    const { password, reset_token, reset_token_expires, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export default new AuthService();
