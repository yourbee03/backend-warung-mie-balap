import { z } from 'zod';

const categoryBody = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter'),
  description: z.string().optional(),
  image: z.string().optional(),
  is_active: z.preprocess((v) => v === true || v === 1 || v === '1', z.boolean().optional()),
});

const idParam = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

const slugParam = z.object({
  slug: z.string().min(1, 'Slug wajib diisi'),
});

export const getAllCategoriesSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const getCategoryByIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const getCategoryBySlugSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: slugParam,
});

export const createCategorySchema = z.object({
  body: categoryBody,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateCategorySchema = z.object({
  body: categoryBody.partial(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const deleteCategorySchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export type CreateCategoryInput = z.infer<typeof categoryBody>;
export type UpdateCategoryInput = Partial<z.infer<typeof categoryBody>>;
