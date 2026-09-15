const mongoose = require("mongoose");
const Ticket = require("../Models/ticket.model");

const loadTicket = async (req, res, next) => {
  const { ticketId } = req.params;
  if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
    return res.status(400).send({ message: "Invalid ticket id" });
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) return res.status(404).send({ message: "Ticket not found" });

  req.ticket = ticket;
  next();
};

const validateCommentRequestBody = async (req, res, next) => {
  try {
    const content = String(req.body.content || "").trim();
    if (!content) return res.status(400).send({ message: "Comment cannot be empty" });
    if (content.length > 2000) return res.status(400).send({ message: "Comment cannot exceed 2000 characters" });
    req.body.content = content;
    return loadTicket(req, res, next);
  } catch (err) {
    return res.status(500).send({ message: "Unable to validate comment request" });
  }
};

const validateTicketId = async (req, res, next) => {
  try {
    return loadTicket(req, res, next);
  } catch (err) {
    return res.status(500).send({ message: "Unable to validate ticket" });
  }
};

module.exports = { validateCommentRequestBody, validateTicketId };
