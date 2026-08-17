import { z } from 'zod';

const createPaymentBody = z.object({
  order_id: z.number().int().positive('Order ID wajib diisi'),
  method: z.enum(['cash', 'bank_transfer', 'qris'], { required_error: 'Metode pembayaran wajib diisi' }),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  account_name: z.string().optional(),
});

const idParam = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

const orderIdParam = z.object({
  orderId: z.string().regex(/^\d+$/, 'Order ID harus angka'),
});

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['pending', 'paid', 'rejected']).optional(),
});

export const getPaymentByOrderIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: orderIdParam,
});

export const getPaymentByIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const createPaymentSchema = z.object({
  body: createPaymentBody,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const confirmPaymentSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const rejectPaymentSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const getAllPaymentsSchema = z.object({
  body: z.object({}).passthrough(),
  query: querySchema,
  params: z.object({}).passthrough(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentBody>;
