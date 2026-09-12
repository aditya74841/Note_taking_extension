# Server Security Requirements

## HTTPS

Staging and production deployments must be served through HTTPS. TLS should terminate at the deployment platform or reverse proxy, and traffic from the proxy to the Node process should remain on a private network when possible.

The API must not be exposed directly over plain HTTP to public users. The browser extension should use an HTTPS API URL outside local development.

## Proxy configuration

The Express application trusts proxy headers only in `staging` and `production`. The deployment must use a trusted reverse proxy and must not allow arbitrary clients to reach the Node process directly while proxy trust is enabled.

## CORS

`CORS_ORIGIN` is a comma-separated allowlist. Wildcard CORS is accepted only in development. Staging and production must use explicit origins, such as the deployed browser extension origin.

The API uses Bearer tokens in the `Authorization` header, so cross-origin credentials are disabled. Cookies should not be introduced without revisiting the CORS and CSRF model.

## Request limits

JSON and URL-encoded request bodies are limited to 16 KB. Requests exceeding that limit are rejected with HTTP 413 before reaching a controller.
