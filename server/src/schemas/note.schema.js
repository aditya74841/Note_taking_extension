import { z } from 'zod';
import { API_LIMITS } from '../utils/api.constants.js';
import { trimmedString, domainSchema, urlSchema } from './common.schema.js';

// ── Reusable field schemas ──────────────────────────────────────────────

const urlKeyField = trimmedString(API_LIMITS.urlKeyCharacters);
const titleField = z.string().trim().max(API_LIMITS.titleCharacters).default('');
const contentField = z.string().max(API_LIMITS.contentCharacters).default('');
const colorField = z
  .enum(['default', 'red', 'yellow', 'green', 'purple', 'blue'])
  .default('default');
const updatedAtField = z.number().int().positive();

// ── POST /backup ────────────────────────────────────────────────────────

export const backupNoteSchema = z
  .object({
    urlKey: urlKeyField,
    domain: domainSchema,
    fullUrl: urlSchema,
    title: titleField,
    content: contentField,
    color: colorField,
    updatedAt: updatedAtField.optional(),
    isDeleted: z.boolean().optional(),
  })
  .strict();

// ── POST /pin ───────────────────────────────────────────────────────────

export const backupPinSchema = z
  .object({
    domain: domainSchema,
    urlKey: urlKeyField.optional(),
    title: titleField.optional(),
    fullUrl: urlSchema.optional(),
    isUnpin: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => {
      // When pinning (not unpinning), urlKey and fullUrl are required
      if (!data.isUnpin) {
        return data.urlKey && data.fullUrl;
      }
      return true;
    },
    { message: 'urlKey and fullUrl are required when pinning', path: ['urlKey'] },
  );

// ── POST /restore-deleted, POST /purge ──────────────────────────────────

export const urlKeyBodySchema = z
  .object({
    urlKey: urlKeyField,
  })
  .strict();

// ── GET /backup-explorer ────────────────────────────────────────────────

const positiveIntegerQuery = (fallback, maximum) =>
  z.preprocess(
    (value) => (value === undefined || value === '' ? fallback : Number(value)),
    z.number().int().min(1).max(maximum),
  );

export const explorerQuerySchema = z
  .object({
    page: positiveIntegerQuery(1, Number.MAX_SAFE_INTEGER),
    limit: positiveIntegerQuery(API_LIMITS.pageSizeDefault, API_LIMITS.pageSizeMax),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    domain: z.string().trim().max(API_LIMITS.domainCharacters).optional(),
  })
  .strict();

// ── GET /restore ────────────────────────────────────────────────────────

export const restoreQuerySchema = z
  .object({
    page: positiveIntegerQuery(1, Number.MAX_SAFE_INTEGER),
    limit: positiveIntegerQuery(API_LIMITS.pageSizeDefault, API_LIMITS.pageSizeMax),
  })
  .strict();
