# URL Notes Backend Journey

## Purpose

This document records how the URL Notes backend is being built, one decision and implementation step at a time.

The goal is not only to track completed code. It is also to preserve:

- What we planned.
- Why we chose each approach.
- What questions came up.
- How each question was answered.
- What was implemented.
- How the implementation was verified.
- What we learned for the next step.

This gives us a technical history that can later become project documentation, educational content, onboarding material, or a series of development lessons.

## Product context

The backend is the cloud service for the URL Notes browser extension. It provides:

- User accounts and authentication.
- Cloud backup for notes.
- Domain-pin backup.
- Note restore.
- Soft-deleted note recovery.
- Permanent note purge.
- Cloud backup exploration.

The backend uses:

- Node.js.
- Express.
- MongoDB.
- Mongoose.
- JWT.
- bcryptjs.

The backend is being developed in stages. We first make the system foundation safe and dependable, then build authentication, authorization, synchronization reliability, and product features on top of it.

# Development strategy

The implementation order is:

```text
Foundation
    |
    v
Authentication
    |
    v
Authorization and tenant isolation
    |
    v
Notes and pins reliability
    |
    v
Cloud sync improvements
    |
    v
Dashboard and product features
```

We do not want to add new features on top of an unstable base. Each phase should leave the backend easier to test, operate, and extend.

# Phase plan

## Phase 0: Backend foundation

The foundation makes the backend stable, secure, testable, observable, and deployable.

Planned foundation areas:

1. Project and environment setup.
2. Application bootstrap.
3. Database connection hardening.
4. Error handling foundation.
5. Security middleware baseline.
6. API request and response conventions.
7. Generic request validation infrastructure.
8. Logging foundation.
9. Health and readiness endpoints.
10. Graceful shutdown.
11. Dependency and package setup.
12. Testing foundation.
13. Deployment baseline.

Foundation completion rule:

> We should not begin the Auth phase until the server can start safely, reject unsafe configuration, return consistent errors, report health, shut down cleanly, and run a basic automated test suite.

## Phase 1: Authentication

After the foundation is complete, implement and harden user authentication:

- Registration.
- Login.
- Password validation.
- Password hashing.
- JWT access tokens.
- Refresh-token strategy if needed.
- Generic authentication error responses.
- Authentication rate limiting.
- Current-user endpoint.
- Logout and token invalidation strategy.

## Phase 2: Authorization and tenant isolation

Ensure every user can access only their own data:

- User-scoped note queries.
- User-scoped domain-pin queries.
- Authorization middleware.
- Cross-user access tests.
- Ownership rules for restore and purge.
- Secure response projections.

## Phase 3: Notes and pins reliability

Make note and domain-pin behavior correct and durable:

- Note validation.
- Domain-pin validation.
- Soft-delete behavior.
- Restore behavior.
- Permanent purge behavior.
- Duplicate-key handling.
- Database indexes.
- Consistent timestamps.
- Rich-content safety rules.

## Phase 4: Cloud synchronization

Make multi-device synchronization reliable:

- Server-controlled update versions.
- Stale update protection.
- Conflict policy.
- Pagination.
- Restore limits.
- Large-account handling.
- Sync retry behavior.
- Cloud restore consistency.

## Phase 5: Dashboard and product features

After the platform behavior is reliable, continue with user-facing improvements:

- Cloud explorer improvements.
- Dashboard filtering.
- Better trash management.
- Export and import improvements.
- Account settings.
- Usage metrics.
- Operational administration features.

# Journey log

## Entry 0: Initial backend audit

### Question

How much work is needed to make the server production-ready?

### Answer

The backend is a functional MVP rather than a production-ready service. The architecture is usable and does not require a rewrite, but it needs a focused hardening pass.

The main gaps identified were:

- Unsafe configuration defaults.
- Wildcard CORS.
- Missing request validation.
- No rate limiting.
- Long-lived JWT access tokens.
- No refresh-token or revocation strategy.
- No security headers.
- No server-side rich HTML safety policy.
- No sync conflict protection.
- Unbounded restore responses.
- Weak operational health checks.
- No graceful shutdown.
- No structured logging.
- No automated backend test suite.
- No documented deployment and recovery process.

### Decision

Work should be split into phases. The foundation comes first, followed by authentication and then feature-specific work.

### Result

Created the following planning documents:

- `docs/backend/PRODUCTION_READINESS_PLAN.md`
- `docs/backend/FOUNDATION_WORK_PLAN.md`

### Lesson

Before adding features, identify the platform capabilities that every feature will depend on. Configuration, errors, logs, tests, and lifecycle behavior should not be rebuilt separately for every endpoint.

## Entry 1: Define the foundation work

### Question

What must be completed before authentication or any new feature work begins?

### Answer

The foundation must cover more than just database connectivity. It must establish:

- Safe configuration.
- Predictable startup.
- Database behavior.
- Security middleware.
- Error conventions.
- Validation infrastructure.
- Logging.
- Health checks.
- Graceful shutdown.
- Testing.
- Deployment expectations.

### Decision

