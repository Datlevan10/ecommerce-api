import type { Response } from 'express';

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
  count?: number;
}

export const sendSuccess = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
) => {
  const response: ApiResponse = {
    success: true,
    message,
    data
  };

  if (Array.isArray(data)) {
    response.count = data.length;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  error: any = null
) => {
  const response: ApiResponse = {
    success: false,
    message,
    error
  };

  return res.status(statusCode).json(response);
};

export const sendValidationError = (
  res: Response,
  errors: any
) => {
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors
  });
};