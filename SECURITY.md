# Security Policy

## Reporting a Vulnerability

Contact the maintainers directly at **security@playmorrow.dev**.

Do **not** file a public issue for security vulnerabilities.

## Current Protections

- CSRF protection via HMAC-signed tokens on all mutations.
- Session cookies are `httpOnly`, `secure`, `SameSite` with 7-day expiry.
- Content Security Policy restricts script/style sources.
- User input sanitized with DOMPurify before rendering.
- OAuth state parameter prevents CSRF on social login.
- Rate limiting enforced on auth endpoints.

For more detail, see the API security documentation.
