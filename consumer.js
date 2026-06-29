require("dotenv").config();

const { createRedis } = require("./utils/redisClient");
const transporter = require("./configs/mailer");

const redisClient = createRedis();

const QUEUE_KEY = process.env.QUEUE_KEY || "queue:notifications";

async function startConsumer() {

    console.log("Consumer started...");

    while (true) {

        try {

            const result = await redisClient.blpop(QUEUE_KEY, 0);

            const message = JSON.parse(result[1]);

            console.log("Message Received:", message);

            const emailList = message.emailList || [];

            const ticketLink = message.ticketLink;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: emailList.join(","),
                subject: "CRM Ticket Notification",
                html: `
                    <h2>Ticket Update Notification</h2>
                    <p>A ticket has been created or updated.</p>

                    <a href="${ticketLink}">
                        View Ticket
                    </a>
                `
            };

            const response = await transporter.sendMail(mailOptions);

            console.log("Email Sent:", response.messageId);

        } catch (err) {

            console.log("Consumer Error:", err.message);

        }
    }
}

startConsumer();