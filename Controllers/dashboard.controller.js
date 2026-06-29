const Ticket = require("../Models/ticket.model");

exports.getDashboardStats = async (req, res) => {
    try {

        const totalTickets = await Ticket.countDocuments();

        const openTickets = await Ticket.countDocuments({
            status: "OPEN"
        });

        const closedTickets = await Ticket.countDocuments({
            status: "CLOSED"
        });

        const inProgressTickets = await Ticket.countDocuments({
            status: "IN_PROGRESS"
        });

        const highPriorityTickets = await Ticket.countDocuments({
            ticketPriority: 1
        });

        const recentTickets = await Ticket.find()
            .sort({ createdAt: -1 })
            .limit(5);

        return res.status(200).send({
            success: true,
            stats: {
                totalTickets,
                openTickets,
                closedTickets,
                inProgressTickets,
                highPriorityTickets
            },
            recentTickets
        });

    } catch (err) {

        console.error("Dashboard Error:", err);

        return res.status(500).send({
            success: false,
            message: err.message
        });

    }
};