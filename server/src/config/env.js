import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import packageJson from '../../package.json' with { type: 'json' };

dotenv.config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
});

const allowedEnvironments = new Set(['development', 'staging', 'production']);
const placeholderSecretPatterns = [
  'your_',
  'change_',
  'replace_',
  'example',
  'placeholder',
  'password',
];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name, fallback) {
  return process.env[name]?.trim() || fallback;
}

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return port;
}

function parseCorsOrigins(value, environment) {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error('CORS_ORIGIN must contain at least one origin');
  }

  if (environment !== 'development' && origins.includes('*')) {
    throw new Error('CORS_ORIGIN cannot use * outside development');
  }

  for (const origin of origins) {
    if (origin === '*') continue;

    let parsedOrigin;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error(`CORS_ORIGIN contains an invalid origin: ${origin}`);
    }

    const allowedProtocols = ['http:', 'https:', 'chrome-extension:'];
    if (!allowedProtocols.includes(parsedOrigin.protocol)) {
      throw new Error(`CORS_ORIGIN uses an unsupported protocol: ${origin}`);
    }

    const validPathname = parsedOrigin.pathname === '/' || parsedOrigin.pathname === '';
    if (!validPathname || parsedOrigin.search || parsedOrigin.hash) {
      throw new Error(`CORS_ORIGIN must contain origins only: ${origin}`);
    }
  }

  return origins;
}

function validateAccessTokenSecret(secret, environment) {
  const normalizedSecret = secret.toLowerCase();
  const isPlaceholder = placeholderSecretPatterns.some((pattern) =>
    normalizedSecret.includes(pattern),
  );

  if ((environment === 'staging' || environment === 'production') && secret.length < 32) {
    throw new Error('ACCESS_TOKEN_SECRET must be at least 32 characters outside development');
  }

  if ((environment === 'staging' || environment === 'production') && isPlaceholder) {
    throw new Error('ACCESS_TOKEN_SECRET must not contain a placeholder value');
  }
}

const nodeEnv = required('NODE_ENV');
if (!allowedEnvironments.has(nodeEnv)) {
  throw new Error('NODE_ENV must be development, staging, or production');
}

const accessTokenSecret = required('ACCESS_TOKEN_SECRET');
validateAccessTokenSecret(accessTokenSecret, nodeEnv);

const refreshTokenExpiry = optional('REFRESH_TOKEN_EXPIRY', '30d');
const passwordResetTokenExpiryMinutes = Number(
  optional('PASSWORD_RESET_TOKEN_EXPIRY_MINUTES', '15'),
);
if (!Number.isInteger(passwordResetTokenExpiryMinutes) || passwordResetTokenExpiryMinutes < 5) {
  throw new Error('PASSWORD_RESET_TOKEN_EXPIRY_MINUTES must be an integer of at least 5');
}

export const config = Object.freeze({
  appVersion: packageJson.version,
  host: process.env.HOST?.trim() || '0.0.0.0',
  nodeEnv,
  port: parsePort(required('PORT')),
  mongodbUri: required('MONGODB_URI'),
  corsOrigins: parseCorsOrigins(required('CORS_ORIGIN'), nodeEnv),
  accessTokenSecret,
  accessTokenExpiry: optional('ACCESS_TOKEN_EXPIRY', '15m'),
  refreshTokenExpiry,
  passwordResetTokenExpiryMinutes,
  authResetUrl: optional('AUTH_RESET_URL', 'http://localhost:3000/reset-password'),
  mailFrom: optional('MAIL_FROM', 'no-reply@localhost'),
  resendApiKey: optional('RESEND_API_KEY', ''),
});
