import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export class ResponseHelper {
  static success<T>(res: Response, data: T, message: string = 'Success'): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    res.status(200).json(response);
  }

  static created<T>(res: Response, data: T, message: string = 'Created successfully'): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    res.status(201).json(response);
  }

  static error(res: Response, message: string = 'Internal server error', statusCode: number = 500, errors?: any[]): void {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
    };
    res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string = 'Bad request', errors?: any[]): void {
    ResponseHelper.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    ResponseHelper.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): void {
    ResponseHelper.error(res, message, 403);
  }

  static notFound(res: Response, message: string = 'Not found'): void {
    ResponseHelper.error(res, message, 404);
  }

  static conflict(res: Response, message: string = 'Conflict'): void {
    ResponseHelper.error(res, message, 409);
  }

  static paginated<T>(res: Response, data: PaginatedResponse<T>, message: string = 'Success'): void {
    const response: ApiResponse<PaginatedResponse<T>> = {
      success: true,
      message,
      data,
    };
    res.status(200).json(response);
  }
}
