# Server Production Readiness Plan

## Purpose

This document turns the server audit into an implementation plan for taking the URL Notes backend from a functional MVP to a production-ready service.

## Current assessment

The backend is a working Express, MongoDB, and JWT service with user-scoped notes, domain pins, soft deletion, restore, and permanent purge.

Current readiness: **approximately 55-65%**.

The existing architecture does not need a rewrite. The next step is a focused hardening, correctness, testing, and deployment pass.

## Launch blockers

These items should be comple1ted before exposing the API to real users.

### 1. Secure configuration

- [ ] Validate required environment variables at startup.
- [ ] Require `MONGODB_URI`.
- [ ] Require a strong `ACCESS_TOKEN_SECRET` in production.
- [ ] Reject known placeholder secrets.
- [ ] Set `NODE_ENV=production` in deployment.
- [ ] Replace wildcard `CORS_ORIGIN=*` with an explicit origin allowlist.
- [ ] Keep production secrets in a secret manager or deployment environment.
- [ ] Document separate development, staging, and production configuration.

**Relevant files:** `server/.env.example`, `server/server.js`, `server/src/app.js`

### 2. Request validation

Add a validation library such as Zod, Joi, or `express-validator`.

Validate all public inputs:

- [ ] Email format and normalization.
- [ ] Password length and basic strength rules.
- [ ] `urlKey` format and maximum length.
- [ ] Domain format and maximum length.
- [ ] Full URL format.
- [ ] Title and content maximum lengths.
- [ ] Allowed note colors.
- [ ] Valid timestamps.
- [ ] Pin payloads.
- [ ] Restore and purge payloads.
- [ ] Reject unknown or unexpected fields where appropriate.

**Relevant files:** `server/src/controllers/auth.controller.js`, `server/src/controllers/note.controller.js`

### 3. Authentication protection

- [ ] Add rate limiting to registration and login.
- [ ] Use a generic login failure message so users cannot be enumerated.
- [ ] Reduce access-token lifetime from 30 days.
- [ ] Design refresh-token rotation and revocation.
- [ ] Add logout/token invalidation if refresh tokens are introduced.
- [ ] Plan JWT secret rotation.
- [ ] Confirm password hashes are never returned in API responses.

**Relevant files:** `server/src/controllers/auth.controller.js`, `server/src/middlewares/auth.middleware.js`, `server/src/models/user.model.js`

### 4. Security middleware and transport

- [ ] Add Helmet.
- [ ] Run behind HTTPS in production.
- [ ] Configure secure proxy handling if deployed behind a reverse proxy.
- [ ] Add appropriate security headers.
- [ ] Keep CORS credentials behavior aligned with the actual client authentication method.
- [ ] Review rich HTML handling and remove dangerous tags/attributes before storage or rendering.

**Relevant files:** `server/src/app.js`, `server/src/models/note.model.js`

### 5. Dependency security

- [ ] Run `npm audit` in `server/`.
- [ ] Apply the non-breaking security updates.
- [ ] Review the Express/body-parser `qs` vulnerability update.
- [ ] Re-run tests and smoke tests after dependency updates.
- [ ] Avoid using `npm audit fix --force` without reviewing breaking changes.

## Correctness and reliability

### 6. Prevent cloud sync overwrites

The client currently supplies `updatedAt`, and the server updates notes without checking whether the incoming version is newer. A delayed or older client can overwrite newer data.

Choose and implement one synchronization policy:

- [ ] Server-enforced last-write-wins using a trusted timestamp.
- [ ] Revision/version numbers with compare-and-set updates.
- [ ] Conflict responses requiring the client to resolve conflicts.

Recommended minimum approach:

1. Store a server-controlled revision or update timestamp.
2. Compare incoming revisions in the backup endpoint.
3. Reject or safely ignore stale updates.
4. Return the current server version to the client.
5. Add tests for two-device update races.

**Relevant files:** `server/src/controllers/note.controller.js`, `server/src/models/note.model.js`, `lib/sync.ts`

### 7. Pagination and response limits

The restore and explorer endpoints currently return all user notes in one response.

- [ ] Add pagination to restore data.
- [ ] Add pagination to active and deleted cloud notes.
- [ ] Enforce maximum page sizes.
- [ ] Add sorting parameters with an allowlist.
- [ ] Use field projections where full content is unnecessary.
- [ ] Consider separate metadata and content endpoints for large collections.
- [ ] Add response-size and query-time protection.

**Relevant files:** `server/src/controllers/note.controller.js`, `server/src/routes/note.routes.js`

### 8. Database and query behavior

- [ ] Add or verify indexes for all frequent user-scoped queries.
- [ ] Confirm unique indexes are created in every deployment environment.
- [ ] Handle duplicate-key errors as HTTP 409 responses.
- [ ] Handle Mongoose validation errors as HTTP 400 responses.
- [ ] Handle invalid ObjectId and cast errors cleanly.
- [ ] Set MongoDB connection and query timeouts.
- [ ] Define retention rules for deleted notes.

### 9. Error handling

Improve the global error middleware to recognize:

- [ ] Mongoose validation errors.
- [ ] Duplicate-key errors.
- [ ] Cast errors.
- [ ] JWT expiration and malformed-token errors.
- [ ] Database connectivity errors.
- [ ] Payload-too-large errors.

Do not expose stack traces, database details, or secrets in production responses.

**Relevant file:** `server/src/middlewares/error.middleware.js`

### 10. Health and lifecycle management

- [ ] Add a liveness endpoint that confirms the process is running.
- [ ] Add a readiness endpoint that confirms MongoDB is available.
- [ ] Add graceful handling for `SIGTERM` and `SIGINT`.
- [ ] Stop accepting traffic before closing the database connection.
- [ ] Drain active HTTP connections during deployment.
- [ ] Return a non-ready status when MongoDB is unavailable.

