const express = require("express");
const router = express.Router();
const authMW = require("../middlewares/authjwt");
const notificationController = require("../Controllers/notification.controller");

router.get(
  "/notifications",
  [authMW.verifyToken],
  notificationController.getMyNotifications
);

router.patch(
  "/notifications/:id/read",
  [authMW.verifyToken],
  notificationController.markNotificationRead
);

router.patch(
  "/notifications/read-all",
  [authMW.verifyToken],
  notificationController.markAllRead
);

module.exports = router;
