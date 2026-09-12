# URL Notes Backend Authentication Journey

## Purpose

This document is the implementation plan and learning journal for the complete authentication system of the URL Notes backend.

The authentication scope is intentionally limited to:

- Email.
- Password.
- Access tokens.
- Refresh tokens.
- Password reset.
- Password change.
- Logout and refresh-token revocation.

A user profile system is **not** part of this phase. We will not add names, avatars, preferences, biographies, or profile editing. The only identity fields are `email` and the protected password hash.

## Current authentication state

The backend currently has:

- `POST /api/v1/auth/register`.
- `POST /api/v1/auth/login`.
- `GET /api/v1/auth/me`.
- A `User` model with email and password.
- bcrypt password hashing.
- JWT access-token generation.
- Bearer-token middleware.

The current implementation still needs:

- Request schemas and password rules.
- Generic authentication errors.
- Login and registration rate limiting.
- Short-lived access tokens.
- Refresh tokens.
- Refresh-token rotation and reuse detection.
- Logout and token revocation.
- Forgot-password tokens.
- Password reset completion.
- Authenticated password change.
- Email delivery integration or a development mail provider.
- Full authentication test coverage.
- Secure token storage and cleanup rules.

## Authentication principles

### 1. Minimal identity

The user identity is only:

```text
email + password
```

The password is never returned by the API. Only a bcrypt hash is stored in MongoDB.

### 2. Short-lived access tokens

Access tokens are used for API requests and should expire quickly.

Recommended production lifetime:

```text
15 minutes
```

The access token is sent in the `Authorization` header:

```http
Authorization: Bearer <access-token>
```

### 3. Long-lived refresh tokens

Refresh tokens are used only to obtain new access tokens. They should not be used to access normal note endpoints.

Recommended lifetime:

```text
30 days
```

Refresh tokens should be:

- Random opaque values or signed tokens with server-side tracking.
- Stored as hashes in MongoDB, never as plaintext.
- Rotated every time they are used.
- Revoked on logout.
- Revoked after password change.
- Revoked after password reset.

### 4. Password reset tokens are one-time secrets

Forgot-password requests create a short-lived, single-use reset token.

The database stores only a hash of the token. The plaintext token is sent through an email provider and is never stored.

Recommended lifetime:

```text
15 minutes
```

### 5. Do not reveal account existence

Registration may report a duplicate email because it is useful to the user. Forgot-password and login flows should avoid leaking unnecessary account information.

The forgot-password endpoint should return the same generic response whether or not the email exists:

```text
If an account exists, password reset instructions will be sent.
```

## Target API surface

### Public endpoints

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

### Authenticated endpoints

```text
POST /api/v1/auth/change-password
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

`/me` returns only the minimal identity required by the extension, such as user ID and email. It is not a profile feature.

## Target token flow

### Register

```text
Client sends email and password
        |
        v
Validate and normalize input
        |
        v
Check duplicate email
        |
        v
Hash password with bcrypt
        |
        v
Create user
        |
        v
Create refresh-token session
        |
        v
Return short-lived access token + refresh token
```

### Login

```text
Client sends email and password
        |
        v
Normalize email
        |
        v
Find user
        |
        v
Compare password hash
        |
        v
Create refresh-token session
        |
        v
Return access token + refresh token
```

Invalid email and invalid password should return the same generic response:

```text
Invalid email or password
```

### Refresh

```text
Client sends refresh token
        |
        v
Hash presented token
        |
        v
Find active token session
        |
        v
Check expiration and revocation
        |
        v
Revoke the old refresh token
        |
        v
Create and store a replacement refresh token
        |
        v
Return a new access token + refresh token
```

If a previously rotated refresh token is used again, revoke the entire token family. This protects against token theft and reuse.

### Logout

```text
Client sends refresh token or authenticated request
        |
        v
Revoke the relevant session or token family
        |
        v
Return success without exposing token details
```

Logout should be safe to call repeatedly.

### Forgot password

```text
Client sends email
        |
        v
Always return the same public response
        |
        v
If the user exists, create a random reset token
        |
        v
Store only the token hash and expiry
        |
        v
Send reset link through the email provider
```

The reset link should contain a token that is never logged.

### Reset password

```text
Client sends reset token + new password
        |
        v
Hash token and find unexpired unused record
        |
        v
Hash and save the new password
        |
        v
Mark reset token as used
        |
        v
Revoke all refresh-token sessions
        |
        v
Return success
```

### Change password

```text
Authenticated client sends current password + new password
        |
        v