Create a dedicated foundation checklist and keep authentication-specific rules for the Auth phase. The foundation can provide reusable validation infrastructure without implementing registration or login yet.

### Result

Created `docs/backend/FOUNDATION_WORK_PLAN.md` with:

- Thirteen foundation work areas.
- Recommended completion order.
- Definition-of-done criteria.
- A clear boundary between foundation and later features.

### Lesson

A good foundation plan prevents scope from expanding randomly. It also makes it clear when the project is ready to move from infrastructure work to product behavior.

## Entry 2: Project and environment setup

### Question

Why should environment configuration be centralized in `env.js` instead of reading `process.env` throughout the codebase?

### Answer

A central configuration module gives the application one controlled place to:

- Load `.env` during local development.
- Check that required values exist.
- Validate types and allowed values.
- Reject unsafe production settings.
- Normalize configuration into a predictable object.

Without this, each file may interpret environment variables differently. A missing value could silently become `undefined`, an invalid port could be accepted, or a production server could start with a placeholder JWT secret.

### Question

Why do we use `.env.example` instead of using it directly?

### Answer

`.env.example` is a safe template that documents which variables are required. It is not the real configuration and is not loaded by the server.

The local workflow is:

```text
.env.example
    |
    | copy and customize
    v
.env
    |
    | loaded by env.js
    v
process.env
    |
    | validated and normalized
    v
config object
```

The real `.env` contains private values such as database credentials and the JWT signing secret. It is ignored by Git and should never be committed.

In staging and production, values should normally be injected by the deployment platform or a secret manager rather than stored in a repository file.

### Question

What should happen when configuration is invalid?

### Answer

The server should fail immediately before opening a database connection or listening for traffic. A fast startup failure is safer than a server that appears online but cannot operate correctly or is insecure.

### Decision

Create `server/src/config/env.js` as the single configuration boundary.

The module should:

- Load `server/.env` for local development.
- Require `MONGODB_URI`.
- Require `PORT`.
- Require `NODE_ENV`.
- Allow only `development`, `staging`, or `production`.
- Require `CORS_ORIGIN`.
- Parse comma-separated CORS origins.
- Reject wildcard CORS outside development.
- Require `ACCESS_TOKEN_SECRET`.
- Reject placeholder JWT secrets in staging and production.
- Require a JWT secret of at least 32 characters outside development.
- Require `ACCESS_TOKEN_EXPIRY`.
- Export a frozen `config` object.

### Implementation

Created:

- `server/src/config/env.js`

Updated:

- `server/server.js`
- `server/.env.example`
- `docs/backend/FOUNDATION_WORK_PLAN.md`

### Configuration behavior

Development configuration currently supports the local server values from `server/.env`:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/url_notes_db
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=urlnotes_super_secret_jwt_key_2026_dev
ACCESS_TOKEN_EXPIRY=30d
NODE_ENV=development
```

The example file now documents safer setup values:

```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/url_notes_db?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=generate-a-random-secret-of-at-least-32-characters
ACCESS_TOKEN_EXPIRY=30d
NODE_ENV=development
```

The example secret is intentionally instructional. It must be replaced with a real random value before use outside development.

### Verification

The following checks passed:

- `node --check src/config/env.js`
- `node --check server.js`
- Development configuration imported successfully.
- Parsed development port is `8000`.
- Parsed development environment is `development`.
- Development wildcard CORS is accepted.
- `server/.env` is ignored by Git.
- Editor diagnostics reported no errors for the changed JavaScript files.

The production safety check also behaved correctly:

```text
ACCESS_TOKEN_SECRET must not contain a placeholder value
```

That failure is expected. It proves the module refuses a placeholder secret in production instead of starting unsafely.

### Lesson

Configuration validation is an executable contract. It turns deployment assumptions into startup checks and moves failures to the earliest useful moment.

# Next journey entries

## Entry 3: Application bootstrap

### Question

How should the backend start so that configuration errors and database failures happen before the server accepts traffic?

### Context

The original setup created the Express app during module import and used `process.env` directly in the app and database layers. The server did wait for the database promise before calling `listen()`, but startup responsibilities were spread across multiple files. The database connector also handled process termination internally, making startup behavior harder to control and test.

### Decision

Separate application creation from server startup:

- `app.js` creates and configures the Express application.
- `server.js` owns the startup sequence.
- `env.js` validates configuration before either layer can use it.
- `db.js` connects to MongoDB and propagates failures to `server.js`.

This gives us a reusable app factory for tests and a single place responsible for starting the live server.

### Implementation

Created and updated:

- Added `createApp()` in `server/src/app.js`.
- Added `startServer()` in `server/server.js`.
- Updated `server/src/config/db.js` to use validated `config.mongodbUri`.
- Removed process termination from the database connector.
- Added concise `[startup]` log messages.
- Configured CORS through the validated configuration object.
- Marked Application Bootstrap complete in `docs/backend/FOUNDATION_WORK_PLAN.md`.

The new startup flow is:

```text
Load env.js
    |
    v
Validate configuration
    |
    v
Connect to MongoDB
    |
    v
