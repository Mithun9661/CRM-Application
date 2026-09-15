const express = require("express");
const app = express();

require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./Models/user.model");
const Company = require("./Models/company.model");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const constants = require("./utils/constants");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./configs/swagger");
const morgan = require("morgan");

const errorHandler = require("./middlewares/errorHandler");

// ================= MIDDLEWARES =================

const allowedOrigins = String(
    process.env.CORS_ORIGINS ||
    "http://localhost:5173,https://crm-application-vert.vercel.app"
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Origin is not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-access-token"]
    })
);

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
});

app.use(express.json({ limit: "1mb" }));
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
        // BOOTSTRAP DEMO COMPANY
        // ==================================================

        let demoCompany = await Company.findOne({ companyCode: "DEMO" });
        if (!demoCompany) {
            demoCompany = await Company.create({
                companyName: "EnterpriseFlow Demo",
                companyCode: "DEMO",
                email: "admin@enterpriseflow.com",
                industry: "TECHNOLOGY",
                status: "ACTIVE"
            });
            console.log("Demo company created successfully");
        }

        // ==================================================
        // CREATE DEFAULT SUPER ADMIN
        // ==================================================

        const superAdmin = await User.findOne({ userId: "superadmin" });
        const superAdminPassword = process.env.DEFAULT_SUPERADMIN_PASSWORD;

        if (!superAdmin && superAdminPassword) {
            const createdSuperAdmin = await User.create({
                name: "Super Admin",
                userId: "superadmin",
                email: "superadmin@enterpriseflow.com",
                userType: constants.userType.superAdmin,
                userStatus: constants.userStatuses.approved,
                password: bcrypt.hashSync(superAdminPassword, 10),
                companyId: null
            });
            console.log("Super Admin created successfully:", createdSuperAdmin.userId);
        } else if (!superAdmin) {
            console.warn("DEFAULT_SUPERADMIN_PASSWORD is not configured; default Super Admin was not created");
        }

        // ==================================================
        // CREATE / MIGRATE DEFAULT ADMIN
        // ==================================================

        let admin = await User.findOne({ userId: "admin" });
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

        if (!admin && adminPassword) {
            admin = await User.create({
                name: "Mithun",
                userId: "admin",
                email: "mithunk98991@gmail.com",
                userType: constants.userType.admin,
                userStatus: constants.userStatuses.approved,
                password: bcrypt.hashSync(adminPassword, 10),
                companyId: demoCompany._id
            });
            console.log("Admin created successfully:", admin.userId);
        } else if (!admin) {
            console.warn("DEFAULT_ADMIN_PASSWORD is not configured; default Admin was not created");
        } else if (!admin.companyId) {
            admin.companyId = demoCompany._id;
            await admin.save();
            console.log("Existing Admin assigned to demo company");
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
            <p><a href="/api-docs">Open Swagger API Documentation</a></p>
        </body>
        </html>
    `);
});

app.get("/health", (req, res) => {
    res.status(200).send({
        status: "ok",
        service: "EnterpriseFlow CRM API",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        timestamp: new Date().toISOString()
    });
});

// ================= API ROUTES =================

const auth_route = require("./Routes/auth.routes");
app.use("/crm/api/v1", auth_route);

const user_route = require("./Routes/user.routes");
app.use("/crm/api/v1", user_route);

const ticket_route = require("./Routes/ticket.routes");
app.use("/crm/api/v1", ticket_route);

const dashboardRoute = require("./Routes/dashboard.routes");
app.use("/crm/api/v1", dashboardRoute);

const company_route = require("./Routes/company.routes");
app.use("/crm/api/v1", company_route);

const notification_route = require("./Routes/notification.routes");
app.use("/crm/api/v1", notification_route);

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

app.use(errorHandler);

// ================= START SERVER =================

const PORT = process.env.PORT || 7777;

app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
});
