const Ticket = require("../Models/ticket.model");
const User = require("../Models/user.model");
const constants = require("../utils/constants");

exports.getDashboardStats = async (req, res) => {
  try {
    const currentUser = req.currentUser || await User.findOne({ userId: req.userId });
    if (!currentUser) {
      return res.status(401).send({ success: false, message: "User not found" });
    }

    const ticketScope = {};
    const userScope = {};

    if (currentUser.userType !== constants.userType.superAdmin) {
      if (!currentUser.companyId) {
        return res.status(400).send({
          success: false,
          message: "User is not assigned to a company"
        });
      }

      ticketScope.companyId = currentUser.companyId;
      userScope.companyId = currentUser.companyId;

      if (currentUser.userType === constants.userType.engineer) {
        ticketScope.assignee = currentUser.userId;
      } else if (currentUser.userType === constants.userType.customer) {
        ticketScope.reporter = currentUser.userId;
      }
    }

    const [
      totalTickets,
      openTickets,
      closedTickets,
      inProgressTickets,
      highPriorityTickets,
      totalUsers,
      customers,
      engineers,
      admins,
      recentTickets,
      priorityBreakdown
    ] = await Promise.all([
      Ticket.countDocuments(ticketScope),
      Ticket.countDocuments({ ...ticketScope, status: constants.ticketStatuses.open }),
      Ticket.countDocuments({ ...ticketScope, status: constants.ticketStatuses.closed }),
      Ticket.countDocuments({ ...ticketScope, status: constants.ticketStatuses.inProgress }),
      Ticket.countDocuments({ ...ticketScope, ticketPriority: 1 }),
      User.countDocuments(userScope),
      User.countDocuments({ ...userScope, userType: constants.userType.customer }),
      User.countDocuments({ ...userScope, userType: constants.userType.engineer }),
      User.countDocuments({ ...userScope, userType: constants.userType.admin }),
      Ticket.find(ticketScope)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title status ticketPriority reporter assignee createdAt"),
      Ticket.aggregate([
        { $match: ticketScope },
        { $group: { _id: "$ticketPriority", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const priority = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    priorityBreakdown.forEach((item) => {
      if (item._id >= 1 && item._id <= 5) priority[item._id] = item.count;
    });

    return res.status(200).send({
      success: true,
      scope:
        currentUser.userType === constants.userType.superAdmin
          ? "PLATFORM"
          : currentUser.userType === constants.userType.admin
            ? "COMPANY"
            : currentUser.userType === constants.userType.engineer
              ? "ASSIGNED_TICKETS"
              : "MY_TICKETS",
      stats: {
        totalTickets,
        openTickets,
        closedTickets,
        inProgressTickets,
        highPriorityTickets,
        totalUsers,
        customers,
        engineers,
        admins
      },
      priorityBreakdown: priority,
      recentTickets
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).send({
      success: false,
      message: err.message || "Unable to load dashboard analytics"
    });
  }
};
