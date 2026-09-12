import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function generateOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function parseDurationMs(value) {
  const match = /^([0-9]+)([smhd])$/.exec(value);
  if (!match) throw new Error(`Unsupported duration: ${value}`);

  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * multipliers[match[2]];
}

export function createAccessToken(user) {
  return jwt.sign({ _id: user._id.toString(), email: user.email }, config.accessTokenSecret, {
    expiresIn: config.accessTokenExpiry,
  });
}

export function createRefreshTokenSessionData(userId, metadata = {}, familyId = randomUUID()) {
  const refreshToken = generateOpaqueToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationMs(config.refreshTokenExpiry));

  return {
    refreshToken,
    session: {
      userId,
      familyId,
      tokenHash,
      expiresAt,
      userAgent: metadata.userAgent || '',
      ipAddress: metadata.ipAddress || '',
    },
  };
}

export function safeUser(user) {
  return { id: user._id.toString(), email: user.email };
}