Create Express app
    |
    v
Start HTTP server
```

If configuration is invalid, the process fails before connecting to MongoDB. If MongoDB fails, the error reaches the startup handler and the server does not begin listening.

### Verification

The following checks passed:

- `node --check src/app.js`
- `node --check src/config/db.js`
- `node --check server.js`
- Imported `createApp()` successfully.
- Confirmed the app factory returns an Express application with a `listen()` method.
- Editor diagnostics reported no errors in the changed files.

The app factory can now be loaded without starting a network listener, which will support the testing foundation later.

### Result

The backend now has a clear bootstrap boundary. Express app construction is reusable, configuration is validated before startup, MongoDB must connect before listening, and startup failures are reported by one owner.

### Lesson

Application creation and process startup are different responsibilities. Separating them makes the server easier to test, makes failures easier to understand, and prevents partially initialized services from accepting requests.

## Entry 4: Database foundation

### Question

How should the backend connect to MongoDB reliably and confirm that the database is safe to use before the server accepts traffic?

### Context

The original database connector used `process.env.MONGODB_URI` directly and called `process.exit()` inside the database layer when a connection failed. It had no explicit connection timeouts, lifecycle logging, readiness helper, production database guard, or startup index verification.

### Decision

Make the database layer responsible for connection behavior, readiness state, index verification, and clean disconnection, while leaving application startup decisions to `server.js`.

The database connection should:

- Fail within a predictable time when MongoDB is unavailable.
- Log connected, disconnected, and reconnected states.
- Verify required model indexes before startup succeeds.
- Allow local MongoDB during development.
- Reject local MongoDB hosts in production.
- Propagate failures instead of terminating the process internally.

### Implementation

Updated `server/src/config/db.js` to add:

- `serverSelectionTimeoutMS: 5000`.
- `connectTimeoutMS: 10000`.
- `socketTimeoutMS: 45000`.
- Development and production connection-pool settings.
- MongoDB connected, disconnected, and reconnected logs.
- `isDatabaseReady()` for future readiness checks.
- `disconnectDB()` for future graceful shutdown.
- Production protection against `localhost`, `127.0.0.1`, and `::1` MongoDB hosts.
- Model initialization and required index verification.

The required unique indexes are:

```text
Note: userId + urlKey
DomainPin: userId + domain
```

These indexes ensure that one user cannot create duplicate notes for the same URL key or duplicate pins for the same domain, while different users can still use the same websites.

The new database flow is:

```text
Validate configuration
    |
    v
Check production MongoDB rules
    |
    v
Connect with timeouts
    |
    v
Initialize model indexes
    |
    v
Verify required unique indexes
    |
    v
