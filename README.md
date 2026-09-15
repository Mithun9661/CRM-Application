# EnterpriseFlow CRM

EnterpriseFlow is a production-deployed, multi-company CRM and service-desk application built with the MERN stack. It supports tenant isolation, JWT authentication, role-based access control, ticket workflows, engineer assignment, comments, audit history, persistent in-app notifications, dashboard analytics, advanced ticket search, and company administration.

## Live Application

- Frontend: https://crm-application-vert.vercel.app
- Backend API: https://crm-application-ahkr.onrender.com
- API health: https://crm-application-ahkr.onrender.com/health
- Swagger: https://crm-application-ahkr.onrender.com/api-docs

> The backend is hosted on a free Render service, so the first request after an idle period can take a little longer.

## Core Features

### Multi-company architecture

- Platform-level `SUPER_ADMIN`
- Company-level `ADMIN`
- Support `ENGINEER`
- Requester `CUSTOMER`
- Users and tickets are isolated by `companyId`
- Engineer assignment is restricted to approved engineers from the same company
- Super Admin can manage companies across the platform

### Ticket service desk

- Create and track support tickets
- Priority levels P1-P5
- Status workflow: `OPEN`, `IN_PROGRESS`, `CLOSED`, `BLOCKED`
- Automatic initial engineer assignment when an approved engineer is available
- Manual engineer reassignment by Admin/Super Admin
- Ticket comments and collaboration
- Complete ticket audit timeline
- Role-aware ticket visibility and update permissions

### Search and operations

- Search across title, description, reporter and assignee
- Filter by status, priority, engineer and date range
- Newest, oldest and priority sorting
- Server-side pagination
- Role-aware operational dashboard
- Recent tickets and priority breakdown

### Notifications

- Persistent MongoDB-backed notification inbox
- Unread notification counter
- Notifications for ticket assignment, ticket updates and new comments
- Mark one or all notifications as read
- Optional Redis notification queue when `REDIS_URL` is configured

### Security

- JWT authentication
- bcrypt password hashing
- Role-based access control
- Tenant-level authorization checks
- Restricted CORS origins
- Request size limits
- Security response headers
- Search input escaped before regex use
- Customer restrictions on assignment, priority and status changes
- JWT secret material is never hard-coded in source

## Tech Stack

**Frontend**
- React
- Vite
- CSS
- Fetch API
- Vercel

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcryptjs
- Swagger
- Morgan

**Infrastructure**
- Render
- Vercel
- Docker
- Optional Redis

## Project Structure

```text
CRM-Application/
├── Controllers/
├── Models/
├── Routes/
├── configs/
├── middlewares/
├── utils/
├── frontend/
│   └── src/
├── index.js
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Local Setup

### Backend

```bash
git clone https://github.com/Mithun9661/CRM-Application.git
cd CRM-Application
npm install
```

Create a root `.env` file:

```env
PORT=7777
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=use_a_long_random_secret
CORS_ORIGINS=http://localhost:5173
BASE_URL=http://localhost:7777
REDIS_URL=optional_redis_url
DEFAULT_ADMIN_PASSWORD=optional_bootstrap_password_for_new_database
DEFAULT_SUPERADMIN_PASSWORD=optional_bootstrap_password_for_new_database
```

Run:

```bash
npm start
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:7777/crm/api/v1
```

Run:

```bash
npm run dev
```

## Main API Areas

| Area | Examples |
| --- | --- |
| Authentication | Sign up, sign in |
| Dashboard | Role-aware CRM statistics |
| Tickets | Create, list, filter, update, history |
| Comments | Add and view ticket comments |
| Notifications | Inbox, unread count, mark read |
| Users | Company-scoped user and role management |
| Companies | Super Admin company management |

## Role Behaviour

| Role | Main access |
| --- | --- |
| `SUPER_ADMIN` | Platform-wide companies, users and tickets |
| `ADMIN` | Company users, company tickets, assignment and workflow management |
| `ENGINEER` | Assigned company tickets, status updates and comments |
| `CUSTOMER` | Own company tickets, ticket creation and comments |

## Interview Demo Flow

1. Open the deployed frontend and sign in.
2. Show the live operations dashboard.
3. Create a support ticket.
4. Open **Tickets** and demonstrate search, filters and pagination.
5. Open **Details & Activity** to show comments and the audit trail.
6. As an Admin, assign the ticket to an engineer and update its status.
7. Show the notification bell and unread activity.
8. Show **Users** for role/status management.
9. With Super Admin access, show **Companies** and multi-tenant administration.
10. Open Swagger to explain the REST API design.

## Deployment Architecture

```text
React / Vite (Vercel)
        |
        | HTTPS REST API
        v
Node.js / Express (Render)
        |
        v
MongoDB Atlas
        |
        +---- Optional Redis notification queue
```

## Author

**Mithun Kumar**

- GitHub: https://github.com/Mithun9661
- LinkedIn: https://www.linkedin.com/in/mithunkumar9661/
