const express = require("express");
const router = express.Router();

const ticketController = require("../Controllers/ticket.controller");
const authMW = require("../middlewares/authjwt");

const commentMW = require("../middlewares/verifyCommentReqBody");
const verifyTicketReqBody = require("../middlewares/verifyTicketRequestBody");
const commentController = require("../Controllers/comment.controller");

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket Management APIs
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: apiKey
 *       in: header
 *       name: x-access-token
 */

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Create a new ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - ticketPriority
 *             properties:
 *               title:
 *                 type: string
 *                 example: Login Issue
 *               description:
 *                 type: string
 *                 example: Unable to login into CRM
 *               ticketPriority:
 *                 type: integer
 *                 example: 4
 *               status:
 *                 type: string
 *                 example: OPEN
 *     responses:
 *       201:
 *         description: Ticket created successfully
 */
router.post(
  "/tickets",
  [authMW.verifyToken, verifyTicketReqBody.validateTicketReqBody],
  ticketController.createTicket
);

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Get all tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tickets
 */
router.get(
  "/tickets",
  [authMW.verifyToken],
  ticketController.getAllTicket
);

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket details
 */
router.get(
  "/tickets/:id",
  [authMW.verifyToken],
  ticketController.findTicketBasedOnId
);

/**
 * @swagger
 * /tickets/{id}:
 *   put:
 *     summary: Update ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket updated successfully
 */
router.put(
  "/tickets/:id",
  [authMW.verifyToken],
  ticketController.updateTicket
);

/**
 * @swagger
 * /tickets/{ticketId}/comments:
 *   post:
 *     summary: Add comment to a ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 */
router.post(
  "/tickets/:ticketId/comments",
  [authMW.verifyToken, commentMW.validateCommentRequestBody],
  commentController.createComment
);

/**
 * @swagger
 * /tickets/{ticketId}/comments:
 *   get:
 *     summary: Get all comments of a ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get(
  "/tickets/:ticketId/comments",
  [authMW.verifyToken, commentMW.validateTicketId],
  commentController.fetchComments
);

/**
 * @swagger
 * /tickets/{id}/history:
 *   get:
 *     summary: Get ticket history
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket history fetched successfully
 */
router.get(
  "/tickets/:id/history",
  [authMW.verifyToken],
  ticketController.getTicketHistory
);

module.exports = router;

