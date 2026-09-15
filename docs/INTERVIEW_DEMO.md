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

## 3. Admin dashboard

Show the Operations Dashboard and explain that all statistics come from MongoDB:

- Total tickets
- Open tickets
- In-progress tickets
- Resolved tickets
- High-priority tickets
- Customer/Engineer/Admin counts
- Recent tickets
- Priority breakdown

Mention that non-Super-Admin users only see their company scope.

## 4. Ticket workspace

Open **Tickets** and demonstrate:

- Text search across title/description/reporter/assignee
- Status filter
- Priority filter
- Date range filter
- Assignee filter for authorized roles
- Newest/oldest/priority sorting
- Server-side pagination

Open one ticket using **View Details & Activity**.

## 5. Ticket details and collaboration

Inside a ticket demonstrate:

- Status and priority
- Reporter and assigned engineer
- Same-company engineer assignment
- Comments
- Ticket history / audit timeline
- Persistent notifications when assignments, status updates, or comments happen

Explain that tenant and role checks are repeated on the backend for every sensitive operation.

## 6. User and company management

As an Admin show **Users**:

- Approve/block users
- Customer/Engineer role management
- Company-scoped administration

As a Super Admin show **Companies**:

- Create/manage companies
- Company lifecycle status
- Assign users to companies

## 7. Production and engineering points

Mention:

- React + Vite frontend on Vercel
- Node.js + Express backend on Render
- MongoDB Atlas database
- JWT authentication + bcrypt password hashing
- Multi-tenant data isolation using `companyId`
- Persistent notification collection
- Redis integration is optional for background email processing
- Swagger/OpenAPI documentation
- Health endpoint
- Rate limiting and security headers
- GitHub Actions CI for backend tests and frontend production builds

## 8. Closing line

> The main engineering challenge was not CRUD; it was designing role-aware and tenant-aware access so one deployed CRM can safely serve multiple companies while keeping tickets, users, analytics, comments, and notifications isolated.

## Suggested interviewer questions to prepare for

1. How is tenant isolation implemented?
2. Why is `companyId` stored on tickets and users?
3. How do you prevent an engineer from viewing another engineer's ticket?
4. Why use JWT instead of sessions here?
5. How do notifications work if Redis is unavailable?
6. How is pagination implemented on the backend?
7. What happens when a ticket is reassigned?
8. How would you scale this to thousands of companies?
9. What indexes would you add for a large ticket collection?
10. How would you add SLA tracking and escalation?