Verify access token
        |
        v
Compare current password
        |
        v
Validate new password
        |
        v
Hash and save new password
        |
        v
Revoke all refresh-token sessions
        |
        v
Require fresh login or refresh-token authentication
```

The current password must be required so a stolen access token alone cannot silently change the password.

# Step-by-step implementation plan

## Auth Step 1: Define the authentication contract

### Work

- [ ] Confirm the exact public and authenticated routes.
- [ ] Confirm request and response envelopes.
- [ ] Confirm access-token lifetime.
- [ ] Confirm refresh-token lifetime.
- [ ] Confirm reset-token lifetime.
- [ ] Confirm token rotation behavior.
- [ ] Confirm logout behavior.
- [ ] Confirm forgot-password generic response.
- [ ] Confirm no profile fields are added.

### Request contracts

#### Register

```json
{
  "email": "person@example.com",
  "password": "strong-password"
}
```

#### Login

```json
{
  "email": "person@example.com",
  "password": "strong-password"
}
```

#### Refresh

```json
{
  "refreshToken": "opaque-refresh-token"
}
```

#### Forgot password

```json
{
  "email": "person@example.com"
}
```

#### Reset password

```json
{
  "token": "one-time-reset-token",
  "password": "new-strong-password"
}
```

#### Change password

```json
{
  "currentPassword": "current-password",
  "newPassword": "new-strong-password"
}
```

#### Logout

```json
{
  "refreshToken": "refresh-token-to-revoke"
}
```

### Completion criteria

- [ ] Contract is documented.
- [ ] No profile fields are present.
- [ ] All auth responses use the shared API envelope.
- [ ] All sensitive values are excluded from responses and logs.

## Auth Step 2: Add authentication configuration

### Work

Add validated configuration values for:

```env
ACCESS_TOKEN_SECRET=<strong random secret>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=<different strong random secret if JWT refresh tokens are used>
REFRESH_TOKEN_EXPIRY=30d
PASSWORD_RESET_TOKEN_EXPIRY_MINUTES=15
AUTH_RESET_URL=https://<frontend-or-extension-reset-route>
MAIL_FROM=security@example.com
```

If refresh tokens are opaque and hashed in MongoDB, a separate refresh JWT secret is not needed. The preferred design for this project is opaque, hashed, rotating refresh tokens.

### Security requirements

- [ ] Require production secrets.
- [ ] Reject placeholder secrets.
- [ ] Do not use the access secret for refresh-token hashing.
- [ ] Keep reset URL and mail settings environment-specific.
- [ ] Never log secret values.

### Completion criteria

- [ ] Configuration fails fast when auth settings are invalid.
- [ ] Development values are separate from staging and production values.
- [ ] Token lifetimes are not hard-coded in controllers.

## Auth Step 3: Build reusable authentication helpers

### Work

Create a small auth utility layer for:

- [ ] Email normalization.
- [ ] Password hashing.
- [ ] Password comparison.
- [ ] Access-token signing.
- [ ] Access-token verification.
- [ ] Cryptographically secure random-token generation.
- [ ] Token hashing with SHA-256.
- [ ] Refresh-token family IDs.
- [ ] Safe authentication response creation.

Use Node's cryptographic random generator for opaque tokens. Do not use `Math.random()`.

### Completion criteria

- [ ] Helpers have unit tests.
- [ ] Plaintext refresh and reset tokens never reach logs or the database.
- [ ] Access-token claims contain only the minimum identity data.

## Auth Step 4: Add refresh-token session storage

### Recommended model

Create a `RefreshSession` model:

```text
userId
familyId
tokenHash
expiresAt
revokedAt
replacedByTokenHash
createdAt
lastUsedAt
userAgent optional
ipAddress optional
```

The model should have:

- [ ] Index on `userId`.
- [ ] Index on `familyId`.
- [ ] Unique index on `tokenHash`.
- [ ] TTL index on `expiresAt` where appropriate.
- [ ] No plaintext refresh token field.

### Token rotation rules

- [ ] Every refresh request consumes the old token.
- [ ] A replacement token is created.
- [ ] The old token is marked revoked.
- [ ] Reuse of a revoked token revokes its entire family.
- [ ] Password changes revoke all sessions for the user.
- [ ] Logout revokes the selected session or family.

### Completion criteria

- [ ] Model and indexes exist.
- [ ] Token hashes cannot be used across users.
- [ ] Expired sessions are rejected.
- [ ] Reused sessions trigger family revocation.

## Auth Step 5: Implement registration

### Work

- [ ] Create a Zod registration schema.
- [ ] Normalize the email before querying.
- [ ] Validate email format.
- [ ] Enforce password length and strength rules.
- [ ] Reject unknown fields.
- [ ] Handle duplicate email with `409`.
- [ ] Hash the password through the model/service.
- [ ] Create the first refresh session.
- [ ] Return access and refresh tokens.
- [ ] Return only minimal user identity.
- [ ] Add rate limiting.

### Response

```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "id": "user-id",
      "email": "person@example.com"
    },
    "accessToken": "access-token",
    "refreshToken": "refresh-token"
  },
  "message": "Registration successful",
  "success": true,
  "meta": null
}
```

### Tests

- [ ] Valid registration.
- [ ] Missing email.
- [ ] Invalid email.
- [ ] Weak password.
- [ ] Unknown field.
- [ ] Duplicate email.
- [ ] Password is not returned.
- [ ] Password is stored hashed.
- [ ] Refresh token is not stored plaintext.

## Auth Step 6: Implement login

### Work

- [ ] Create a Zod login schema.
- [ ] Normalize email.
- [ ] Compare password with bcrypt.
- [ ] Return generic invalid-credential errors.
- [ ] Create a refresh session.
- [ ] Return short-lived access and refresh tokens.
- [ ] Add login rate limiting.
- [ ] Avoid logging email/password combinations.

### Tests

- [ ] Valid login.
- [ ] Unknown email.
- [ ] Wrong password.
- [ ] Missing fields.
- [ ] Invalid email.
- [ ] Generic error consistency.
- [ ] Token response shape.
- [ ] Rate limiting.

## Auth Step 7: Implement access-token middleware

### Work

- [ ] Read Bearer access tokens only for API authorization.
- [ ] Verify signature and expiration.
- [ ] Return generic `401` errors.
- [ ] Do not accept refresh tokens as access tokens.
- [ ] Load only the minimal user identity.
- [ ] Exclude password from user queries.
- [ ] Use centralized config rather than direct `process.env` access.

### Tests

- [ ] Missing access token.
- [ ] Malformed access token.
- [ ] Expired access token.
- [ ] Valid access token.
- [ ] Deleted user.
- [ ] Refresh token rejected as access token.

## Auth Step 8: Implement refresh-token rotation

### Work

- [ ] Add `POST /api/v1/auth/refresh`.
- [ ] Validate refresh-token input.
- [ ] Hash the presented token.
- [ ] Find the active session.
- [ ] Reject expired sessions.
- [ ] Reject revoked sessions.
- [ ] Revoke the old session.
- [ ] Create replacement token and session.
- [ ] Detect token reuse.
- [ ] Revoke the token family after reuse.
- [ ] Return new access and refresh tokens.

### Tests

- [ ] Valid refresh.
- [ ] Expired refresh.
- [ ] Revoked refresh.
- [ ] Refresh rotation.
- [ ] Old token cannot be reused.
- [ ] Reuse revokes token family.
- [ ] New access token authorizes protected routes.

## Auth Step 9: Implement logout

### Work

- [ ] Add `POST /api/v1/auth/logout`.
- [ ] Revoke the supplied refresh session or token family.
- [ ] Make repeated logout safe.
- [ ] Decide whether logout means one device or all devices.
- [ ] Do not expose whether a token existed.

### Tests

- [ ] Logout active session.
- [ ] Reuse logged-out refresh token fails.
- [ ] Repeated logout is safe.
- [ ] Other sessions remain active when single-session logout is selected.
- [ ] All sessions are revoked when global logout is selected.

## Auth Step 10: Implement forgot password

### Work

- [ ] Add `POST /api/v1/auth/forgot-password`.
- [ ] Normalize email.
- [ ] Always return a generic success response.
- [ ] Generate a cryptographically secure one-time token for existing users.
- [ ] Store only its hash.
- [ ] Store expiry and used state.
- [ ] Invalidate previous reset tokens for the user.
- [ ] Send the reset link through an email provider.
- [ ] Do not log the reset token.
- [ ] Add rate limiting.

### Required dependency decision

Choose an email provider before implementing the real flow:

- [ ] Resend.
- [ ] SendGrid.
- [ ] Postmark.
- [ ] SMTP provider.
- [ ] Development-only mail catcher.

### Tests

- [ ] Existing email returns generic response.
- [ ] Unknown email returns the same generic response.
- [ ] Reset token is hashed.
- [ ] Reset token expires.
- [ ] Previous token is invalidated.
- [ ] Rate limiting works.
- [ ] Email provider failure does not reveal account existence.

## Auth Step 11: Implement reset password

### Work

- [ ] Add `POST /api/v1/auth/reset-password`.
- [ ] Validate token and new password.
- [ ] Hash the token for lookup.
- [ ] Reject missing, expired, or used tokens.
- [ ] Hash the new password.
- [ ] Mark the reset token used.
- [ ] Revoke all refresh sessions.
- [ ] Return a generic success response.
- [ ] Require login again after reset.

### Tests

- [ ] Valid reset.
- [ ] Invalid token.
- [ ] Expired token.
- [ ] Reused token.
- [ ] Weak new password.
- [ ] Sessions revoked after reset.
- [ ] Old password rejected.
- [ ] New password accepted.

## Auth Step 12: Implement change password

### Work

- [ ] Add `POST /api/v1/auth/change-password`.
- [ ] Require a valid access token.
- [ ] Validate current and new passwords.
- [ ] Require the current password to match.
- [ ] Reject unchanged password.
- [ ] Save the new bcrypt hash.
- [ ] Revoke all refresh sessions.
- [ ] Decide whether to issue a fresh session or require login again.
- [ ] Return only a safe success response.

### Tests

- [ ] Valid password change.
- [ ] Missing access token.
- [ ] Wrong current password.
- [ ] Weak new password.
- [ ] Same current and new password.
- [ ] Old password rejected.
- [ ] New password accepted.
- [ ] Existing refresh sessions revoked.

## Auth Step 13: Harden the current-user endpoint

This is not a profile feature. It is only a minimal authenticated identity check.

- [ ] Return user ID and email only.
- [ ] Never return password or token fields.
- [ ] Use the standard response envelope.
- [ ] Add a valid-token test.
- [ ] Add an invalid-token test.

## Auth Step 14: Add authentication rate limits

Apply route-specific limits:

- [ ] Registration attempts.
- [ ] Login attempts.
- [ ] Refresh attempts.
- [ ] Forgot-password attempts.
- [ ] Reset-password attempts.

Use generic error responses and avoid logging credentials. Rate-limit keys should consider IP and normalized email where appropriate.

## Auth Step 15: Add security and cleanup jobs

- [ ] Add TTL cleanup for expired refresh sessions.
- [ ] Add TTL cleanup for expired password-reset tokens.
- [ ] Remove old revoked sessions according to a retention policy.
- [ ] Add indexes for cleanup queries.
- [ ] Confirm password hashes never appear in projections.
- [ ] Confirm tokens never appear in logs.
- [ ] Confirm reset links use HTTPS outside development.

## Auth Step 16: Complete authentication test coverage

### API tests

- [ ] Register success and validation failures.
- [ ] Login success and generic failures.
- [ ] Access-token authorization.
- [ ] Refresh rotation.
- [ ] Refresh-token reuse detection.
- [ ] Logout.
- [ ] Forgot password.
- [ ] Reset password.
- [ ] Change password.
- [ ] Minimal `/me` response.
- [ ] Rate limits.
- [ ] Error response consistency.

### Security tests

- [ ] Passwords are bcrypt hashes.
- [ ] Tokens are not stored plaintext.
- [ ] Tokens are not logged.
- [ ] Reset tokens are single-use.
- [ ] Reset and password-change revoke sessions.
- [ ] User A cannot affect User B's sessions or reset tokens.
- [ ] Expired tokens are rejected.
- [ ] Token families are revoked after reuse.

## Auth Step 17: Staging verification

Before production:

- [ ] Configure staging secrets in Render.
- [ ] Configure a separate staging MongoDB database.
- [ ] Configure staging extension CORS origin.
- [ ] Configure the email provider in test mode.
- [ ] Deploy the authentication branch to staging.
- [ ] Run the complete authentication test suite.
- [ ] Manually test register, login, refresh, logout, forgot password, reset password, and change password.
- [ ] Verify no secrets or tokens appear in Render logs.
- [ ] Verify graceful restart.
- [ ] Verify expired and revoked token behavior.

## Auth Step 18: Production release

- [ ] Create production secrets in Render.
- [ ] Create or verify the production MongoDB user.
- [ ] Configure the published extension origin.
- [ ] Configure the production email provider.
- [ ] Deploy the reviewed commit.
- [ ] Confirm readiness is `200`.
- [ ] Run production smoke tests without printing credentials or tokens.
- [ ] Monitor auth error rates and reset-email delivery.
- [ ] Keep rollback available.

# Authentication definition of done

The authentication phase is complete when:

- [ ] Register works with validated email and password.
- [ ] Login works with generic invalid-credential errors.
- [ ] Access tokens are short-lived and verified centrally.
- [ ] Refresh tokens are rotated, hashed, expiring, and revocable.
- [ ] Refresh-token reuse revokes its token family.
- [ ] Logout revokes the intended session or token family.
- [ ] Forgot-password responses do not reveal account existence.
- [ ] Reset tokens are hashed, short-lived, and single-use.
- [ ] Password reset revokes existing sessions.
- [ ] Change password requires the current password.
- [ ] Password change revokes existing sessions.
- [ ] `/me` returns only minimal identity fields.
- [ ] No profile feature has been added.
- [ ] Auth routes have rate limits.
- [ ] Auth tests pass in CI.
- [ ] Staging verification passes.
- [ ] Production secrets are not stored in Git.
- [ ] Logs contain no passwords or tokens.

# Questions to answer during implementation

Each auth implementation step should record answers to these questions:

1. What threat or failure does this change address?
2. Why is this token stored or not stored?
3. What happens if the client retries the request?
4. What happens if a token is stolen?
5. What happens if an email does not exist?
6. Which sessions are revoked after a password change?
7. How can the client recover from an expired access token?
8. How is the behavior tested without production services?
9. What information is safe to log?
10. How can the change be rolled back safely?

# Learning entry template

For every authentication step, append an entry using this format:

```markdown
## Auth Journey Entry N: Title

