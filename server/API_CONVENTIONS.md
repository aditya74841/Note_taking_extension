# API Conventions

This document defines the API contract that future backend endpoints must follow.

## Versioning

All public endpoints use the `/api/v1` prefix:

```text
/api/v1/auth/login
/api/v1/notes/backup
/api/v1/health
```

Breaking changes require a new version prefix such as `/api/v2`. Existing clients should continue to work against their original version.

## Success response

Successful responses use the `ApiResponse` envelope:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "success": true,
  "meta": null
}
```

`meta` is reserved for pagination and other non-resource metadata. It is `null` for ordinary responses.

## Error response

Failed responses use the `ApiError` envelope:

```json
{
  "statusCode": 400,
  "message": "Request validation failed",
  "success": false,
  "errors": []
}
```

Production responses must not include stack traces, database details, tokens, passwords, or private note content.

## HTTP status codes

- `200 OK`: successful read, update, delete, or action.
- `201 Created`: resource created.
- `400 Bad Request`: malformed or invalid input.
- `401 Unauthorized`: missing, invalid, or expired authentication.
- `403 Forbidden`: authenticated or identified caller is not allowed.
- `404 Not Found`: route or resource does not exist.
- `409 Conflict`: unique value or state conflict.
- `413 Payload Too Large`: request exceeds the body limit.
- `500 Internal Server Error`: unexpected server failure.

## Naming and timestamps

- JSON fields use `camelCase`.
- MongoDB identifiers are exposed as `id` or `_id` consistently per existing resource contract; new endpoints should prefer `id` when a transformation layer is introduced.
- Stored field names use `camelCase`.
- Client-provided sync timestamps use Unix milliseconds in `updatedAt`.
- Mongoose audit timestamps use `createdAt` and `updatedAt` dates where enabled.
- New public date fields should use ISO 8601 strings unless they are explicitly part of the sync contract.

## Limits

The current shared limits are defined in `src/utils/api.constants.js`:

- Request body: 16 KB.
- Default page size: 25.
- Maximum page size: 100.
- Title: 200 characters.
- Note content: 100,000 characters.
- URL: 2,048 characters.
- Domain: 253 characters.
- URL key: 2,048 characters.

Feature-specific validation must not silently exceed these baseline limits.

## Pagination and sorting

Future collection endpoints should accept:

```text
?page=1&limit=25&sortBy=updatedAt&sortOrder=desc
```

Rules:

- Pages start at `1`.
- Default limit is `25`.
- Maximum limit is `100`.
- Supported sort fields are allowlisted.
- Supported sort directions are `asc` and `desc`.
- Unknown sort fields fall back to `updatedAt`.
- Invalid or missing numeric values use safe defaults.

Paginated responses should use:

```json
{
  "statusCode": 200,
  "data": [],
  "message": "Resources retrieved successfully",
  "success": true,
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 120,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Reusable parsing and metadata helpers are available in `src/utils/pagination.js`.