Allow server startup
```

### Verification

The following checks passed:

- Database module syntax check.
- Editor diagnostics reported no errors in `server/src/config/db.js`.
- Readiness starts as `false` before a connection exists.
- Local MongoDB connected successfully.
- Required indexes were verified successfully.
- An unreachable MongoDB URI returned a controlled `MongoDB connection failed` error.
- The unreachable connection emitted a disconnection log.

Successful local connection output included:

```text
[startup] MongoDB connected: localhost
[startup] MongoDB indexes verified
```

The unavailable database check returned:

```text
[database] MongoDB disconnected
database failure handled
```

### Result

MongoDB is now treated as a startup dependency rather than an unbounded background assumption. The server will not continue startup when the database cannot connect or when required uniqueness indexes are missing.

### Lesson

Database reliability is more than successfully opening a connection. A production service must define timeouts, observe connection state, verify its data guarantees, protect production configuration, and close the connection cleanly.

## Entry 5: Error handling foundation

### Question

How can every failure return a predictable, safe response to the extension without exposing internal implementation details?

### Context

The original error handler passed through arbitrary error messages and only handled errors that already contained a status code. Unknown routes had no dedicated response, parser errors were not normalized, CORS failures appeared as generic server errors, and database errors could expose internal details. Production responses also needed to hide stack traces while development still benefited from debugging information.

### Decision

Create one error-normalization boundary that maps known error types to safe HTTP responses and uses a generic `500 Internal Server Error` response for unexpected failures.

The API keeps the existing response contract:

```json
{
    "statusCode": 404,
    "message": "Route not found",
    "success": false,
    "errors": []
}
```

Known failures use these statuses:

| Failure | Status |
| --- | ---: |
| Unknown route | `404` |
| Invalid JSON | `400` |
| Oversized request | `413` |
| Blocked CORS origin | `403` |
| Mongoose validation error | `400` |
| Duplicate database value | `409` |
| Invalid database value | `400` |
| Invalid or expired JWT | `401` |
| Unexpected server failure | `500` |

Production responses must not expose stack traces, MongoDB messages, or other internal details. Development responses may include a stack trace to support local debugging.

### Implementation

Updated `server/src/middlewares/error.middleware.js` to add:

- `normalizeError()` for known error mappings.
- Parser error handling for invalid JSON.
- Payload-limit handling for oversized requests.
- CORS error handling.
- Mongoose validation error details limited to field and message.
- Duplicate-key handling.
- Mongoose cast-error handling.
- JWT error handling.
- Safe generic fallback for unknown errors.
- Environment-aware stack-trace output.

Updated `server/src/app.js` to add `notFoundHandler` before the global error handler, ensuring unknown routes use the same response contract.

### Verification

Production endpoint checks passed:

```json
{
    "unknown": 404,
    "malformed": 400,
    "oversized": 413,
    "blocked": 403
}
```

Every response:

- Returned `success: false`.
- Used the expected HTTP status.
- Omitted the stack trace in production mode.
- Did not expose internal database details.

Syntax checks and editor diagnostics also passed for the changed middleware and application files.

### Result

The backend now has a single, predictable error boundary. The extension can respond to errors based on stable status codes and messages, while production users do not receive sensitive server internals.

### Lesson

Error handling is part of the API contract. A server is not reliable only because successful requests work; clients also need failures to be consistent, meaningful, and safe.

## Entry 6: Security middleware baseline

### Question

How can the Express application establish a safe HTTP boundary before authentication and product features are added?

### Context

The application previously had basic CORS and body parsing, but it did not have Helmet, an explicit proxy policy, documented HTTPS requirements, or a clearly documented decision about cross-origin credentials. CORS failures were also passed to the error handler without a normalized client error response; that status belongs to the upcoming Error Handling step.

### Decision

Use a secure baseline that matches the current extension authentication design:

- Use Helmet for standard security headers.
- Allow only configured CORS origins outside development.
- Permit wildcard CORS only in local development.
- Disable cross-origin credentials because the API uses Bearer tokens, not cookies.
- Keep JSON and URL-encoded request bodies limited to 16 KB.
- Trust proxy headers only in staging and production behind a controlled reverse proxy.
- Require HTTPS for public staging and production deployments.

### Implementation

Added the `helmet` dependency and updated `server/src/app.js` to:

- Add `helmet()` middleware.
- Disable the `X-Powered-By` response header.
- Configure `trust proxy` from the validated environment.
- Enforce the configured CORS origin allowlist.
- Set `credentials: false` for the Bearer-token API.
- Keep JSON body limits at 16 KB.
- Keep URL-encoded body limits at 16 KB.

Added `server/SECURITY.md` to document:

- HTTPS requirements.
- Trusted reverse-proxy requirements.
- CORS configuration rules.
- Bearer-token and credentials behavior.
- Request-size limits.

The middleware boundary now behaves as follows:

```text
Incoming request
    |
    v
Helmet security headers
    |
    v
CORS origin check
    |
    v
Request body size limit
    |
    v
Application routes
```

### Verification

The HTTP middleware check passed with staging-style configuration:

```json
{
  "helmet": true,
  "allowedCors": "https://allowed.example",
  "deniedStatus": 500,
  "oversizedStatus": 413,
  "trustProxy": true
}
```

This confirmed that:

- Helmet adds the Content-Security-Policy header.
- An allowlisted origin receives the CORS response header.
- A blocked origin is rejected.
- Oversized JSON requests receive HTTP 413.
- Staging trusts the configured reverse proxy.

The blocked-origin request now returns HTTP 403 through the normalized error boundary documented in Entry 5, Error Handling Foundation.

### Result

The Express application now has a security middleware baseline before requests reach feature routes. Public deployments have explicit HTTPS, CORS, proxy, and request-size requirements instead of relying on implicit defaults.

### Lesson

Security middleware is a boundary, not a replacement for authentication. It reduces common HTTP exposure and makes deployment assumptions explicit, while later authentication and validation work will protect identity and request content.

## Learning note: How the extension calls the backend

### The two URLs involved

The extension and the backend have different origins.

The extension has a browser-provided origin:

```text
chrome-extension://<extension-id>
```

The backend has an API URL:

```text
http://localhost:8000/api/v1
```

The extension origin identifies who is making the request. The API URL identifies where the request is sent.

### Request flow

The extension stores or uses the configured server URL from `lib/sync.ts` and calls endpoints such as:

```text
POST http://localhost:8000/api/v1/auth/login
POST http://localhost:8000/api/v1/notes/backup
GET  http://localhost:8000/api/v1/notes/restore
```

After login, the server returns a JWT. The extension stores it in browser storage and sends it on protected requests:

```http
Authorization: Bearer <jwt-token>
```

The backend verifies that token before allowing note and pin operations.

### Why the extension URL belongs in CORS

`CORS_ORIGIN` describes which client origins the server trusts. It should contain the extension origin, not the API URL.

Correct concept:

```env
CORS_ORIGIN=chrome-extension://<extension-id>
```

Incorrect concept:

```env
CORS_ORIGIN=http://localhost:8000/api/v1
```

The request destination is the backend URL. The request caller is the extension origin.

The server checks the request's `Origin` header:

```text
Origin: chrome-extension://<extension-id>
```

It then compares that value with the configured CORS allowlist.

### Development and production IDs

An unpacked development extension and a published extension may have different IDs, so their origins can differ:

```env
# Development
CORS_ORIGIN=chrome-extension://development-extension-id

