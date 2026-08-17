import { Router } from 'express';
import categoryController from '../controllers/category.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import {
  getAllCategoriesSchema,
  getCategoryByIdSchema,
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from '../validators/category.validator';

const router = Router();

router.get('/', validate(getAllCategoriesSchema), categoryController.getAll);
router.get('/:id', validate(getCategoryByIdSchema), categoryController.getById);

// Admin routes
router.post('/', authenticate, authorize(2, 3), validate(createCategorySchema), categoryController.create);
router.put('/:id', authenticate, authorize(2, 3), validate(updateCategorySchema), categoryController.update);
router.delete('/:id', authenticate, authorize(2, 3), validate(deleteCategorySchema), categoryController.delete);

export default router;
