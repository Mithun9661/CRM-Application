const User = require("../Models/user.model");
const constants = require("../utils/constants");
const Ticket = require("../Models/ticket.model");
const { randomUUID: uuidv4 } = require("crypto");
const { createRedis } = require("../utils/redisClient");
const { notifyUsers } = require("../utils/notificationService");
const redisClient = createRedis();
const dotenv = require("dotenv");
dotenv.config();

const QUEUE_KEY = process.env.QUEUE_KEY || "queue:notifications";

const sameCompany = (a, b) => String(a || "") === String(b || "");
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const enqueue = async (payload) => {
    if (!redisClient) return;
    const msg = JSON.stringify({ id: uuidv4(), ts: new Date().toISOString(), ...payload });
    await redisClient.rpush(QUEUE_KEY, msg);
};

const sendMessageToRedis = async (req, engineer, ticket) => {
    if (!redisClient) return;
    const emailList = [];
    try {
        const user = await User.findOne({ userId: req.userId });
        if (user?.email) emailList.push(user.email);
    } catch (err) {
        console.log("Error while fetching user for notification:", err.message);
    }
    if (engineer?.email) emailList.push(engineer.email);
    const ticketLink = process.env.BASE_URL || "http://127.0.0.1:7777";
    try {
        await enqueue({ emailList, ticketLink: `${ticketLink}/crm/api/v1/tickets/${ticket._id}` });
    } catch (err) {
        console.log("Error while passing message to Redis:", err.message);
    }
};

const getCurrentUser = (userId) => User.findOne({ userId });

const canAccessTicket = (user, ticket) => {
    if (user.userType === constants.userType.superAdmin) return true;
    if (!sameCompany(user.companyId, ticket.companyId)) return false;
    if (user.userType === constants.userType.admin) return true;
    if (user.userType === constants.userType.engineer) return ticket.assignee === user.userId;
    return ticket.reporter === user.userId;
};

const validatePriority = (value) => {
    const priority = Number(value);
    return Number.isInteger(priority) && priority >= 1 && priority <= 5 ? priority : null;
};

exports.createTicket = async (req, res) => {
    try {
        const user = await getCurrentUser(req.userId);
        if (!user) return res.status(401).send({ message: "User not found" });
        if (user.userType !== constants.userType.superAdmin && !user.companyId) {
            return res.status(400).send({ message: "User is not assigned to a company" });
        }

        const priority = validatePriority(req.body.ticketPriority ?? 4);
        if (!priority) return res.status(400).send({ message: "Ticket priority must be between 1 and 5" });

        const privilegedCreator = [
            constants.userType.engineer,
            constants.userType.admin,
            constants.userType.superAdmin
        ].includes(user.userType);
        const requestedStatus = privilegedCreator && req.body.status
            ? req.body.status
            : constants.ticketStatuses.open;

        if (!Object.values(constants.ticketStatuses).includes(requestedStatus)) {
            return res.status(400).send({ message: "Invalid ticket status" });
        }

        const ticketObj = {
            title: String(req.body.title || "").trim(),
            ticketPriority: priority,
            description: String(req.body.description || "").trim(),
            status: requestedStatus,
            reporter: user.userId,
            companyId: user.companyId || null
        };

        ticketObj.ticketHistory = [{
            action: "TICKET_CREATED",
            updatedBy: user.userId,
            newValue: {
                title: ticketObj.title,
                description: ticketObj.description,
                ticketPriority: ticketObj.ticketPriority,
                status: ticketObj.status
            }
        }];

        const engineerQuery = {
            userType: constants.userType.engineer,
            userStatus: constants.userStatuses.approved
        };
        if (user.companyId) engineerQuery.companyId = user.companyId;
        const engineer = await User.findOne(engineerQuery);
        if (engineer) ticketObj.assignee = engineer.userId;

        const ticket = await Ticket.create(ticketObj);

        if (engineer && engineer.userId !== user.userId) {
            await notifyUsers({
                recipients: [engineer.userId],
                companyId: ticket.companyId,
                ticketId: ticket._id,
                type: "TICKET_ASSIGNED",
                title: "New ticket assigned",
                message: `${ticket.title} has been assigned to you.`,
                createdBy: user.userId
            });
        }

        await sendMessageToRedis(req, engineer, ticket);
        return res.status(201).send(ticket);
    } catch (err) {
        console.log("Error while creating ticket:", err.message);
        return res.status(500).send({ message: err.message || "Some error occurred while creating the ticket" });
    }
};

