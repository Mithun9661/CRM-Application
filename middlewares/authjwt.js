const jwt = require("jsonwebtoken");
const config = require("../configs/auth.config");
const User = require("../Models/user.model");
const constants = require("../utils/constants");

// ================= VERIFY JWT TOKEN =================
const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  // Swagger / Bearer Token support
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(403).send({
      message: "No Access token Passed!",
    });
  }

  // Verification of JWT Token
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized! Invalid token!",
      });
    }

    req.userId = decoded.id;
    next();
  });
};

// ================= ADMIN ROLE CHECK =================
const isAdmin = async (req, res, next) => {
  try {
    // Find user based on userId set by verifyToken middleware
    const user = await User.findOne({
      userId: req.userId,
    });

    if (!user) {
      return res.status(404).send({
        message: "User not found",
      });
    }

    if (user.userType === constants.userType.admin) {
      return next();
    }

    return res.status(403).send({
      message: "Only Admin role is allowed to access this API!",
    });
  } catch (err) {
    console.error("Admin authorization error:", err.message);

    return res.status(500).send({
      message: "Internal server error during authorization",
    });
  }
};

// ================= SUPER ADMIN ROLE CHECK =================
const isSuperAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({
      userId: req.userId,
    });

    if (!user) {
      return res.status(404).send({
        message: "User not found",
      });
    }

    if (user.userType === constants.userType.superAdmin) {
      return next();
    }

    return res.status(403).send({
      message: "Only Super Admin role is allowed to access this API!",
    });
  } catch (err) {
    console.error("Super Admin authorization error:", err.message);

    return res.status(500).send({
      message: "Internal server error during authorization",
    });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isSuperAdmin,
};