**Relevant files:** `server/server.js`, `server/src/app.js`, `server/src/config/db.js`

## Observability and operations

### 11. Structured logging

Replace ad-hoc console output with a structured logger such as Pino or Winston.

- [ ] Add request IDs.
- [ ] Log method, route, status, duration, and request ID.
- [ ] Redact authorization headers, passwords, tokens, and note content.
- [ ] Log authentication failures without logging credentials.
- [ ] Log database failures with safe diagnostic context.
- [ ] Use JSON logs in production.

### 12. Monitoring and alerting

- [ ] Monitor uptime and readiness.
- [ ] Track 4xx and 5xx rates.
- [ ] Track authentication failures and rate-limit events.
- [ ] Track request latency.
- [ ] Track MongoDB connection health.
- [ ] Configure alerts for repeated failures and downtime.

### 13. Backups and recovery

- [ ] Configure automated MongoDB backups.
- [ ] Test restoring a backup.
- [ ] Document recovery point and recovery time objectives.
- [ ] Define deleted-note retention and purge policy.
- [ ] Document what happens if cloud restore is interrupted.

## Automated testing

The server currently has no test script. Add a test framework such as Vitest or Jest with Supertest.

### Authentication tests

- [ ] Register with valid input.
- [ ] Reject missing fields.
- [ ] Reject malformed email addresses.
- [ ] Reject weak passwords.
- [ ] Reject duplicate email addresses.
- [ ] Login with valid credentials.
- [ ] Reject invalid credentials without revealing whether the user exists.
- [ ] Reject expired, malformed, and missing tokens.
- [ ] Confirm password fields never appear in responses.

### Authorization tests

- [ ] User A cannot read User B's notes.
- [ ] User A cannot update or delete User B's notes.
- [ ] User A cannot restore or purge User B's notes.
- [ ] User A cannot access User B's domain pins.

### Notes and pins tests

- [ ] Create or update a note.
- [ ] Soft-delete a note.
- [ ] Restore a deleted note.
- [ ] Permanently purge a note.
- [ ] Create or update a domain pin.
- [ ] Remove a domain pin.
- [ ] Reject invalid note colors and malformed payloads.
- [ ] Verify unique user/url-key behavior.
- [ ] Verify stale sync updates are handled correctly.
- [ ] Verify pagination and maximum page sizes.

### Operational tests

- [ ] Health endpoint when MongoDB is available.
- [ ] Readiness endpoint when MongoDB is unavailable.
- [ ] Graceful shutdown.
- [ ] Duplicate-key and validation error responses.
- [ ] Rate-limit behavior.
- [ ] Payload-size limits.

## Deployment readiness

- [ ] Choose deployment target: VPS, Docker, managed platform, or cloud service.
- [ ] Add a production start command.
- [ ] Add a Dockerfile if container deployment is selected.
- [ ] Add a reverse proxy or managed HTTPS endpoint.
- [ ] Configure environment variables securely.
- [ ] Configure the production MongoDB database.
- [ ] Restrict MongoDB network access.
- [ ] Configure automated deployment or a repeatable manual deployment process.
- [ ] Add a rollback procedure.
- [ ] Set the extension's production API URL.
- [ ] Confirm production CORS allows the extension origin.
- [ ] Run a complete production smoke test.

## Suggested implementation order

### Phase 1: Secure baseline

Estimated effort: **2-3 developer days**

1. Add environment validation.
2. Fix CORS configuration.
3. Rotate production secrets.
4. Add request validation.
5. Add authentication rate limiting.
6. Add Helmet and HTTPS deployment requirements.
7. Update vulnerable dependencies.

### Phase 2: Reliability and correctness

Estimated effort: **3-5 developer days**

1. Add server-enforced sync conflict handling.
2. Add pagination and response limits.
3. Improve database error mapping.
4. Sanitize rich HTML on the server.
5. Add health/readiness endpoints.
6. Add graceful shutdown.
7. Add structured logging.

### Phase 3: Tests and CI

Estimated effort: **3-5 developer days**

1. Add unit and API integration tests.
2. Add tenant-isolation tests.
3. Add sync race-condition tests.
4. Add test database setup.
5. Add linting and dependency audit checks.
6. Run all checks in CI.

### Phase 4: Deployment and operations

Estimated effort: **2-4 developer days**

1. Deploy a staging environment.
2. Configure HTTPS, secrets, and MongoDB restrictions.
3. Configure monitoring and alerts.
4. Configure backups and recovery testing.
5. Deploy production.
6. Run smoke tests and document rollback.

## Estimated total effort

- **Minimum secure launch:** 5-7 working days.
- **Proper production release:** 10-15 working days.
- **Strong production setup with testing, monitoring, backups, and deployment automation:** 2-3 weeks.

The estimate assumes one experienced developer and no major redesign of the extension sync protocol.

## Definition of done

The server can be considered production-ready when:

- [ ] Production configuration refuses unsafe defaults.
- [ ] Only approved clients can call the API.
- [ ] Authentication endpoints are rate-limited.
- [ ] All request payloads are validated.
- [ ] Rich content is sanitized safely.
- [ ] Users cannot access another user's data.
- [ ] Stale sync updates cannot overwrite newer data unexpectedly.
- [ ] Large accounts do not require unbounded responses.
- [ ] Health and readiness checks work.
- [ ] Shutdown is graceful.
- [ ] Logs and alerts provide enough information to operate the service.
- [ ] Automated tests cover authentication, authorization, notes, pins, trash, and sync.
- [ ] MongoDB backups have been configured and restoration has been tested.
- [ ] A staging deployment has passed smoke tests.
- [ ] Production deployment and rollback steps are documented.
