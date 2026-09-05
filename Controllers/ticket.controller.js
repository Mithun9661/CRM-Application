const User = require("../Models/user.model");
const constants = require("../utils/constants");
const Ticket = require("../Models/ticket.model");

const { randomUUID: uuidv4 } = require("crypto");

const { createRedis } = require("../utils/redisClient");
const redisClient = createRedis();

const dotenv = require("dotenv");
dotenv.config();

const QUEUE_KEY = process.env.QUEUE_KEY || "queue:notifications";

/**
 * Send notification message to Redis
 */
const sendMessageToRedis = async (req, engineer, ticket) => {
    const emailList = [];

    try {
        // Fetch user who created/updated the ticket
        const user = await User.findOne({
            userId: req.userId
        });

        if (user && user.email) {
            emailList.push(user.email);
        }
    } catch (err) {
        console.log(
            "Error while fetching the user object:",
            err.message
        );
    }

    // Add engineer email if assigned
    if (engineer && engineer.email) {
        emailList.push(engineer.email);
    }

    /**
     * Create notification message
     */
    const ticketLink =
        process.env.BASE_URL || "http://127.0.0.1:7777";

    const message = {
        emailList: emailList,
        ticketLink: `${ticketLink}/crm/api/v1/tickets/${ticket._id}`
    };

    try {
        await enqueue(message);
        console.log("Message passed to Redis");
    } catch (err) {
        console.log(
            "Error while passing the message to Redis:",
            err.message
        );
    }
};

/**
 * Create a new ticket
 * Ticket is automatically assigned to an available engineer if found
 */
exports.createTicket = async (req, res) => {
    console.log("BODY =", req.body);
    console.log("USER =", req.userId);

    const ticketObj = {
        title: req.body.title,
        ticketPriority: req.body.ticketPriority,
        description: req.body.description,
        status: req.body.status || "OPEN",
        reporter: req.userId
    };

    // Create initial ticket history
    ticketObj.ticketHistory = [
        {
            action: "TICKET_CREATED",
            updatedBy: req.userId,
            newValue: {
                title: ticketObj.title,
                description: ticketObj.description,
                ticketPriority: ticketObj.ticketPriority,
                status: ticketObj.status
            }
        }
    ];

    try {
        /**
         * Auto assign an approved engineer if available
         */
        const engineer = await User.findOne({
            userType: constants.userType.engineer,
            userStatus: constants.userStatuses.approved
        });

        if (engineer) {
            ticketObj.assignee = engineer.userId;
        }

        // Create ticket
        const ticket = await Ticket.create(ticketObj);

        // Send notification
        if (ticket) {
            await sendMessageToRedis(req, engineer, ticket);
        }

        return res.status(201).send(ticket);

    } catch (err) {
        console.log(
            "Error while creating the ticket:",
            err.message
        );

        return res.status(500).send({
            message:
                err.message ||
                "Some error occurred while creating the ticket"
        });
    }
};


/**
 * Update ticket
 *
 * Allows:
 * - Reporter/Owner
 * - Engineer
 * - Admin
 *
 * Can update:
 * - title
 * - description
 * - ticketPriority
 * - status
 * - assignee
 */
exports.updateTicket = async (req, res) => {
    try {
        /**
         * Find ticket
         */
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).send({
                message: "Ticket not found"
            });
        }

        /**
         * Find calling user
         */
        const callingUserDetails = await User.findOne({
            userId: req.userId
        });

        if (!callingUserDetails) {
            return res.status(401).send({
                message: "User not found or unauthorized"
            });
        }

        /**
         * Check authorization
         */
        const isReporter = ticket.reporter === req.userId;

        const isEngineer =
            callingUserDetails.userType ===
            constants.userType.engineer;

        const isAdmin =
            callingUserDetails.userType ===
            constants.userType.admin;

        if (!isReporter && !isEngineer && !isAdmin) {
            return res.status(403).send({
                message:
                    "Ticket can only be updated by owner, engineer or admin"
            });
        }

        /**
         * IMPORTANT:
         * Save OLD values before making changes
         */
        const oldTicket = {
            title: ticket.title,
            description: ticket.description,
            ticketPriority: ticket.ticketPriority,
            status: ticket.status,
            assignee: ticket.assignee
        };

        /**
         * Update only fields received in request
         */

        if (req.body.title !== undefined) {
            ticket.title = req.body.title;
        }

        if (req.body.description !== undefined) {
            ticket.description = req.body.description;
        }

        if (req.body.ticketPriority !== undefined) {
            ticket.ticketPriority = req.body.ticketPriority;
        }

        if (req.body.status !== undefined) {
            ticket.status = req.body.status;
        }

        if (req.body.assignee !== undefined) {
            ticket.assignee = req.body.assignee;
        }

        /**
         * Add ticket history
         */
        ticket.ticketHistory.push({
            action: "TICKET_UPDATED",
            updatedBy: req.userId,

            oldValue: oldTicket,

            newValue: {
                title: ticket.title,
                description: ticket.description,
                ticketPriority: ticket.ticketPriority,
                status: ticket.status,
                assignee: ticket.assignee
            }
        });

        /**
         * Save updated ticket
         */
        const updatedTicket = await ticket.save();

        /**
         * Send notification to reporter and engineer
         */
        try {
            let engineer = null;

            if (updatedTicket.assignee) {
                engineer = await User.findOne({
                    userId: updatedTicket.assignee
                });
            }

            await sendMessageToRedis(
                req,
                engineer,
                updatedTicket
            );

        } catch (err) {
            console.log(
                "Error while sending ticket update notification:",
                err.message
            );
        }

        return res.status(200).send({
            message: "Ticket updated successfully",
            ticket: updatedTicket
        });

    } catch (err) {
        console.log(
            "Error while updating ticket:",
            err.message
        );

        return res.status(500).send({
            message:
                err.message ||
                "Some error occurred while updating the ticket"
        });
    }
};


