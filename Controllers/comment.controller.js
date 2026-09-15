const Comment = require("../Models/comment.model");
const User = require("../Models/user.model");
const Ticket = require("../Models/ticket.model");
const { notifyUsers } = require("../utils/notificationService");
const { canAccessTicket } = require("../utils/ticketAccess");

exports.createComment = async (req, res) => {
  try {
    const loggedInUser = await User.findOne({ userId: req.userId });
    if (!loggedInUser) return res.status(401).send({ message: "User not found" });

    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).send({ message: "Ticket not found" });
    if (!canAccessTicket(loggedInUser, ticket)) {
      return res.status(403).send({ message: "You are not authorized to comment on this ticket" });
    }

    const content = String(req.body.content || "").trim();
    if (!content) return res.status(400).send({ message: "Comment cannot be empty" });
    if (content.length > 2000) return res.status(400).send({ message: "Comment cannot exceed 2000 characters" });

    const createdComment = await Comment.create({
      content,
      ticketId: ticket._id,
      commenterId: loggedInUser._id
    });

    ticket.ticketHistory.push({
      action: "COMMENT_ADDED",
      updatedBy: loggedInUser.userId,
      newValue: { content }
    });
    await ticket.save();

    const recipients = [ticket.reporter, ticket.assignee].filter(
      (recipient) => recipient && recipient !== loggedInUser.userId
    );

    await notifyUsers({
      recipients,
      companyId: ticket.companyId,
      ticketId: ticket._id,
      type: "COMMENT_ADDED",
      title: "New ticket comment",
      message: `${loggedInUser.name || loggedInUser.userId} commented on ${ticket.title}.`,
      createdBy: loggedInUser.userId
    });

    const populated = await Comment.findById(createdComment._id).populate(
      "commenterId",
      "name userId userType"
    );

    return res.status(201).send(populated);
  } catch (err) {
    console.log("Error while creating comment:", err.message);
    return res.status(500).send({ message: err.message || "Some internal server error" });
  }
};

exports.fetchComments = async (req, res) => {
  try {
    const loggedInUser = await User.findOne({ userId: req.userId });
    if (!loggedInUser) return res.status(401).send({ message: "User not found" });

    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).send({ message: "Ticket not found" });
    if (!canAccessTicket(loggedInUser, ticket)) {
      return res.status(403).send({ message: "You are not authorized to view comments on this ticket" });
    }

    const comments = await Comment.find({ ticketId: ticket._id })
      .sort({ createdAt: 1 })
      .populate("commenterId", "name userId userType");

    return res.status(200).send(comments);
  } catch (err) {
    console.log("Error while fetching comments:", err.message);
    return res.status(500).send({ message: err.message || "Some internal server error" });
  }
};
