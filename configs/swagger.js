const swaggerJsDoc = require("swagger-jsdoc");
const path = require("path");

const apiBaseUrl = process.env.API_BASE_URL || "https://crm-application-ahkr.onrender.com/crm/api/v1";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "EnterpriseFlow Multi-Company CRM API",
      version: "1.0.0",
      description:
        "Production REST API for multi-company CRM service-desk workflows, tenant-aware users, tickets, comments, notifications and analytics."
    },
    servers: [
      {
        url: apiBaseUrl,
        description: "Production"
      },
      {
        url: "http://localhost:7777/crm/api/v1",
        description: "Local development"
      }
    ],
    tags: [
      { name: "Auth", description: "Authentication and account access" },
      { name: "Users", description: "Tenant-aware user and role management" },
      { name: "Companies", description: "Super Admin company management" },
      { name: "Tickets", description: "Support ticket lifecycle and assignment" },
      { name: "Comments", description: "Ticket collaboration" },
      { name: "Notifications", description: "Persistent CRM notification inbox" },
      { name: "Dashboard", description: "Role-aware CRM analytics" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: [path.join(__dirname, "../Routes/*.js")]
};

module.exports = swaggerJsDoc(options);
