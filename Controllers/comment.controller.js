const Comment = require("../Models/comment.model");
const User = require("../Models/user.model");
const Ticket = require("../Models/ticket.model");
const constants = require("../utils/constants");

const sameCompany = (a, b) => String(a || "") === String(b || "");

const canAccessTicket = (user, ticket) => {
  if (user.userType === constants.userType.superAdmin) return true;
  if (!sameCompany(user.companyId, ticket.companyId)) return false;
  if (user.userType === constants.userType.admin) return true;
  if (user.userType === constants.userType.engineer) return ticket.assignee === user.userId;
  return ticket.reporter === user.userId;
};

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
