import { z } from 'zod';

const productBody = z.object({
  category_id: z.number().int().positive('Kategori wajib dipilih'),
  name: z.string().min(2, 'Nama produk minimal 2 karakter'),
  description: z.string().optional(),
  custom_options: z.array(z.object({
    name: z.string(),
    key: z.string(),
    options: z.array(z.union([
      z.string().transform((s) => ({ label: s, price: 0 })),
      z.object({ label: z.string(), price: z.number().min(0) }),
    ])),
  })).optional(),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  stock: z.number().int().min(0, 'Stok tidak boleh negatif'),
  is_active: z.preprocess((v) => v === true || v === 1 || v === '1', z.boolean().optional()),
  images: z.array(z.object({
    image: z.string(),
    is_primary: z.preprocess((v) => v === true || v === 1 || v === '1', z.boolean().optional()),
  })).optional(),
});

const idParam = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus angka'),
});

const slugParam = z.object({
  slug: z.string().min(1, 'Slug wajib diisi'),
});

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc']).optional(),
});

export const getAllProductsSchema = z.object({
  body: z.object({}).passthrough(),
  query: querySchema,
  params: z.object({}).passthrough(),
});

export const getProductByIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const getProductBySlugSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: slugParam,
});

export const createProductSchema = z.object({
  body: productBody,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateProductSchema = z.object({
  body: productBody.partial(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const deleteProductSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const addProductImageSchema = z.object({
  body: z.object({
    image: z.string().min(1, 'URL gambar wajib diisi'),
    is_primary: z.preprocess((v) => v === true || v === 1 || v === '1', z.boolean().optional()),
  }),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const deleteProductImageSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus angka'),
    imageId: z.string().regex(/^\d+$/, 'Image ID harus angka'),
  }),
});

export type CreateProductInput = z.infer<typeof productBody>;
export type UpdateProductInput = Partial<z.infer<typeof productBody>>;
