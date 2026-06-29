const express = require("express");
const router = express.Router();
const userController = require("../Controllers/user.controller");
const authMW = require("../middlewares/authjwt");
const verifyUserReqBody = require("../middlewares/verifyUserReqBody");

router.get("/users",[authMW.verifyToken , authMW.isAdmin],userController.findAll);

router.get("/users/:userId",[authMW.verifyToken, authMW.isAdmin],userController.findById);


router.put("/users/:userId",[authMW.verifyToken, authMW.isAdmin,verifyUserReqBody.validateUserStatusAndUserType],userController.updateUser);
module.exports = router;