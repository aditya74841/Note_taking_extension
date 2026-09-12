import { randomUUID } from 'node:crypto';
import { logger } from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const requestId = req.header('x-request-id') || randomUUID();
  const startedAt = process.hrtime.bigint();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const log = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    if (res.statusCode >= 500) {
      logger.error(log, 'request completed with server error');
    } else if (res.statusCode >= 400) {
      logger.warn(log, 'request completed with client error');
    } else {
      logger.info(log, 'request completed');
    }
  });

  next();
}
