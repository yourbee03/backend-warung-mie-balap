import { Request, Response, NextFunction } from 'express';
import { JwtHelper } from '../utils/jwt';
import { ResponseHelper } from '../utils/response';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = JwtHelper.getTokenFromHeader(req.headers.authorization);

    if (!token) {
      ResponseHelper.unauthorized(res, 'Authentication required');
      return;
    }

    const decoded = JwtHelper.verifyToken(token);

    if (!decoded) {
      ResponseHelper.unauthorized(res, 'Invalid or expired token');
      return;
    }

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, role_id, name, email, phone, address, avatar, is_active FROM users WHERE id = ? AND is_active = true',
      [decoded.id]
    );

    if (users.length === 0) {
      ResponseHelper.unauthorized(res, 'User not found or inactive');
      return;
    }

    req.user = users[0] as any;
    next();
  } catch (error) {
    ResponseHelper.error(res, 'Authentication failed', 401);
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = JwtHelper.getTokenFromHeader(req.headers.authorization);

    if (!token) {
      next();
      return;
    }

    const decoded = JwtHelper.verifyToken(token);

    if (!decoded) {
      next();
      return;
    }

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, role_id, name, email, phone, address, avatar, is_active FROM users WHERE id = ? AND is_active = true',
      [decoded.id]
    );

    if (users.length > 0) {
      req.user = users[0] as any;
    }

    next();
  } catch (error) {
    next();
  }
};
