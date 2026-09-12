import rateLimit from 'express-rate-limit';

const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: 'Too many authentication requests. Please try again later.',
    success: false,
    errors: [],
  },
};

export const registerRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

export const loginRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

export const tokenRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 30,
});

export const passwordResetRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});
