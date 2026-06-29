const express = require("express");
const app = express();

require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./Models/user.model");
const bcrypt = require("bcryptjs");


const constants = require("./utils/constants");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./configs/swagger");

const morgan = require("morgan");

const errorHandler = require("./middlewares/errorHandler");
app.use(morgan("combined"));

/** 
 * Make a connnection with the MongoDB
*/



app.use(express.json());

console.log(" Starting server...");

/**
 * MongoDB Connection
 */
(async () => { 
    try {
        await mongoose.connect(
            process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/crm"
        );
        console.log(" Connected to MongoDB successfully");
        const user = await User.findOne({userId : "admin"});
        if(!user) {
            console.log("Admin is not present");
        
        // Lets create an new admin user
        const admin = await User.create({
            name: "Mithun",
            userId: "admin",
            email: "mithunk98991@gmail.com",
            userType : constants.userType.admin  ,
            password: bcrypt.hashSync("Welcome1",8)
        });
        console.log("Admin created : ",admin);
    } else {
        console.log("Admin is already present");
    }
    } catch (err) {
        console.log(" Error: ", err);
    }
})();

/**
 * Let's stitch the auth route
 */
const auth_route = require("./Routes/auth.routes");
app.use("/crm/api/v1/", auth_route);

const user_route = require("./Routes/user.routes");
app.use("/crm/api/v1/", user_route);

const ticket_route = require("./Routes/ticket.routes");
app.use("/crm/api/v1/", ticket_route);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true
    }
  })
);
app.use(errorHandler);

const dashboardRoute = require("./Routes/dashboard.routes");

app.use("/crm/api/v1",dashboardRoute);

const PORT = process.env.PORT || 7777;
console.log(process.env.PORT)
app.listen(PORT, () => {
    console.log(` Server started on port: ${PORT}`);
}); 