### Question

What authentication problem are we solving?

### Threat model

What could go wrong or be abused?

### Context

What was the backend behavior before this change?

### Decision

What approach did we choose and why?

### Implementation

Which files, models, routes, and utilities changed?

### Verification

Which tests and manual checks passed?

### Result

What behavior exists now?

### Lesson

What should we remember for future auth work?

### Next step

What is the next smallest safe change?
```

# Suggested implementation order

```text
1. Authentication contract
2. Auth configuration
3. Reusable auth helpers
4. Refresh-session model
5. Registration
6. Login
7. Access-token middleware
8. Refresh-token rotation
9. Logout
10. Forgot password
11. Reset password
12. Change password
13. Minimal /me endpoint
14. Rate limiting
15. Cleanup jobs and security audit
16. Full auth tests
17. Staging verification
18. Production release
```

The key rule is to implement and test one step at a time. Do not add profile fields or move to broader product features until this identity-only authentication contract is complete and verified.

# Current implementation status

The first complete authentication implementation is now in place:

- [x] Centralized access-token and refresh-token configuration.
- [x] Short-lived access-token default of `15m`.
- [x] Refresh-token expiry configuration of `30d`.
- [x] Hashed, rotating refresh sessions.
- [x] Refresh-token family reuse detection.
- [x] Refresh-session TTL cleanup index.
- [x] Hashed, single-use password-reset tokens.
- [x] Password-reset TTL cleanup index.
- [x] Register endpoint with strict validation.
- [x] Login endpoint with generic invalid-credential response.
- [x] Refresh endpoint.
- [x] Logout endpoint.
- [x] Forgot-password endpoint.
- [x] Reset-password endpoint.
- [x] Change-password endpoint.
- [x] Minimal `/me` response containing only user ID and email.
- [x] Authentication route rate limits.
- [x] Resend email-provider boundary.
- [x] Development-safe email-provider fallback.
- [x] Auth request-boundary tests.
- [x] Local MongoDB end-to-end smoke test.

The smoke test verified:

```text
register       -> 201
refresh        -> 200
refresh reuse  -> 401 and family revocation
/me            -> 200
change password-> 200
login changed  -> 200
reset password -> 200
logout         -> 200
```

## Operational prerequisite before password-reset release

Password reset is implemented through the Resend provider boundary. Before staging or production, configure:

```env
RESEND_API_KEY=<provider secret>
MAIL_FROM=security@example.com
AUTH_RESET_URL=https://<published-extension-reset-url>
```

Without `RESEND_API_KEY`, development logs only that the provider is not configured and does not print the reset token. Staging and production must configure the provider so users can receive reset links.

## Remaining auth hardening

The core feature flows work, but the following release work remains:

- [ ] Add dedicated database-backed auth integration tests to CI.
- [ ] Add provider-backed email delivery tests.
- [ ] Review rate-limit behavior behind the Render proxy.
- [ ] Add multi-device session-management UI only if needed later.
- [ ] Verify production Resend domain and sender configuration.
- [ ] Run staging manual tests with real email delivery.
