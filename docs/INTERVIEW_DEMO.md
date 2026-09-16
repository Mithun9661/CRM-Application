# EnterpriseFlow CRM — Interview Demo Walkthrough

Use this flow for a 4–6 minute project demonstration.

## 1. Start with the problem

> Many companies need one support platform where customers can raise issues, engineers can resolve them, admins can manage teams, and a platform owner can manage multiple companies without mixing tenant data.

EnterpriseFlow CRM solves this with a multi-company service-desk architecture.

## 2. Login and explain role-based access

The application supports four roles:

- `SUPER_ADMIN` — platform-wide company and user administration
- `ADMIN` — company-level users, tickets, analytics, and assignment
- `ENGINEER` — assigned support tickets and collaboration
- `CUSTOMER` — own support requests and comments

Explain that authorization is enforced on the backend, not only by hiding frontend buttons.

## 3. Super Admin multi-company demo

Login as Super Admin and show:

- **Companies** — EnterpriseFlow Demo and Nova Retail Labs
- **Users** — users from both tenants
- **Tickets** — platform-wide visibility across both companies

Explain that Super Admin is the only role with platform-wide access.

## 4. Customer isolation demo

Login as a Customer and show that:

- Only tickets created by that customer are visible
- Admin-created or Nova Retail Labs tickets are not visible
- Customer ticket creation does not expose company/reporter assignment fields
- The backend derives reporter and company from the authenticated user

Create a ticket and show automatic assignment to an approved engineer from the same company.

## 5. Engineer workflow

Login as the assigned Engineer and demonstrate:

- Only tickets assigned to that engineer are visible
- Update a ticket from `OPEN` to `IN_PROGRESS`
- Add a support comment
- Show the ticket history/audit timeline

Explain that each sensitive action is checked again on the backend against role, company, reporter, and assignee rules.

## 6. Notification and email flow

Demonstrate:

- Persistent in-app notifications stored in MongoDB
- Notification bell/unread count in the frontend
- Customer notification after engineer status update or comment
- Transactional email notification through the Resend HTTPS API

Mention that the CRM's core workflow continues even if external email delivery fails.

## 7. Admin dashboard and ticket workspace

Show the Operations Dashboard and explain that statistics are calculated from MongoDB within the current user's access scope:

- Total tickets
- Open tickets
- In-progress tickets
- Resolved tickets
- High-priority tickets
- Customer/Engineer/Admin counts
- Recent tickets
- Priority breakdown

Open **Tickets** and demonstrate:

- Text search across title/description/reporter/assignee
- Status filter
- Priority filter
- Date range filter
- Assignee filter for authorized roles
- Newest/oldest/priority sorting
- Server-side pagination

## 8. Production and engineering points

Mention:

- React + Vite frontend on Vercel
- Node.js + Express backend on Render
- MongoDB Atlas database
- JWT authentication + bcrypt password hashing
- Multi-tenant data isolation using `companyId`
- Persistent notification collection
- Resend HTTPS API for transactional email
- Redis integration remains optional and does not block core workflows
- Swagger/OpenAPI documentation
- Health endpoint
- Rate limiting, CORS restrictions, and security headers
- Session-expiry recovery in the frontend
- GitHub Actions CI for backend tests and frontend production builds

## 9. Final screenshot sequence

Use this exact order when screenshots are shown instead of a live demo:

1. **Secure Login** — secure JWT-based authentication.
2. **Super Admin - Company Management** — multiple tenant organizations.
3. **Super Admin - User & Role Management** — RBAC across all four roles.
4. **Super Admin - Global Ticket Workspace** — authorized cross-tenant visibility.
5. **Customer Isolation** — customer sees only its own tickets.
6. **Engineer Operations Dashboard** — assigned support workload and notifications.
7. **Ticket Details, Status & Audit Trail** — status updates, comments, and history.
8. **Support Ticket Creation** — role-aware ticket creation.
9. **Notification / Email evidence** — explain that in-app and Resend email delivery were verified during V1 testing.

Detailed captions are available in [`SCREENSHOT_DEMO_GUIDE.md`](SCREENSHOT_DEMO_GUIDE.md).

## 10. V1 verification status

The deployed V1 has been manually verified for:

- Multi-company Super Admin visibility
- Customer isolation
- Engineer assigned-ticket isolation
- Customer ticket creation
- Same-company engineer assignment
- Status updates
- Comments and audit history
- In-app notifications
- Email notification delivery

## 11. Closing line

> The main engineering challenge was not CRUD; it was designing role-aware and tenant-aware access so one deployed CRM can safely serve multiple companies while keeping tickets, users, analytics, comments, and notifications isolated.

## Suggested interviewer questions to prepare for

1. How is tenant isolation implemented?
2. Why is `companyId` stored on tickets and users?
3. How do you prevent an engineer from viewing another engineer's ticket?
4. Why use JWT instead of sessions here?
5. How do notifications work if the external email provider is unavailable?
6. Why did you use an HTTPS email provider instead of SMTP on Render?
7. How is pagination implemented on the backend?
8. What happens when a ticket is reassigned?
9. How would you scale this to thousands of companies?
10. What indexes would you add for a large ticket collection?
11. How would you add SLA tracking and escalation?
