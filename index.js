const express = require("express");
const app = express();

require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./Models/user.model");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const constants = require("./utils/constants");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./configs/swagger");
const morgan = require("morgan");

const errorHandler = require("./middlewares/errorHandler");

// ================= MIDDLEWARES =================

app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

console.log("Starting server...");

// ================= MONGODB CONNECTION =================

(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/crm"
        );

        console.log("Connected to MongoDB successfully");

        // ==================================================
        // CREATE DEFAULT SUPER ADMIN
        // ==================================================

        const superAdmin = await User.findOne({
            userId: "superadmin"
        });

        if (!superAdmin) {
            console.log("Super Admin is not present");

            const createdSuperAdmin = await User.create({
                name: "Super Admin",
                userId: "superadmin",
                email: "superadmin@enterpriseflow.com",
                userType: constants.userType.superAdmin,
                userStatus: constants.userStatuses.approved,
                password: bcrypt.hashSync("SuperAdmin123", 8),
                companyId: null
            });

            console.log(
                "Super Admin created successfully:",
                createdSuperAdmin.userId
            );
        } else {
            console.log("Super Admin is already present");
        }

        // ==================================================
        // CREATE DEFAULT ADMIN
        // ==================================================

        const admin = await User.findOne({
            userId: "admin"
        });

        if (!admin) {
            console.log("Admin is not present");

            const createdAdmin = await User.create({
                name: "Mithun",
                userId: "admin",
                email: "mithunk98991@gmail.com",
                userType: constants.userType.admin,
                userStatus: constants.userStatuses.approved,
                password: bcrypt.hashSync("Welcome1", 8),

                // Currently existing admin is not connected
                // to any company yet
                companyId: null
            });

            console.log(
                "Admin created successfully:",
                createdAdmin.userId
            );
        } else {
            console.log("Admin is already present");
        }

    } catch (err) {
        console.log("MongoDB Error:", err);
    }
})();

// ================= HOME ROUTE =================

app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>EnterpriseFlow CRM</title>
        </head>

        <body>
            <h1>EnterpriseFlow - Multi-Company CRM API 🚀</h1>
            <p>Server is running successfully!</p>
            <p>
                <a href="/api-docs">
                    Open Swagger API Documentation
                </a>
            </p>
        </body>
        </html>
    `);
});

// ================= API ROUTES =================

// Authentication Routes
const auth_route = require("./Routes/auth.routes");
app.use("/crm/api/v1", auth_route);

// User Routes
const user_route = require("./Routes/user.routes");
app.use("/crm/api/v1", user_route);

// Ticket Routes
const ticket_route = require("./Routes/ticket.routes");
app.use("/crm/api/v1", ticket_route);

// Dashboard Routes
const dashboardRoute = require("./Routes/dashboard.routes");
app.use("/crm/api/v1", dashboardRoute);

// Company Routes
const company_route = require("./Routes/company.routes");
app.use("/crm/api/v1", company_route);

// ================= SWAGGER =================

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        swaggerOptions: {
            persistAuthorization: true
        }
    })
);

// ================= ERROR HANDLER =================
// Always keep this AFTER all routes

app.use(errorHandler);

// ================= START SERVER =================

const PORT = process.env.PORT || 7777;

app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
});
