import { z } from 'zod';
import { API_LIMITS } from '../utils/api.constants.js';

const email = z.email().trim().toLowerCase().max(254);
const password = z.string().min(8).max(128);

export const registerSchema = z.object({ email, password }).strict();
export const loginSchema = z.object({ email, password }).strict();
export const refreshSchema = z.object({ refreshToken: z.string().min(32).max(256) }).strict();
export const forgotPasswordSchema = z.object({ email }).strict();
export const resetPasswordSchema = z
  .object({ token: z.string().min(32).max(256), password })
  .strict();
export const changePasswordSchema = z
  .object({ currentPassword: password, newPassword: password })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current password',
  });
export const logoutSchema = z
  .object({ refreshToken: z.string().min(32).max(256).optional() })
  .strict();

export const passwordLimits = {
  min: 8,
  max: 128,
  contentMax: API_LIMITS.contentCharacters,
};
