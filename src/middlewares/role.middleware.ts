import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/response';

export const authorize = (...roles: number[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHelper.unauthorized(res, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role_id)) {
      ResponseHelper.forbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role_id !== 2) {
    ResponseHelper.forbidden(res, 'Admin access required');
    return;
  }
  next();
};

export const isOwner = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role_id !== 3) {
    ResponseHelper.forbidden(res, 'Owner access required');
    return;
  }
  next();
};

export const isCustomer = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role_id !== 1) {
    ResponseHelper.forbidden(res, 'Customer access required');
    return;
  }
  next();
};