exports.updateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).send({ message: "Ticket not found" });
        const user = await getCurrentUser(req.userId);
        if (!user) return res.status(401).send({ message: "User not found or unauthorized" });
        if (!canAccessTicket(user, ticket)) return res.status(403).send({ message: "You are not authorized to update this ticket" });

        if (
            user.userType === constants.userType.customer &&
            (req.body.status !== undefined || req.body.ticketPriority !== undefined || req.body.assignee !== undefined)
        ) {
            return res.status(403).send({ message: "Customers cannot change ticket status, priority or assignment" });
        }

        const oldTicket = {
            title: ticket.title,
            description: ticket.description,
            ticketPriority: ticket.ticketPriority,
            status: ticket.status,
            assignee: ticket.assignee
        };

        if (req.body.title !== undefined) ticket.title = String(req.body.title).trim();
        if (req.body.description !== undefined) ticket.description = String(req.body.description).trim();
        if (req.body.ticketPriority !== undefined) {
            const priority = validatePriority(req.body.ticketPriority);
            if (!priority) return res.status(400).send({ message: "Ticket priority must be between 1 and 5" });
            ticket.ticketPriority = priority;
        }
        if (req.body.status !== undefined) {
            if (!Object.values(constants.ticketStatuses).includes(req.body.status)) {
                return res.status(400).send({ message: "Invalid ticket status" });
            }
            ticket.status = req.body.status;
        }

        if (req.body.assignee !== undefined) {
            if (![constants.userType.admin, constants.userType.superAdmin].includes(user.userType)) {
                return res.status(403).send({ message: "Only admin can reassign tickets" });
            }
            if (req.body.assignee) {
                const assignee = await User.findOne({
                    userId: req.body.assignee,
                    userType: constants.userType.engineer,
                    userStatus: constants.userStatuses.approved
                });
                if (!assignee || !sameCompany(assignee.companyId, ticket.companyId)) {
                    return res.status(400).send({ message: "Assignee must be an approved engineer from the same company" });
                }
            }
            ticket.assignee = req.body.assignee;
        }

        ticket.ticketHistory.push({
            action: "TICKET_UPDATED",
            updatedBy: user.userId,
            oldValue: oldTicket,
            newValue: {
                title: ticket.title,
                description: ticket.description,
                ticketPriority: ticket.ticketPriority,
                status: ticket.status,
                assignee: ticket.assignee
            }
        });

        const updatedTicket = await ticket.save();
        const engineer = updatedTicket.assignee
            ? await User.findOne({ userId: updatedTicket.assignee })
            : null;

        const assigneeChanged = oldTicket.assignee !== updatedTicket.assignee;
        const statusChanged = oldTicket.status !== updatedTicket.status;
        const recipients = [updatedTicket.reporter, updatedTicket.assignee].filter(
            (recipient) => recipient && recipient !== user.userId
        );

        if (recipients.length) {
            await notifyUsers({
                recipients,
                companyId: updatedTicket.companyId,
                ticketId: updatedTicket._id,
                type: assigneeChanged ? "TICKET_ASSIGNED" : "TICKET_UPDATED",
                title: assigneeChanged ? "Ticket assignment updated" : "Ticket updated",
                message: assigneeChanged
                    ? `${updatedTicket.title} is now assigned to ${updatedTicket.assignee || "no engineer"}.`
                    : statusChanged
                        ? `${updatedTicket.title} moved to ${updatedTicket.status.replace("_", " ")}.`
                        : `${updatedTicket.title} was updated.`,
                createdBy: user.userId
            });
        }

        await sendMessageToRedis(req, engineer, updatedTicket);
        return res.status(200).send({ message: "Ticket updated successfully", ticket: updatedTicket });
    } catch (err) {
        console.log("Error while updating ticket:", err.message);
        return res.status(500).send({ message: err.message || "Some error occurred while updating the ticket" });
    }
};

