import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  loginRateLimit,
  passwordResetRateLimit,
  registerRateLimit,
  tokenRateLimit,
} from '../middlewares/auth-rate-limit.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema.js';

const router = Router();

router.post('/register', registerRateLimit, validateBody(registerSchema), registerUser);
router.post('/login', loginRateLimit, validateBody(loginSchema), loginUser);
router.post('/refresh', tokenRateLimit, validateBody(refreshSchema), refreshAccessToken);
router.post(
  '/forgot-password',
  passwordResetRateLimit,
  validateBody(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  '/reset-password',
  passwordResetRateLimit,
  validateBody(resetPasswordSchema),
  resetPassword,
);
router.post('/logout', validateBody(logoutSchema), logoutUser);
router.post('/change-password', verifyJWT, validateBody(changePasswordSchema), changePassword);
router.get('/me', verifyJWT, getCurrentUser);

export default router;
