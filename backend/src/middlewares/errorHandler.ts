import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${statusCode} - ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