# Production
CORS_ORIGIN=chrome-extension://published-extension-id
```

Wildcard CORS can be useful for local development, but it should not be used for public deployments.

### CORS and extension host permissions are different

The browser and the server each apply a separate rule:

```text
Extension host_permissions
        = browser allows the extension to contact the API host

Server CORS_ORIGIN
        = backend allows the extension origin to use the response
```

The extension may need backend host permissions such as:

```ts
host_permissions: [
    'http://localhost:8000/*',
    'https://api.example.com/*',
]
```

The actual production API domain should replace the example domain.

### Main lesson

The API URL answers:

> Where is the request going?

The extension origin answers:

> Who is making the request?

`CORS_ORIGIN` controls which callers the backend trusts. The JWT controls which authenticated user is allowed to access data after the request reaches the backend. CORS and authentication solve different problems and both are needed.

## Entry 7: API conventions and validation infrastructure

### Question

How can future endpoints follow one predictable API contract instead of inventing different response, status, timestamp, and pagination formats?

### Context

The backend already had `ApiResponse`, `ApiError`, and the `/api/v1` route prefix, but the rules were implicit. The health endpoint also used a different response shape, and future list endpoints had no shared pagination or sorting behavior.

### Decision

Define the API contract centrally before adding more feature endpoints:

- Keep `/api/v1` as the current public API version.
- Use `ApiResponse` for successful responses.
- Use `ApiError` for failed responses.
- Keep HTTP status meanings consistent.
- Use `camelCase` for JSON and stored fields.
- Use Unix milliseconds for sync timestamps such as `updatedAt`.
- Use ISO 8601 strings for new public date fields unless they belong to the sync contract.
- Apply shared request and field limits.
- Use a standard page, limit, sort field, and sort direction format.

### Implementation

Added `server/src/utils/api.constants.js` with:

- `API_VERSION_PREFIX`.
- Shared HTTP status constants.
- Request body and field limits.
- Default and maximum page sizes.
- Supported pagination sort fields.
- Timestamp format declaration.

Added `server/src/utils/pagination.js` with:

- `parsePaginationQuery()`.
- Safe page and limit parsing.
- Maximum page-size clamping.
- Allowlisted sort fields.
- `asc` and `desc` sort direction handling.
- `createPaginationMeta()` for list response metadata.

Updated `server/src/utils/ApiResponse.js` so responses can include optional `meta` data:

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

Added `server/API_CONVENTIONS.md` as the reference contract for future endpoint work.

Updated `server/src/app.js` to use the shared `/api/v1` prefix and body-size constant. The health endpoint now also uses the standard `ApiResponse` envelope.

### Verification

The following checks passed:

- JavaScript syntax checks for the changed files.
- Editor diagnostics reported no errors.
- Pagination parsing clamped a requested limit of `999` to the maximum of `100`.
- Sorting accepted the allowlisted `updatedAt` field and `asc` direction.
- Pagination metadata calculated total pages and next/previous state correctly.
- The health endpoint returned the standard success envelope:

```json
{
    "statusCode": 200,
    "data": { "status": "OK" },
    "message": "Server is healthy & running!",
    "success": true,
    "meta": null
}
```

### Result

The backend now has a documented and reusable API contract. Existing endpoints retain their behavior while future collection endpoints have a standard pagination and sorting design ready to use.

### Lesson

API conventions are a form of long-term compatibility. Defining envelopes, statuses, limits, names, and pagination before adding features prevents clients from learning several different versions of the same backend.

## Entry 8: Logging foundation

### Question

How can we observe requests, failures, and database lifecycle events without exposing private data or adding unnecessary performance cost?

### Context

The backend previously used `console.log` and `console.error`. Those messages were inconsistent, had no request correlation ID, did not include request duration, and were not structured for production log collection. Sensitive values also needed an explicit redaction policy.

### Decision

Use Pino as the structured logger:

- Development uses readable `pino-pretty` output.
- Staging and production use JSON logs.
- Every request receives an `x-request-id`, preserving a valid incoming ID when supplied.
- Request logs contain only method, path, status, duration, and request ID.
- Authorization headers, passwords, tokens, request bodies, and note content are redacted.
- Database and startup logs use safe event fields rather than ad-hoc strings.

Logging is kept enabled for every request during development and early staging because this is the most useful period for diagnosing behavior. At larger traffic volumes, successful-request sampling can be added while retaining all error logs.

### Implementation

Added `server/src/utils/logger.js`:

- Configures Pino.
- Selects readable development output or production JSON.
- Redacts authorization, password, token, request-body, and content fields.

Added `server/src/middlewares/request-logger.middleware.js`:

- Creates a request ID with `randomUUID()` when the client does not provide one.
- Adds the ID to `req.requestId`.
- Returns the ID through the `x-request-id` response header.
- Measures request duration with a high-resolution timer.
- Logs successful, client-error, and server-error responses at appropriate levels.

Updated:

- `server/src/app.js` to install the request logger.
- `server/src/config/db.js` to use structured database lifecycle logs.
- `server/src/middlewares/error.middleware.js` to log safe error metadata.
- `server/server.js` to use structured startup and startup-failure logs.
- `server/package.json` with `pino` and `pino-pretty` dependencies.

### Verification

The following checks passed:

- Syntax checks for all logging and wiring files.
- Editor diagnostics reported no errors.
- Request IDs were returned in the response headers.
- Production logs were emitted as JSON.
- Development logs used readable formatting.
- Authorization values were redacted.
- Password values were redacted.
- Note content was redacted.

The redaction test initially found that a top-level `authorization` field was not covered. The logger configuration was corrected and the test was rerun successfully:

```json
{
    "authorization": "[REDACTED]",
    "password": "[REDACTED]",
    "content": "[REDACTED]"
}
```

### Performance consideration

Logging consumes some CPU and output I/O, but the current middleware performs only lightweight work per request: request ID handling, one high-resolution timer, one completion callback, and one structured log write. Pino production JSON output is designed for low overhead, and the backend is more likely to be limited by MongoDB or network latency at current usage levels.

If traffic grows, we can reduce the cost by sampling successful `2xx` requests, keeping all `4xx` and `5xx` logs, reducing health-check logs, or moving output to an asynchronous log collector.

### Result

The backend now produces searchable, correlated logs without logging credentials or private note data. A request ID can be followed from the client response through server errors and database-related logs.

### Lesson

Observability should be designed with privacy and performance together. Logs are useful only when they can explain behavior safely, and structured fields make that information easier to search and operate than scattered console messages.

## Entry 9: Health and readiness

### Question

How can a deployment platform distinguish between a running Node process and a service that is actually ready to handle database-backed requests?

### Context

The backend previously had one `/api/v1/health` endpoint that returned success whenever Express was running. It did not distinguish process liveness from MongoDB readiness, so a server could report healthy while its database dependency was unavailable.

### Decision

Provide separate liveness and readiness checks:

- Liveness checks only the Node process and application response path.
- Readiness checks the MongoDB connection state through `isDatabaseReady()`.
- Return `200` when the service is ready.
- Return `503` when MongoDB is disconnected or not yet connected.
- Keep the existing `/api/v1/health` route as a backwards-compatible liveness alias.
- Include service name, application version, environment, and database state where relevant.
- Prevent health responses from being cached.

This lets load balancers and deployment platforms restart unhealthy instances while avoiding routing traffic to an instance that cannot access MongoDB.

### Implementation

Updated `server/src/app.js` to add:

- `GET /api/v1/health/live`.
- `GET /api/v1/health/ready`.
- Backwards-compatible `GET /api/v1/health` liveness behavior.
- `Cache-Control: no-store` on health responses.
- Standard `ApiResponse` envelopes for health responses.

Updated `server/src/config/env.js` to expose the backend package version as `config.appVersion`.

The liveness response reports:

```json
{
    "statusCode": 200,
    "data": {
        "status": "ok",
        "service": "url-notes-backend",
        "version": "1.0.0",
        "environment": "development"
    },
    "message": "Service is alive",
    "success": true,
    "meta": null
}
```

The readiness response reports `200` when MongoDB is connected and `503` otherwise:

```text
MongoDB connected    -> HTTP 200, status: ready
MongoDB disconnected -> HTTP 503, status: not_ready
```

### Deployment use cases

- A load balancer can use `/api/v1/health/live` to check that the process is running.
- A load balancer can use `/api/v1/health/ready` before sending application traffic.
- A container orchestrator can restart an instance that fails liveness.
- A deployment system can wait for readiness after startup.
- Monitoring can distinguish application failure from MongoDB dependency failure.

### Verification

The following checks passed:

- Liveness returned `200` before MongoDB connected.
- Readiness returned `503` while MongoDB was disconnected.
- The legacy `/api/v1/health` route returned `200`.
- All health responses used the standard `ApiResponse` envelope.
- Health responses included `Cache-Control: no-store`.
- After connecting to local MongoDB, readiness returned `200`.
- The connected response reported `database: "connected"`.
- The disconnected response reported `database: "disconnected"`.
- Version metadata matched `server/package.json`.
- Syntax checks and editor diagnostics passed.

### Result

The backend now exposes operational health information suitable for local development, staging, monitoring, load balancers, and deployment systems. A running process is no longer treated as ready unless its MongoDB dependency is available.

### Lesson

Liveness and readiness answer different questions. Liveness asks whether the process should be restarted; readiness asks whether the process should receive traffic. Keeping them separate makes deployments and incident diagnosis more reliable.

## Entry 10: Graceful shutdown

To be documented after implementation:

- Signal handling.
- HTTP connection draining.
- MongoDB shutdown.
- Shutdown timeout behavior.
- Verification results.

## Entry 11: Dependency and package foundation

### Question

How can the backend have repeatable quality checks, a clear production start command, and a controlled dependency process before we add more features?

### Context

The server had development and start commands, but it did not have standard test, lint, or formatting scripts. Dependency audits had been run manually, and the project needed a clear separation between packages required at runtime and tools required only during development.

### Decision

Keep the package setup deliberately small and explicit:

- Runtime libraries stay in `dependencies`.
- Test, lint, formatting, and development-only tools stay in `devDependencies`.
- Use Vitest for the future test suite.
- Use ESLint for static checks.
- Use Prettier for consistent formatting.
- Keep `start` as the normal Node entrypoint.
- Add `start:prod` for an explicit production command.
- Treat major dependency upgrades as deliberate migrations rather than automatic fixes.

### Implementation

Updated `server/package.json` with:

- `start:prod`: `NODE_ENV=production node server.js`.
- `test`: `vitest run`.
- `lint`: `eslint .`.
- `format`: `prettier --write .`.
- `format:check`: `prettier --check .`.

Added development configuration:

- `server/eslint.config.js`.
- `server/.prettierrc.json`.
- `server/.prettierignore`.

Added development tooling:

- `vitest`.
- `supertest`.
- `eslint`.
- `@eslint/js`.
- `globals`.
- `prettier`.

The existing runtime and development dependency separation was preserved. `pino-pretty`, used only for readable development logs, remains a development dependency.

### Dependency audit decision

`npm audit --omit=dev` was run and reported three moderate `qs` advisories through the Express 4 dependency tree. `npm audit fix` found no non-breaking remediation. Express 5 is available as a major upgrade, but it may require compatibility work, so it was not applied automatically.

The remaining advisory is recorded as deliberate follow-up work rather than hidden by forcing a breaking dependency migration.

### Verification

The following checks passed:

- `npm run lint`.
- `npm run test`.
- `npm run format:check`.
- JavaScript syntax checks across the backend.
- Editor diagnostics for the changed implementation.
- `npm audit --omit=dev` was reviewed.

At the time of this package step, the test script was prepared before the foundation tests were added. The Testing Foundation entry below records the later transition to required passing tests.

### Result

The backend now has repeatable package-quality commands, a production start command, explicit development tooling, and a documented dependency-audit decision. Future features can be required to pass lint, formatting, syntax, and tests through the same package interface.

### Lesson

Dependency management is part of engineering reliability. A clean package boundary and repeatable scripts make future changes easier to review, while deliberate handling of major upgrades avoids introducing unrelated breakage through automated commands.

## Entry 12: Testing foundation

### Question

How can we test the backend reliably without requiring a live server port or an external MongoDB instance for every local run and CI job?

### Context

The package already contained a test command and testing dependencies, but there were no test files, no isolated environment values, and no documented database strategy. Foundation tests needed to verify the app boundary and database readiness behavior without depending on a developer's machine or production secrets.

### Decision

Use Vitest with Supertest:

- Vitest runs tests in a Node environment.
- Supertest exercises the Express app without opening a real network port.
- `createApp()` keeps app construction separate from server startup.
- Test setup provides safe environment values before application modules load.
- Foundation tests do not connect to MongoDB.
- Database behavior is tested through readiness state and safe cleanup.
- A later Auth phase can choose a disposable MongoDB, in-memory MongoDB, or dedicated CI database for model integration tests.

### Implementation

Added `server/vitest.config.js` with:

- Node test environment.
- Test setup file.
- Explicit test file pattern.
- Mock and state cleanup options.

Added `server/test/setup.js` with isolated test values for:

- Development environment.
- Test-only MongoDB URI.
- Local wildcard CORS.
- Test-only JWT secret.
- Test token expiry.

Added `server/test/app.test.js` covering:

- Successful liveness response.
- Disconnected readiness response.
- Standard 404 response.
- Malformed JSON error response.

Added `server/test/db.test.js` covering:

- Initial database readiness state.
- Safe cleanup when no connection exists.

Added `server/TESTING.md` documenting commands, the test environment, the no-live-database strategy, current coverage, and the future integration-test decision.

The package test script is now strict:

```json
"test": "vitest run"
```

It no longer uses `--passWithNoTests`; missing or failing tests now fail the command.

### Verification

The complete foundation suite passed:

```text
Test Files: 2 passed
Tests: 6 passed
```

The following checks also passed:

- `npm run test`.
- `npm run lint`.
- `npm run format:check`.
- Editor diagnostics for the test and configuration files.

### Result

The backend now has a deterministic test foundation that can run without starting a real HTTP port or connecting to MongoDB. The suite verifies the most important platform boundaries before authentication and feature-specific tests are added.

### Lesson

Testing infrastructure should be independent of external services wherever possible. Fast boundary tests catch regressions early, while later integration tests can be added deliberately when a real database is required.

## Entry 13: Deployment baseline

### Question

How can the backend be deployed simply and safely on Render Free without Docker, while keeping MongoDB durable and production secrets outside the repository?

### Context

The backend was locally runnable, but it had no deployment target, Render configuration, pinned production runtime, staging procedure, rollback documentation, or explicit understanding of free-tier limitations. Render also requires a web service to listen on its injected `PORT` and a public host interface.

### Decision

Use a Render free Node web service for the initial deployment:

- Docker is not required.
- Render runs `npm ci` from the `server/` directory.
- Render starts the service with `npm run start:prod`.
- Node 22 LTS is the deployment runtime.
- The server binds to `0.0.0.0` and uses Render's injected `PORT`.
- Render terminates HTTPS at its edge proxy.
- MongoDB Atlas is the durable data store.
- Secrets are stored as Render environment variables.
- Staging is a separate Render service with a separate database and extension origin.
- Production uses the readiness endpoint for deployment health checks.

### Implementation

Created the repository-level `render.yaml` blueprint with:

- A free Node web service.
- `server/` as the root directory.
- `npm ci` as the build command.
- `npm run start:prod` as the start command.
- `/api/v1/health/ready` as the health check path.
- Production environment values and secret placeholders.

Updated `server/src/config/env.js` and `server/server.js` to:

- Add a configurable `HOST` with `0.0.0.0` as the default.
- Bind the HTTP server to `config.host` and `config.port`.
- Include the deployment host in startup logs.

Added:

- `server/.node-version` with Node `22.14.0`.
- `engines.node` in `server/package.json`.
- `server/DEPLOYMENT.md` with deployment, staging, HTTPS, Atlas, rollback, restart, and free-tier guidance.
- `HOST=0.0.0.0` to `server/.env.example`.

The production environment contract is:

```env
NODE_ENV=production
MONGODB_URI=<MongoDB Atlas connection string>
CORS_ORIGIN=chrome-extension://<published-extension-id>
ACCESS_TOKEN_SECRET=<random secret of at least 32 characters>
ACCESS_TOKEN_EXPIRY=15m
```

The Render service does not store these secret values in the repository. `MONGODB_URI`, `CORS_ORIGIN`, and `ACCESS_TOKEN_SECRET` are configured through Render's environment settings.

### MongoDB and free-tier behavior

Render's local filesystem is not a durable notes store, and free services may sleep when idle. The application therefore keeps MongoDB Atlas as the persistence layer. Atlas should use a dedicated least-privilege user and TLS. If stable Render egress IPs are not available for the selected free service, Atlas network access may require `0.0.0.0/0` with strong credentials and restricted database permissions until a more controlled deployment is available.

### Staging and rollback

Staging uses a separate Render service and database with:

- `NODE_ENV=staging`.
- A staging-only JWT secret.
- A staging extension origin.
- A staging MongoDB database.

The deployment process promotes the same reviewed commit from staging to production. Rollback means redeploying the last successful Render deployment, waiting for readiness, and running the API smoke checks again. Database changes must remain backward-compatible before a release is promoted.

### Verification

The following checks passed:

- Render blueprint passed Prettier YAML validation.
- Node 22 runtime configuration was declared in `.node-version` and `package.json`.
- The server defaulted to `0.0.0.0`.
- The server listened successfully on a runtime-provided port.
- `/api/v1/health/ready` remained the deployment readiness contract.
- Graceful shutdown completed with exit code `0`.
- `npm run test` passed with 2 test files and 6 tests.
- `npm run lint` passed.
- `npm run format:check` passed.
- JavaScript syntax checks passed.
- Changed server files had no editor diagnostics.

### Result

The backend now has a concrete Render Free deployment path, documented environment and secret rules, separate staging guidance, a durable database strategy, and a rollback/restart procedure. The code is ready for account-specific Render and MongoDB configuration, but it has not been deployed remotely yet.

### Lesson

Deployment is part of application design. A service is not deployable merely because it runs locally; it must define its runtime host and port, durable storage, secret injection, health checks, rollback process, and platform limitations.

# Learning format for future entries

Every future backend change should add a short entry using this format:

```markdown
## Entry N: Title

