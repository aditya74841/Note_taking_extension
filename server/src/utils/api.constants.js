export const API_VERSION_PREFIX = '/api/v1';

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
});

export const API_LIMITS = Object.freeze({
  requestBodyBytes: 16 * 1024,
  pageSizeDefault: 25,
  pageSizeMax: 100,
  titleCharacters: 200,
  contentCharacters: 100_000,
  urlCharacters: 2_048,
  domainCharacters: 253,
  urlKeyCharacters: 2_048,
});

export const DATE_FORMAT = 'unix-milliseconds';

export const PAGINATION_SORT_FIELDS = Object.freeze({
  updatedAt: 'updatedAt',
  createdAt: 'createdAt',
});
