import { Router } from 'express';
import editRequestController from '../controllers/editRequest.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import {
  createEditRequestSchema,
  verifyEditRequestSchema,
  getEditRequestsSchema,
  getEditRequestByIdSchema,
  getAuditLogsSchema,
} from '../validators/editRequest.validator';

const router = Router();

// Logs/audit trail (owner & admin)
router.get('/logs', authenticate, authorize(2, 3), validate(getAuditLogsSchema), editRequestController.getAuditLogs);

// Admin mengajukan perubahan pesanan
router.post('/orders/:id/edit-request', authenticate, authorize(2), validate(createEditRequestSchema), editRequestController.requestEdit);

// List & detail edit requests (owner & admin)
router.get('/requests', authenticate, authorize(2, 3), validate(getEditRequestsSchema), editRequestController.getAll);
router.get('/requests/:id', authenticate, authorize(2, 3), validate(getEditRequestByIdSchema), editRequestController.getById);

// Owner memverifikasi
router.put('/requests/:id/verify', authenticate, authorize(3), validate(verifyEditRequestSchema), editRequestController.verify);

export default router;