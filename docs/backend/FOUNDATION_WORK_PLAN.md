# Backend Foundation Work Plan

## Purpose

This document lists the backend foundation work that must be completed before building or improving authentication, synchronization, dashboard behavior, or other product features.

The foundation should make the server stable, secure, testable, observable, and deployable.

## Phase 0: Backend Foundation

### 1. Project and environment setup

- [x] Create a proper configuration module.
- [x] Validate required environment variables at startup.
- [x] Require `MONGODB_URI`.
- [x] Require `PORT`.
- [x] Require `NODE_ENV`.
- [x] Validate `CORS_ORIGIN`.
- [x] Reject placeholder or weak production secrets.
- [x] Separate development, staging, and production configuration.
- [x] Update `.env.example` with safe placeholders.
- [x] Confirm `.env` is never committed.

**Relevant files:** `server/server.js`, `server/src/config/env.js`, `server/.env.example`

### 2. Application bootstrap

- [x] Separate Express app creation from server startup.
- [x] Load and validate configuration before starting the app.
- [x] Start listening only after MongoDB is connected.
- [x] Fail clearly when startup configuration is invalid.
- [x] Keep startup logs concise and safe.

**Relevant files:** `server/server.js`, `server/src/app.js`

### 3. Database foundation

- [x] Configure MongoDB connection timeouts.
- [x] Configure server selection timeout.
- [x] Handle connection errors consistently.
- [x] Add connection and disconnection logging.
- [x] Verify required indexes.
- [x] Confirm unique indexes are created correctly.
- [x] Define development database behavior.
- [x] Define production database access restrictions.

**Relevant file:** `server/src/config/db.js`

### 4. Security middleware baseline

- [x] Add Helmet.
- [x] Configure explicit CORS origins.
- [x] Remove wildcard CORS from production.
- [x] Decide whether credentials are required.
- [x] Configure JSON body limits.
- [x] Configure URL-encoded body limits.
- [x] Add protection against oversized requests.
- [x] Document HTTPS requirements.
- [x] Configure proxy behavior for production deployment.

**Relevant file:** `server/src/app.js`

### 5. Error handling foundation

- [x] Create a consistent error response format.
- [x] Handle unknown routes with a 404 response.
- [x] Handle JSON parsing errors.
- [x] Handle payload-too-large errors.
- [x] Handle Mongoose validation errors.
- [x] Handle duplicate-key errors.
- [x] Handle invalid ObjectId errors.
- [x] Hide stack traces in production.
- [x] Avoid exposing MongoDB details.
- [x] Keep safe development-only error details.

**Relevant files:** `server/src/middlewares/error.middleware.js`, `server/src/utils/ApiError.js`, `server/src/utils/ApiResponse.js`

### 6. Request and response conventions

Define consistent API rules before adding more endpoints:

- [x] Standard success response shape.
- [x] Standard error response shape.
- [x] Standard HTTP status codes.
- [x] API versioning convention.
- [x] Naming convention for IDs and timestamps.
- [x] Maximum values for strings and payloads.
- [x] Date and time format.
- [x] Pagination format for future list endpoints.
- [x] Sorting format for future list endpoints.

This prevents each future feature from creating a different API style.

### 7. Generic request validation system

Authentication-specific schemas can be added during the Auth phase, but the validation infrastructure should be created during Foundation.

- [x] Choose a validation library.
- [x] Create reusable validation middleware.
- [x] Create reusable string, URL, domain, ID, and pagination validators.
- [x] Define the validation error response format.
- [x] Reject unexpected fields where appropriate.
- [x] Add maximum content sizes.
- [x] Add protection against malformed input.

**Potential files:** `server/src/middlewares/validation.middleware.js`, `server/src/schemas/`

### 8. Logging foundation

- [x] Choose a structured logger.
- [x] Add request IDs.
- [x] Log method, path, status, and duration.
- [x] Redact authorization headers.
- [x] Never log passwords or note content.
- [x] Use readable logs in development.
- [x] Use JSON logs in production.
- [x] Add safe database error logging.