/**
 * Fetch all tickets
 *
 * Customer -> Only own tickets
 * Engineer -> Only assigned tickets
 * Admin -> All tickets
 *
 * Supports:
 * - status
 * - priority
 * - assignee
 * - title search
 * - date range
 * - pagination
 */
exports.getAllTicket = async (req, res) => {
    try {
        const queryObj = {};

        /**
         * Filter by status
         */
        if (req.query.status) {
            queryObj.status = req.query.status;
        }

        /**
         * Filter by priority
         */
        if (req.query.priority) {
            queryObj.ticketPriority =
                Number(req.query.priority);
        }

        /**
         * Filter by assignee
         */
        if (req.query.assignee) {
            queryObj.assignee = req.query.assignee;
        }

        /**
         * Search by title
         */
        if (req.query.title) {
            queryObj.title = {
                $regex: req.query.title,
                $options: "i"
            };
        }

        /**
         * Date range filter
         */
        if (req.query.fromDate && req.query.toDate) {
            queryObj.createdAt = {
                $gte: new Date(req.query.fromDate),
                $lte: new Date(req.query.toDate)
            };
        }

        /**
         * Find current logged-in user
         */
        const savedUser = await User.findOne({
            userId: req.userId
        });

        if (!savedUser) {
            return res.status(401).send({
                message: "User not found"
            });
        }

        /**
         * Apply role-based filtering
         */
        if (
            savedUser.userType ===
            constants.userType.customer
        ) {
            queryObj.reporter = savedUser.userId;

        } else if (
            savedUser.userType ===
            constants.userType.engineer
        ) {
            queryObj.assignee = savedUser.userId;
        }

        /**
         * Pagination
         */
        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 5;

        const skip = (page - 1) * limit;

        /**
         * Fetch tickets
         */
        const tickets = await Ticket.find(queryObj)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        /**
         * Count tickets
         */
        const totalTickets =
            await Ticket.countDocuments(queryObj);

        return res.status(200).send({
            page: page,
            totalPages:
                Math.ceil(totalTickets / limit) || 1,
            totalTickets: totalTickets,
            tickets: tickets
        });

    } catch (err) {
        console.log(
            "Error while fetching tickets:",
            err.message
        );

        return res.status(500).send({
            message:
                err.message ||
                "Some error occurred while fetching tickets"
        });
    }
};


/**
 * Fetch ticket based on ticket ID
 */
exports.findTicketBasedOnId = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).send({
                message: "Ticket not found"
            });
        }

        /**
         * Get current user
         */
        const savedUser = await User.findOne({
            userId: req.userId
        });

        if (!savedUser) {
            return res.status(401).send({
                message: "User not found"
            });
        }

        /**
         * Admin can access all tickets
         * Reporter can access own ticket
         * Assignee can access assigned ticket
         */
        if (
            savedUser.userType ===
                constants.userType.admin ||
            ticket.reporter === req.userId ||
            ticket.assignee === req.userId
        ) {
            return res.status(200).send(ticket);
        }

        return res.status(403).send({
            message:
                "Can't return the ticket details as you are not authorized"
        });

    } catch (err) {
        console.log(
            "Error while fetching ticket:",
            err.message
        );

        return res.status(500).send({
            message:
                err.message ||
                "Some error occurred while fetching ticket"
        });
    }
};


/**
 * Add a message to Redis queue
 */
const enqueue = async (payload) => {
    const msg = JSON.stringify({
        id: uuidv4(),
        ts: new Date().toISOString(),
        ...payload
    });

    const len = await redisClient.rpush(
        QUEUE_KEY,
        msg
    );

    console.log(
        `[Producer] enqueued -> ${msg} queue length: ${len}`
    );
};


/**
 * Get ticket history
 */
exports.getTicketHistory = async (req, res) => {
    try {
        const ticket = await Ticket.findById(
            req.params.id
        );

        if (!ticket) {
            return res.status(404).send({
                message: "Ticket not found"
            });
        }

        return res.status(200).send(
            ticket.ticketHistory || []
        );

    } catch (err) {
        console.log(
            "Error while fetching ticket history:",
            err.message
        );

        return res.status(500).send({
            message:
                err.message ||
                "Some error occurred while fetching ticket history"
        });
    }
};