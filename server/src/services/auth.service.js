import { randomUUID } from 'node:crypto';
import { PasswordResetToken } from '../models/password-reset-token.model.js';
import { RefreshSession } from '../models/refresh-session.model.js';
import { User } from '../models/user.model.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createAccessToken,
  createRefreshTokenSessionData,
  generateOpaqueToken,
  hashToken,
} from '../utils/auth.js';

export async function issueTokenPair(user, metadata = {}, familyId = randomUUID()) {
  const { refreshToken, session } = createRefreshTokenSessionData(user._id, metadata, familyId);
  await RefreshSession.create(session);

  return {
    accessToken: createAccessToken(user),
    refreshToken,
  };
}

export async function rotateRefreshToken(refreshToken, metadata = {}) {
  const tokenHash = hashToken(refreshToken);
  const existing = await RefreshSession.findOne({ tokenHash });

  if (!existing) throw new ApiError(401, 'Invalid or expired refresh token');

  if (existing.revokedAt) {
    await RefreshSession.updateMany(
      { familyId: existing.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    throw new ApiError(401, 'Refresh token reuse detected');
  }

  if (existing.expiresAt <= new Date()) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const revoked = await RefreshSession.findOneAndUpdate(
    { _id: existing._id, revokedAt: null },
    { $set: { revokedAt: new Date(), lastUsedAt: new Date() } },
    { new: true },
  );
  if (!revoked) throw new ApiError(401, 'Refresh token reuse detected');

  const user = await User.findById(existing.userId);
  if (!user) throw new ApiError(401, 'Invalid or expired refresh token');

  const pair = await issueTokenPair(user, metadata, existing.familyId);
  await RefreshSession.updateOne(
    { _id: existing._id },
    { $set: { replacedByTokenHash: hashToken(pair.refreshToken) } },
  );

  return { user, ...pair };
}

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  await RefreshSession.updateOne(
    { tokenHash: hashToken(refreshToken), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function revokeUserSessions(userId) {
  await RefreshSession.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function revokeTokenFamily(refreshToken) {
  if (!refreshToken) return;
  const session = await RefreshSession.findOne({ tokenHash: hashToken(refreshToken) });
  if (session) {
    await RefreshSession.updateMany(
      { familyId: session.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }
}

export async function createPasswordResetToken(userId) {
  await PasswordResetToken.deleteMany({ userId, usedAt: null });
  const token = generateOpaqueToken();
  await PasswordResetToken.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + config.passwordResetTokenExpiryMinutes * 60_000),
  });
  return token;
}

export async function consumePasswordResetToken(token) {
  const resetToken = await PasswordResetToken.findOne({
    tokenHash: hashToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!resetToken) throw new ApiError(400, 'Invalid or expired password reset token');

  const consumed = await PasswordResetToken.findOneAndUpdate(
    { _id: resetToken._id, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  );
  if (!consumed) throw new ApiError(400, 'Invalid or expired password reset token');

  return consumed.userId;
}
