import { z } from 'zod';

const editRequestItemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive('Jumlah harus lebih dari 0'),
  notes: z.string().optional(),
  options_price: z.number().min(0).optional(),
});

const createEditRequestBody = z.object({
  reason: z.string().optional(),
  items: z.array(editRequestItemSchema).min(1, 'Minimal 1 item'),
});

const verifyEditRequestBody = z.object({
  approve: z.boolean(),
  reason: z.string().optional(),
});

const idParam = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  order_id: z.string().optional(),
});

export const createEditRequestSchema = z.object({
  body: createEditRequestBody,
  query: z.object({}).passthrough(),
  params: idParam,
});

export const verifyEditRequestSchema = z.object({
  body: verifyEditRequestBody,
  query: z.object({}).passthrough(),
  params: idParam,
});

export const getEditRequestsSchema = z.object({
  body: z.object({}).passthrough(),
  query: querySchema,
  params: z.object({}).passthrough(),
});

export const getEditRequestByIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const getAuditLogsSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    order_id: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }).passthrough(),
  params: z.object({}).passthrough(),
});

export type CreateEditRequestInput = z.infer<typeof createEditRequestBody>;
export type VerifyEditRequestInput = z.infer<typeof verifyEditRequestBody>;