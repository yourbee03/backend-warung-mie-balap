import { z } from 'zod';

const orderItemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive('Jumlah harus lebih dari 0'),
  notes: z.string().optional(),
});

const createOrderBody = z.object({
  order_type: z.enum(['online', 'qr', 'takeaway'], { required_error: 'Tipe pesanan wajib diisi' }),
  order_service_type: z.enum(['takeaway', 'delivery', 'dine_in']).optional(),
  payment_method: z.enum(['cash', 'qris']).optional(),
  table_id: z.number().int().positive().optional(),
  guest_name: z.string().optional(),
  guest_phone: z.string().optional(),
  shipping_address: z.string().optional(),
  user_latitude: z.number().optional(),
  user_longitude: z.number().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Minimal 1 item'),
});

const updateStatusBody = z.object({
  status: z.enum(['pending', 'processing', 'ready', 'completed', 'cancelled'], {
    required_error: 'Status wajib diisi',
  }),
});

const idParam = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

const orderNumberParam = z.object({
  orderNumber: z.string().min(1, 'Nomor pesanan wajib diisi'),
});

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['pending', 'processing', 'ready', 'completed', 'cancelled']).optional(),
  order_type: z.enum(['online', 'qr', 'takeaway']).optional(),
  user_id: z.string().optional(),
});

export const getAllOrdersSchema = z.object({
  body: z.object({}).passthrough(),
  query: querySchema,
  params: z.object({}).passthrough(),
});

export const getOrderByIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const getByOrderNumberSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: orderNumberParam,
});

export const createOrderSchema = z.object({
  body: createOrderBody,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateOrderStatusSchema = z.object({
  body: updateStatusBody,
  query: z.object({}).passthrough(),
  params: idParam,
});

export const deleteOrderSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export type CreateOrderInput = z.infer<typeof createOrderBody>;
export type UpdateStatusInput = z.infer<typeof updateStatusBody>;
