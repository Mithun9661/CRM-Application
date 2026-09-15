const express = require("express");
const router = express.Router();
const authController = require("../Controllers/auth.controller");
const verifyUserReqBody = require("../middlewares/verifyUserReqBody");

router.post("/auth/signup", [verifyUserReqBody.validateUserReqBody], authController.signup);
router.post("/auth/signin", authController.signin);
router.get("/", (req, res) => res.send("Auth Route Working"));

module.exports = router;
