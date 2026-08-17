import jwt from 'jsonwebtoken';
import { config } from '../config/env';

interface TokenPayload {
  id: number;
  email: string;
  role_id: number;
}

export class JwtHelper {
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  static generateRefreshToken(payload: { id: number; email: string }): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  static verifyRefreshToken(token: string): { id: number; email: string } | null {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as { id: number; email: string };
    } catch (error) {
      return null;
    }
  }

  static getTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
