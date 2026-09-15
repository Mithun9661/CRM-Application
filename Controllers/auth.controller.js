const bcrypt = require("bcryptjs");
const User = require("../Models/user.model");
const Company = require("../Models/company.model");
const constants = require("../utils/constants");
const jwt = require("jsonwebtoken");
const config = require("../configs/auth.config");

exports.signup = async (req, res) => {
  try {
    const requestedType = req.body.userType || constants.userType.customer;
    if (requestedType === constants.userType.superAdmin) {
      return res.status(403).send({ message: "Super Admin cannot be created through public signup" });
    }

    let company = null;
    if (req.body.companyCode) {
      company = await Company.findOne({ companyCode: String(req.body.companyCode).trim().toUpperCase(), status: "ACTIVE" });
      if (!company) return res.status(400).send({ message: "Invalid or inactive company code" });
    }

    // Public registrations must belong to an existing company.
    if (!company) {
      return res.status(400).send({ message: "Company code is required for registration" });
    }

    // Customers can start immediately; privileged roles require company admin approval.
    const userStatus = requestedType === constants.userType.customer
      ? constants.userStatuses.approved
      : constants.userStatuses.pending;

    const userCreated = await User.create({
      name: req.body.name,
      userId: req.body.userId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      userType: requestedType,
      userStatus,
      companyId: company._id
    });

    return res.status(201).send({
      name: userCreated.name,
      userId: userCreated.userId,
      email: userCreated.email,
      userType: userCreated.userType,
      userStatus: userCreated.userStatus,
      companyId: userCreated.companyId,
      companyName: company.companyName,
      createdAt: userCreated.createdAt
    });
  } catch (err) {
    console.log("Error while creating user", err.message);
    return res.status(500).send({ message: err.message || "Some internal error while creating the user" });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.body.userId }).populate("companyId", "companyName companyCode status");
    if (!user) return res.status(400).send({ message: `User Id passed: ${req.body.userId} is not correct` });
    if (user.userStatus !== constants.userStatuses.approved) {
      return res.status(403).send({ message: `Login not allowed. Current user status is ${user.userStatus}` });
    }
    if (user.companyId && user.companyId.status !== "ACTIVE") {
      return res.status(403).send({ message: "Your company account is not active" });
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) return res.status(401).send({ accessToken: null, message: "Invalid Password! Please try again!" });

    const token = jwt.sign({ id: user.userId }, config.secret, { expiresIn: "24h" });
    return res.status(200).send({
      name: user.name,
      userId: user.userId,
      email: user.email,
      userType: user.userType,
      userStatus: user.userStatus,
      companyId: user.companyId?._id || null,
      companyName: user.companyId?.companyName || null,
      accessToken: token
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Internal error during sign in" });
  }
};
