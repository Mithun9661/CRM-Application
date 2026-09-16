# EnterpriseFlow CRM — Resume & Interview Notes

## Resume project title

**EnterpriseFlow CRM — Multi-Company Service Desk Platform**

## Resume description

Built and deployed a multi-tenant CRM/service-desk platform using React, Node.js, Express, MongoDB Atlas, JWT, and role-based access control. Implemented tenant-isolated ticket workflows, engineer assignment, comments, audit history, persistent in-app notifications, transactional email notifications through Resend HTTPS API, analytics, advanced search/filtering, pagination, and company/user administration. Deployed frontend on Vercel and backend on Render with CI checks using GitHub Actions.

## Strong resume bullets

- Developed a full-stack multi-company CRM using React, Node.js, Express, MongoDB Atlas, JWT authentication, and RBAC.
- Designed tenant isolation using `companyId` across users, tickets, comments, analytics, assignment, and notification workflows.
- Implemented four roles — Super Admin, Admin, Engineer, and Customer — with backend authorization checks for platform, company, assignee, and reporter scope.
- Built ticket search, filters, sorting, pagination, comments, audit history, persistent notification inbox, engineer assignment, and status-management workflows.
- Added transactional email notifications with Resend HTTPS API so production email delivery works on Render without depending on blocked SMTP ports.
- Added production safeguards including CORS restrictions, security headers, rate limiting, safe error responses, session-expiry handling, and health checks.
- Deployed the frontend to Vercel and backend to Render, used MongoDB Atlas for production data, and added GitHub Actions CI for backend tests and frontend builds.

## Verified V1 flows

The production deployment has been manually verified for:

- Super Admin access to multiple companies and platform-wide tickets
- Company-scoped Admin access
- Customer isolation to only the customer's own tickets
- Engineer isolation to assigned tickets only
- Customer ticket creation with server-side reporter/company assignment
- Automatic same-company engineer assignment
- Ticket status changes and audit history
- Ticket comments and activity history
- Persistent in-app notifications
- Transactional email notifications through Resend
- Multi-company ticket isolation across EnterpriseFlow Demo and Nova Retail Labs

## 30-second interview explanation

> EnterpriseFlow CRM is a multi-company support platform. A Super Admin manages companies, each company has its own Admins, Engineers, and Customers, and all support tickets are isolated by tenant. Customers create tickets, Engineers work on assigned tickets, Admins manage company operations, and important status/comment events generate both in-app and email notifications. I deployed the React frontend on Vercel, the Express API on Render, and MongoDB Atlas stores the data. The main focus was secure multi-tenant authorization rather than only CRUD functionality.

## Key technical questions

### How did you implement multi-tenancy?
Every company has a unique MongoDB `Company` document. Users and tickets reference `companyId`. For every protected ticket or user operation, the backend resolves the logged-in user from the JWT and restricts the query or explicitly checks the resource's `companyId` before returning or modifying data.

### Why not rely on the frontend to hide restricted data?
Frontend hiding is only a UX feature and can be bypassed. The backend validates role, company, reporter, and assignee rules before sensitive operations.

### How does the ticket access policy work?
Super Admin has platform-level access. Admin has company-level access. Engineer can access tickets assigned to that engineer in the same company. Customer can access tickets reported by that customer in the same company.

### How is dashboard data generated?
Dashboard counts and recent activity are calculated from MongoDB using a query scope built from the current user's role and company.

### How do notifications work?
Important events create persistent notification documents in MongoDB and the frontend shows unread counts. Email notifications are delivered through the Resend HTTPS API. The main ticket workflow does not depend on Redis or email delivery succeeding.

### Why use Resend instead of Gmail SMTP in production?
The deployed backend runs on Render, where outbound SMTP ports can be restricted on free services. Resend uses HTTPS, so transactional email delivery works without requiring direct SMTP connectivity.

### How would you scale ticket search?
Use compound indexes based on actual query patterns, especially company + status + createdAt and company + assignee + status. For larger free-text search requirements, use Atlas Search or a dedicated search service instead of regex queries.

### What would you add next?
SLA deadlines, escalation rules, file attachments, knowledge base, email-to-ticket ingestion, audit exports, richer reporting, and real-time push notifications.
