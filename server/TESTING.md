# Backend Testing

## Commands

Run the foundation suite:

```bash
npm test
```

Run static checks:

```bash
npm run lint
npm run format:check
```

## Test framework

The backend uses Vitest with Supertest.

- Vitest runs JavaScript tests in a Node environment.
- Supertest exercises the Express app without opening a real network port.
- `createApp()` keeps the app separate from server startup, which makes request tests isolated.

## Test environment

`test/setup.js` provides safe test values for required configuration:

- Development mode.
- A test-only MongoDB URI.
- Wildcard CORS for local test requests.
- A test-only JWT secret.

These values are set before application modules are imported. No production `.env` values are required for the test suite.

## Database strategy

Foundation tests do not connect to MongoDB. They test the database boundary without requiring an external service:

- `isDatabaseReady()` starts false before a connection.
- `disconnectDB()` can safely clean up when no connection exists.
- Health readiness returns `503` while disconnected.

Integration tests that exercise models or controllers against MongoDB will be added later. The Auth phase should choose between a disposable test MongoDB instance, an in-memory MongoDB server, or a dedicated CI database.

## Current coverage

The foundation suite currently verifies:

- Liveness endpoint.
- Readiness endpoint while MongoDB is disconnected.
- Standard 404 responses.
- Malformed JSON error handling.
- Database readiness state.
- Database cleanup behavior.

Authentication, authorization, note ownership, and sync behavior are intentionally deferred to their later phases.