exports.getAllTicket = async (req, res) => {
    try {
        const user = await getCurrentUser(req.userId);
        if (!user) return res.status(401).send({ message: "User not found" });
        const queryObj = {};

        if (user.userType !== constants.userType.superAdmin) queryObj.companyId = user.companyId;
        if (user.userType === constants.userType.customer) queryObj.reporter = user.userId;
        else if (user.userType === constants.userType.engineer) queryObj.assignee = user.userId;

        if (req.query.status) {
            if (!Object.values(constants.ticketStatuses).includes(req.query.status)) {
                return res.status(400).send({ message: "Invalid ticket status filter" });
            }
            queryObj.status = req.query.status;
        }

        if (req.query.priority) {
            const priority = validatePriority(req.query.priority);
            if (!priority) return res.status(400).send({ message: "Priority filter must be between 1 and 5" });
            queryObj.ticketPriority = priority;
        }

        if (
            req.query.assignee &&
            [constants.userType.admin, constants.userType.superAdmin].includes(user.userType)
        ) {
            queryObj.assignee = String(req.query.assignee).trim();
        }

        const searchText = String(req.query.search || req.query.title || "").trim();
        if (searchText) {
            const safeSearch = escapeRegex(searchText.slice(0, 100));
            queryObj.$or = [
                { title: { $regex: safeSearch, $options: "i" } },
                { description: { $regex: safeSearch, $options: "i" } },
                { reporter: { $regex: safeSearch, $options: "i" } },
                { assignee: { $regex: safeSearch, $options: "i" } }
            ];
        }

        const dateFilter = {};
        if (req.query.fromDate) {
            const fromDate = new Date(req.query.fromDate);
            if (Number.isNaN(fromDate.getTime())) return res.status(400).send({ message: "Invalid fromDate" });
            dateFilter.$gte = fromDate;
        }
        if (req.query.toDate) {
            const toDate = new Date(req.query.toDate);
            if (Number.isNaN(toDate.getTime())) return res.status(400).send({ message: "Invalid toDate" });
            toDate.setHours(23, 59, 59, 999);
            dateFilter.$lte = toDate;
        }
        if (Object.keys(dateFilter).length) queryObj.createdAt = dateFilter;

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const sort = req.query.sort === "oldest"
            ? { createdAt: 1 }
            : req.query.sort === "priority"
                ? { ticketPriority: 1, createdAt: -1 }
                : { createdAt: -1 };

        const [totalTickets, tickets] = await Promise.all([
            Ticket.countDocuments(queryObj),
            Ticket.find(queryObj)
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(limit)
        ]);

        return res.status(200).send({
            page,
            limit,
            totalPages: Math.max(Math.ceil(totalTickets / limit), 1),
            totalTickets,
            tickets
        });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Some error occurred while fetching tickets" });
    }
};

exports.findTicketBasedOnId = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).send({ message: "Ticket not found" });
        const user = await getCurrentUser(req.userId);
        if (!user) return res.status(401).send({ message: "User not found" });
        if (!canAccessTicket(user, ticket)) return res.status(403).send({ message: "You are not authorized to access this ticket" });
        return res.status(200).send(ticket);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Some error occurred while fetching ticket" });
    }
};

exports.getTicketHistory = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).send({ message: "Ticket not found" });
        const user = await getCurrentUser(req.userId);
        if (!user) return res.status(401).send({ message: "User not found" });
        if (!canAccessTicket(user, ticket)) return res.status(403).send({ message: "You are not authorized to access this ticket history" });
        return res.status(200).send(ticket.ticketHistory || []);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Some error occurred while fetching ticket history" });
    }
};
