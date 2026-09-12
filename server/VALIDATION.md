# Request Validation

The backend uses [Zod](https://zod.dev/) for request validation.

## Middleware

Use the reusable middleware in `src/middlewares/validation.middleware.js`:

```js
router.post('/example', validateBody(exampleSchema), controller);
router.get('/example', validateQuery(paginationQuerySchema), controller);
router.get('/example/:id', validateParams(idSchema), controller);
```

Validated body data is written back to `req.body`. Query and parameter data are placed in `req.validatedQuery` and `req.validatedParams` because Express treats `req.query` and `req.params` as framework-managed values.

## Validation errors

Invalid requests use the standard error response:

```json
{
  "statusCode": 400,
  "message": "Request validation failed",
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address",
      "code": "invalid_format"
    }
  ]
}
```

## Reusable validators

`src/schemas/common.schema.js` provides:

- Trimmed bounded strings.
- HTTP URL validation.
- Domain validation.
- MongoDB ObjectId validation.
- Pagination query validation.
- Strict object creation for rejecting unknown fields.

Schemas should use `.strict()` or `strictObject()` for endpoint payloads where unexpected fields must be rejected. Do not silently trust or pass through unvalidated client fields.

## Limits

Shared limits come from `src/utils/api.constants.js`, including request body, title, content, URL, domain, and pagination limits. Feature schemas should reuse those constants instead of defining larger untracked limits.

Authentication-specific schemas will be added during the Auth phase.
