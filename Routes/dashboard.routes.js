const express = require("express");
const router = express.Router();

const dashboardController = require("../Controllers/dashboard.controller");
const authMW = require("../middlewares/authjwt");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard APIs
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get tenant-aware CRM dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully
 */
router.get(
  "/dashboard",
  [authMW.verifyToken, authMW.isAdminOrSuperAdmin],
  dashboardController.getDashboardStats
);

module.exports = router;
