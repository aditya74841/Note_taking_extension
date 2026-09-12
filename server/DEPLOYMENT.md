# Backend Deployment Baseline

## Deployment target

The first production target is a Render free web service running the Node.js backend. Docker is not required for this deployment because Render can build and run the Node project directly with `npm ci` and `npm run start:prod`.

The Render blueprint is at the repository root:

```text
render.yaml
```

It points Render at the `server/` directory with:

- Build command: `npm ci`
- Start command: `npm run start:prod`
- Plan: `free`
- Health check: `/api/v1/health/ready`
- Automatic deploys enabled

## Runtime

The runtime is pinned to Node 22 LTS through:

- `server/.node-version`
- `engines.node` in `server/package.json`

The server listens on:

- `HOST=0.0.0.0` by default.
- Render's injected `PORT` value.

Do not hard-code the production port. Render assigns it at runtime.

## Required production environment variables

Configure these in the Render dashboard or through the blueprint secret prompts:

```env
NODE_ENV=production
MONGODB_URI=<MongoDB Atlas connection string>
CORS_ORIGIN=chrome-extension://<published-extension-id>
ACCESS_TOKEN_SECRET=<random secret of at least 32 characters>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d
PASSWORD_RESET_TOKEN_EXPIRY_MINUTES=15
AUTH_RESET_URL=https://<published-extension-reset-url>
MAIL_FROM=security@example.com
RESEND_API_KEY=<Resend API key>
```

`MONGODB_URI`, `CORS_ORIGIN`, `ACCESS_TOKEN_SECRET`, `AUTH_RESET_URL`, `MAIL_FROM`, and `RESEND_API_KEY` are marked `sync: false` in `render.yaml` so their values are not stored in the repository.

The production extension origin must be the real published extension ID. The backend URL is configured separately in the extension's server URL setting.

## HTTPS

Render provides HTTPS for the public service URL. The extension must use the `https://` Render URL in production. Do not use the local `http://localhost:8000/api/v1` URL in the production extension configuration.

The application trusts proxy headers in production because Render terminates TLS at its edge proxy. The Node process itself should not be exposed directly outside Render.

## MongoDB Atlas network access

The backend uses MongoDB Atlas as the durable database. Render free services can sleep and their local filesystem is not a durable storage layer, so notes must remain in MongoDB.

Configure Atlas with:

- A dedicated least-privilege database user.
- TLS enabled in the connection string.
- A database named for this application.
- Network access that permits Render outbound traffic.

Render free outbound IP addresses may not be fixed. If Atlas cannot use a stable Render IP allowlist for the selected service, the practical free-tier fallback is `0.0.0.0/0` with a strong database user, TLS, and least-privilege permissions. Restrict this later when a deployment with stable egress is available.

## Staging environment

Create a second Render free web service for staging by cloning the production service settings. Use separate values:

```env
NODE_ENV=staging
MONGODB_URI=<separate staging MongoDB database>
CORS_ORIGIN=chrome-extension://<development-or-staging-extension-id>
ACCESS_TOKEN_SECRET=<different staging secret>
ACCESS_TOKEN_EXPIRY=15m
```

Staging should use a separate database or database name. Never point staging at production data while testing migrations or feature changes.

Deploy to staging first, run the smoke checks, and promote the same reviewed commit to production.

## Health checks

Render should use:

```text
GET /api/v1/health/ready
```

Expected behavior:

- `200` when MongoDB is connected and indexes are available.
- `503` when the process is running but MongoDB is unavailable.

The liveness endpoint is also available:

```text
GET /api/v1/health/live
```

## Deployment procedure

1. Push the reviewed commit to the repository.
2. Create or update the Render web service from `render.yaml`.
3. Set the secret environment variables in Render.
4. Confirm the service is using Node 22.
5. Wait for the readiness health check to pass.
6. Verify the HTTPS URL.
7. Test registration/login and a note backup from the extension after Auth is implemented.
8. Check logs for startup, MongoDB connection, readiness, and shutdown events.

## Smoke checks

After each staging or production deploy:

```bash
curl -i https://<render-service>.onrender.com/api/v1/health/live
curl -i https://<render-service>.onrender.com/api/v1/health/ready
```

Check that:

- The live endpoint returns `200`.
- The ready endpoint returns `200`.
- The response includes the expected version and environment.
- The response does not contain stack traces or secrets.
- The extension can reach the configured API origin.

## Rollback procedure

Render can redeploy the previous successful deployment from the service dashboard. The rollback process is:

1. Stop promoting the current commit.
2. Identify the last successful deployment.
3. Redeploy that commit in Render.
4. Wait for `/api/v1/health/ready` to return `200`.
5. Test the extension's API connection.
6. Review logs for startup and database errors.

Database schema changes must be backward-compatible before deployment. Do not roll back application code while leaving an incompatible database migration active.

## Restart behavior

The server supports `SIGTERM` and `SIGINT` graceful shutdown. Render can stop or restart the service without cutting the HTTP server and MongoDB connection abruptly:

1. Stop accepting new requests.
2. Allow active requests to complete.
3. Close the HTTP server.
4. Close MongoDB.
5. Exit with a success or failure status.

The shutdown timeout is 10 seconds. Render's free service may also sleep when idle; that is expected free-tier behavior and the first request after sleep may take longer.

## Free-tier limitations

- The service may spin down after inactivity.
- Cold starts can increase first-request latency.
- Local files are ephemeral and must not be used for note persistence.
- Render free resources are suitable for staging and early production use, not guaranteed high availability.
- MongoDB Atlas remains the durable storage layer.
