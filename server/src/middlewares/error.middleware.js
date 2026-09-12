import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

function getMongooseValidationErrors(error) {
  return Object.values(error.errors || {}).map((fieldError) => ({
    field: fieldError.path,
    message: fieldError.message,
  }));
}

function normalizeError(error) {
  if (error instanceof ApiError) return error;

  if (error?.type === 'entity.too.large') {
    return new ApiError(413, 'Request body is too large');
  }

  if (error?.type === 'entity.parse.failed') {
    return new ApiError(400, 'Request body contains invalid JSON');
  }

  if (error?.message === 'Origin is not allowed by CORS') {
    return new ApiError(403, 'Request origin is not allowed');
  }

  if (error?.name === 'ValidationError') {
    return new ApiError(400, 'Request validation failed', getMongooseValidationErrors(error));
  }

  if (error?.code === 11000) {
    return new ApiError(409, 'A resource with the same unique value already exists');
  }

  if (error?.name === 'CastError') {
    return new ApiError(400, 'Request contains an invalid value');
  }

  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
    return new ApiError(401, 'Invalid or expired access token');
  }

  return new ApiError(500, 'Internal Server Error', [], error?.stack);
}

const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, _next) => {
  void _next;
  const error = normalizeError(err);

  logger.error(
    {
      requestId: req.requestId,
      statusCode: error.statusCode,
      errorType: err?.name || 'Error',
      message: error.statusCode >= 500 ? err?.message : error.message,
    },
    'request failed',
  );

  const response = {
    statusCode: error.statusCode,
    message: error.message,
    success: false,
    errors: error.errors,
    ...(config.nodeEnv === 'development' ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};

export { errorHandler, notFoundHandler, normalizeError };
