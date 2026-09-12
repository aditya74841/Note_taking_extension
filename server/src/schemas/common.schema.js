import mongoose from 'mongoose';
import { z } from 'zod';
import { API_LIMITS, PAGINATION_SORT_FIELDS } from '../utils/api.constants.js';

export const trimmedString = (maximum, minimum = 1) => z.string().trim().min(minimum).max(maximum);

export const urlSchema = z.string().trim().max(API_LIMITS.urlCharacters).url();

export const domainSchema = z
  .string()
  .trim()
  .min(1)
  .max(API_LIMITS.domainCharacters)
  .refine((value) => {
    try {
      const parsed = new URL(`https://${value}`);
      return parsed.hostname === value && value.includes('.') && !value.includes(' ');
    } catch {
      return false;
    }
  }, 'Must be a valid domain');

export const objectIdSchema = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Must be a valid ID');

const positiveIntegerQuery = (fallback, maximum) =>
  z.preprocess(
    (value) => (value === undefined || value === '' ? fallback : Number(value)),
    z.number().int().min(1).max(maximum),
  );

export const paginationQuerySchema = z
  .object({
    page: positiveIntegerQuery(1, Number.MAX_SAFE_INTEGER),
    limit: positiveIntegerQuery(API_LIMITS.pageSizeDefault, API_LIMITS.pageSizeMax),
    sortBy: z.enum(Object.keys(PAGINATION_SORT_FIELDS)).default(PAGINATION_SORT_FIELDS.updatedAt),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

export const strictObject = (shape) => z.object(shape).strict();
