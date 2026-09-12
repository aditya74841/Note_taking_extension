import { PasswordResetToken } from '../models/password-reset-token.model.js';
import { User } from '../models/user.model.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  issueTokenPair,
  revokeTokenFamily,
  revokeUserSessions,
  rotateRefreshToken,
} from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';
import { safeUser } from '../utils/auth.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/async-handler.js';
import { logger } from '../utils/logger.js';

function requestMetadata(req) {
  return {
    userAgent: req.get('user-agent') || '',
    ipAddress: req.ip || '',
  };
}

function tokenResponse(user, tokens, statusCode, message) {
  return new ApiResponse(statusCode, { user: safeUser(user), ...tokens }, message);
}

export const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, 'User with this email already exists');

  const user = await User.create({ email, password });
  const tokens = await issueTokenPair(user, requestMetadata(req));
  return res.status(201).json(tokenResponse(user, tokens, 201, 'Registration successful'));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const validPassword = user && (await user.isPasswordCorrect(password));
  if (!user || !validPassword) throw new ApiError(401, 'Invalid email or password');

  const tokens = await issueTokenPair(user, requestMetadata(req));
  return res.status(200).json(tokenResponse(user, tokens, 200, 'Login successful'));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const result = await rotateRefreshToken(req.body.refreshToken, requestMetadata(req));
  return res
    .status(200)
    .json(
      tokenResponse(
        result.user,
        { accessToken: result.accessToken, refreshToken: result.refreshToken },
        200,
        'Token refreshed successfully',
      ),
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  if (req.body.refreshToken) await revokeTokenFamily(req.body.refreshToken);
  else if (req.user?._id) await revokeUserSessions(req.user._id);
  return res.status(200).json(new ApiResponse(200, null, 'Logout successful'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const genericResponse = new ApiResponse(
    200,
    null,
    'If an account exists, password reset instructions will be sent',
  );
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(200).json(genericResponse);

  const token = await createPasswordResetToken(user._id);
  try {
    await sendPasswordResetEmail({ email: user.email, token });
  } catch (error) {
    await PasswordResetToken.deleteMany({ userId: user._id });
    logger.error(
      { event: 'auth.reset_email_failed', error: error.message },
      'Password reset email failed',
    );
  }

  return res.status(200).json(genericResponse);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const userId = await consumePasswordResetToken(req.body.token);
  const user = await User.findById(userId);
  if (!user) throw new ApiError(400, 'Invalid or expired password reset token');

  user.password = req.body.password;
  await user.save();
  await revokeUserSessions(user._id);
  return res.status(200).json(new ApiResponse(200, null, 'Password reset successful'));
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user || !(await user.isPasswordCorrect(req.body.currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = req.body.newPassword;
  await user.save();
  await revokeUserSessions(user._id);
  return res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});

export const getCurrentUser = asyncHandler(async (req, res) =>
  res
    .status(200)
    .json(
      new ApiResponse(200, { user: safeUser(req.user) }, 'Current user retrieved successfully'),
    ),
);