### Question

What problem are we solving?

### Context

What was the state before the change?

### Options considered

What reasonable approaches were available?

### Decision

Which approach did we choose and why?

### Implementation

Which files and symbols changed?

### Verification

Which commands, tests, or manual checks passed?

### Result

What behavior exists now?

### Lesson

What should we remember for future work?

### Next step

What is the next smallest useful change?
```

# Current status

- [x] Backend audit completed.
- [x] Production-readiness plan created.
- [x] Foundation work plan created.
- [x] Foundation Step 1 environment configuration implemented.
- [x] Development configuration verified.
- [x] Production unsafe-secret rejection verified.
- [x] `.env` Git protection verified.
- [ ] Foundation Step 2 application bootstrap.
- [ ] Foundation Step 3 database hardening.
- [ ] Foundation Step 4 error handling.
- [ ] Foundation Step 5 security middleware.
- [ ] Foundation Step 6 API conventions.
- [ ] Foundation Step 7 validation infrastructure.
- [ ] Foundation Step 8 logging.
- [ ] Foundation Step 9 health and readiness.
- [ ] Foundation Step 10 graceful shutdown.
- [ ] Foundation Step 11 testing setup.
- [ ] Foundation Step 12 dependency cleanup.
- [ ] Foundation Step 13 staging deployment baseline.
- [ ] Authentication phase.
- [ ] Authorization phase.
- [ ] Notes and pins reliability phase.
- [ ] Cloud synchronization phase.
- [ ] Dashboard and product features phase.
