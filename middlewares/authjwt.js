const jwt = require("jsonwebtoken");
const config = require("../configs/auth.config");
const User = require("../Models/user.model");
const constants = require("../utils/constants");

const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(403).send({ message: "No Access token Passed!" });

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) return res.status(401).send({ message: "Unauthorized! Invalid token!" });
    req.userId = decoded.id;
    next();
  });
};

const roleGuard = (...roles) => async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.userId });
    if (!user) return res.status(404).send({ message: "User not found" });
    if (!roles.includes(user.userType)) return res.status(403).send({ message: "You are not authorized to access this API" });
    req.currentUser = user;
    next();
  } catch (err) {
    return res.status(500).send({ message: "Internal server error during authorization" });
  }
};

const isAdmin = roleGuard(constants.userType.admin);
const isAdminOrSuperAdmin = roleGuard(constants.userType.admin, constants.userType.superAdmin);
const isSuperAdmin = roleGuard(constants.userType.superAdmin);

module.exports = { verifyToken, isAdmin, isAdminOrSuperAdmin, isSuperAdmin };
