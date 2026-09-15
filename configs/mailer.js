const nodemailer = require("nodemailer");
require("dotenv").config();

// Render containers may resolve smtp.gmail.com to IPv6 first even when the
// instance has no IPv6 route. Use Gmail STARTTLS on port 587 and force IPv4.
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        // Google displays app passwords in groups; spaces are not part of it.
        pass: String(process.env.EMAIL_PASS || "").replace(/\s+/g, "")
    },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
    tls: {
        servername: "smtp.gmail.com"
    }
});

module.exports = transporter;