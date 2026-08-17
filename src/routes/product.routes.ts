import { Router } from 'express';
import productController from '../controllers/product.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import {
  getAllProductsSchema,
  getProductByIdSchema,
  getProductBySlugSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  addProductImageSchema,
  deleteProductImageSchema,
} from '../validators/product.validator';

const router = Router();

// Public routes — static paths BEFORE :id
router.get('/', validate(getAllProductsSchema), productController.getAll);
router.get('/slug/:slug', validate(getProductBySlugSchema), productController.getBySlug);

// Admin routes — static paths BEFORE :id
router.get('/admin/all', authenticate, authorize(2, 3), validate(getAllProductsSchema), productController.getAllAdmin);
router.post('/', authenticate, authorize(2, 3), validate(createProductSchema), productController.create);

// Parameterized routes — :id LAST
router.get('/:id', validate(getProductByIdSchema), productController.getById);
router.put('/:id', authenticate, authorize(2, 3), validate(updateProductSchema), productController.update);
router.put('/:id/toggle-stock', authenticate, authorize(2, 3), productController.toggleStock);
router.delete('/:id', authenticate, authorize(2, 3), validate(deleteProductSchema), productController.delete);
router.post('/:id/images', authenticate, authorize(2, 3), validate(addProductImageSchema), productController.addImage);
router.post('/:id/images/upload', authenticate, authorize(2, 3), uploadSingle, productController.uploadImage);
router.delete('/:id/images/:imageId', authenticate, authorize(2, 3), validate(deleteProductImageSchema), productController.deleteImage);

export default router;
