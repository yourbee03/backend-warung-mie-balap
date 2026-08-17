import { z } from 'zod';

const registerBody = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter').optional(),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().optional(),
});

const loginBody = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const refreshTokenBody = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
});

const forgotPasswordBody = z.object({
  email: z.string().email('Email tidak valid'),
});

const resetPasswordBody = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
  new_password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const registerSchema = z.object({
  body: registerBody,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const loginSchema = z.object({
  body: loginBody,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const refreshTokenSchema = z.object({
  body: refreshTokenBody,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const forgotPasswordSchema = z.object({
  body: forgotPasswordBody,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const resetPasswordSchema = z.object({
  body: resetPasswordBody,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export type RegisterInput = z.infer<typeof registerBody>;
export type LoginInput = z.infer<typeof loginBody>;
export type RefreshTokenInput = z.infer<typeof refreshTokenBody>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordBody>;
export type ResetPasswordInput = z.infer<typeof resetPasswordBody>;
