import pino from 'pino';
import { config } from '../config/env.js';

const isDevelopment = config.nodeEnv === 'development';

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  redact: {
    paths: [
      'authorization',
      'req.headers.authorization',
      'headers.authorization',
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'content',
      'body.content',
      'req.body',
    ],
    censor: '[REDACTED]',
  },
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            singleLine: true,
          },
        },
      }
    : {}),
});
