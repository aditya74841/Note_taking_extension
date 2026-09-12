import { API_LIMITS, PAGINATION_SORT_FIELDS } from './api.constants.js';

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export function parsePaginationQuery(query = {}) {
  const page = parsePositiveInteger(query.page, 1);
  const limit = parsePositiveInteger(
    query.limit,
    API_LIMITS.pageSizeDefault,
    API_LIMITS.pageSizeMax,
  );
  const sortBy = PAGINATION_SORT_FIELDS[query.sortBy] || PAGINATION_SORT_FIELDS.updatedAt;
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
  };
}

export function createPaginationMeta({ page, limit, total }) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}
