const swaggerJsDoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CRM Ticketing API",
      version: "1.0.0",
      description: "CRM Ticketing System API Documentation"
    },

    servers: [
      {
        url: "http://localhost:7777/crm/api/v1"
      }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },

    security: [
      {
        bearerAuth: []
      }
    ]
  },

  apis: [path.join(__dirname, "../Routes/*.js")]
};

const swaggerSpec = swaggerJsDoc(options);

console.log("Swagger Paths =", swaggerSpec.paths);

module.exports = swaggerSpec;