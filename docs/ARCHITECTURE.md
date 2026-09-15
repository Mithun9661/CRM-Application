# EnterpriseFlow CRM — Architecture

## High-level architecture

```text
Browser
  |
  v
React + Vite Frontend (Vercel)
  |
  | HTTPS / JSON / JWT
  v
Node.js + Express API (Render)
  |
  +--> MongoDB Atlas
  |      - companies
  |      - users
  |      - tickets
  |      - comments
  |      - notifications
  |
  +--> Redis (optional)
         - background notification/email queue
```

## Authentication

1. User signs in with `userId` + password.
2. Backend verifies the bcrypt password hash.
3. Backend issues a JWT.
4. Protected routes verify the token and resolve the current user.
5. Authorization checks are applied by role and tenant.

## Multi-tenant isolation

`companyId` is the tenant boundary.

- `SUPER_ADMIN`: can operate across companies.
- `ADMIN`: limited to the user's company.
- `ENGINEER`: limited to assigned tickets from the same company.
- `CUSTOMER`: limited to tickets reported by that customer from the same company.

Ticket access is validated server-side before reading comments, history, assignment, or updates.

## Ticket lifecycle

```text
OPEN -> IN_PROGRESS -> CLOSED
```

Every ticket keeps `ticketHistory` with:

- action
- updatedBy
- oldValue
- newValue
- timestamp

This gives an auditable activity trail.

## Notifications

Persistent notifications are stored in MongoDB so the notification bell works even without Redis.
Redis remains optional for asynchronous/background email notification processing.

## Production safety

- Restricted CORS origins
- Security response headers
- JSON payload size limit
- API/login rate limits
- Production-safe error responses
- Environment-based JWT secret
- Health/readiness endpoint
- Password hashes are never returned in user API responses

## CI/CD

GitHub Actions validates every change with:

- Backend Jest tests
- Frontend production build

Git-linked deployments then publish to Render and Vercel.

## Scaling improvements

For a larger deployment:

- Add compound indexes such as `{ companyId, status, createdAt }`
- Add `{ companyId, assignee, status }`
- Move email/event delivery to durable queues
- Add SLA deadlines and escalation jobs
- Add object storage for ticket attachments
- Add audit-log retention policies
- Add caching for expensive dashboard aggregations