Logging should be in place before production features so future behavior is observable from the beginning.

### 9. Health and readiness endpoints

Replace the current single health endpoint with separate checks:

- [x] Liveness endpoint confirms the Node process is running.
- [x] Readiness endpoint confirms MongoDB is connected.
- [x] Return a non-200 status when MongoDB is unavailable.
- [x] Include application version where useful.
- [x] Include environment label where useful.

Suggested endpoints:

```text
GET /api/v1/health/live
GET /api/v1/health/ready
```

### 10. Graceful shutdown

- [x] Handle `SIGTERM`.
- [x] Handle `SIGINT`.
- [x] Stop accepting new requests.
- [x] Allow active requests to finish.
- [x] Close the HTTP server.
- [x] Close the MongoDB connection.
- [x] Exit with the correct status.
- [x] Prevent shutdown from hanging indefinitely.

**Relevant file:** `server/server.js`

### 11. Dependency and package foundation

- [x] Run `npm audit`.
- [x] Apply safe dependency updates where available; no non-breaking audit fix was available for the remaining `qs` advisories.
- [x] Review breaking updates manually; Express 5 and other major upgrades remain deliberate follow-up work.
- [x] Add a test script.
- [x] Add a lint script.
- [x] Add a formatting script if needed.
- [x] Add a production start script.
- [x] Keep development dependencies separate from production dependencies.

**Relevant file:** `server/package.json`

### 12. Testing foundation

Before writing feature-specific tests, establish the test setup:

- [x] Choose Vitest or Jest.
- [x] Add Supertest for API testing.
- [x] Create test environment configuration.
- [x] Choose a test database strategy.
- [x] Create test setup and teardown.
- [x] Add a basic health endpoint test.
- [x] Add a basic 404 test.
- [x] Add an error middleware test.
- [x] Add a database connection test or mock.
- [x] Add a CI-ready test command.

The Auth phase will add registration, login, and JWT tests on top of this foundation.

### 13. Deployment baseline

- [x] Choose a deployment method: Render free web service.
- [x] Decide whether Docker is required: not required for the initial Render deployment.
- [x] Configure the production Node version: Node 22 LTS.
- [x] Configure HTTPS through Render.
- [x] Configure MongoDB network access through MongoDB Atlas guidance.
- [x] Define secret storage through Render environment variables.
- [x] Define staging environment as a separate Render service and database.
- [x] Define production environment in `render.yaml`.
- [x] Create deployment documentation in `server/DEPLOYMENT.md`.
- [x] Create a rollback procedure.
- [x] Confirm the server can restart safely through graceful shutdown and readiness checks.

## Recommended completion order

1. Environment configuration
2. Application bootstrap
3. Database connection hardening
4. Error handling
5. Security middleware
6. API conventions
7. Validation infrastructure
8. Logging
9. Health and readiness checks
10. Graceful shutdown
11. Testing setup
12. Dependency cleanup
13. Staging deployment baseline

## Foundation definition of done

Do not start the Auth phase until:

- [ ] The server refuses unsafe configuration.
- [ ] MongoDB connection failures are handled clearly.
- [ ] CORS is explicitly configured.
- [ ] Security headers are enabled.
- [ ] Request size limits are active.
- [ ] Errors have consistent responses.
- [ ] Unknown routes return proper 404 responses.
- [ ] Logs do not expose secrets or private note content.
- [ ] Liveness and readiness checks work.
- [ ] Graceful shutdown works.
- [ ] A test command exists and passes.
- [ ] A staging environment can start and restart safely.
- [ ] The dependency audit has been reviewed.

## Work that waits until Foundation is complete

The following work belongs after the foundation:

- Registration and login behavior
- JWT improvements
- Refresh tokens
- Password rules
- Login rate limiting
- Note synchronization conflict handling
- Pagination implementation
- Cloud restore improvements
- Dashboard features
- New note features

The overall sequence is:

```text
Foundation
    ↓
Authentication
    ↓
Authorization and tenant isolation
    ↓
Notes and pins reliability
    ↓
Cloud sync improvements
    ↓
Dashboard and product features
```
