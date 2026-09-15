const express = require("express");
const router = express.Router();
const userController = require("../Controllers/user.controller");
const authMW = require("../middlewares/authjwt");
const verifyUserReqBody = require("../middlewares/verifyUserReqBody");

const adminAccess = [authMW.verifyToken, authMW.isAdminOrSuperAdmin];

router.get("/users", adminAccess, userController.findAll);
router.get("/users/:userId", adminAccess, userController.findById);
router.put(
  "/users/:userId",
  [authMW.verifyToken, authMW.isAdminOrSuperAdmin, verifyUserReqBody.validateUserStatusAndUserType],
  userController.updateUser
);

module.exports = router;
