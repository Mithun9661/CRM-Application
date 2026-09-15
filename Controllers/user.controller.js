const objectConverter = require("../utils/objectConverter");
const User = require("../Models/user.model");
const constants = require("../utils/constants");

const sameCompany = (a, b) => String(a || "") === String(b || "");

exports.findAll = async (req, res) => {
  try {
    const currentUser = req.currentUser || await User.findOne({ userId: req.userId });
    if (!currentUser) return res.status(401).send({ message: "User not found" });

    const queryObj = {};
    if (currentUser.userType !== constants.userType.superAdmin) queryObj.companyId = currentUser.companyId;
    if (req.query.userType) queryObj.userType = req.query.userType;
    if (req.query.userStatus) queryObj.userStatus = req.query.userStatus;

    const users = await User.find(queryObj).sort({ createdAt: -1 });
    return res.status(200).send(objectConverter.userResponse(users));
  } catch (err) {
    return res.status(500).send({ message: "Error while fetching users" });
  }
};

exports.findById = async (req, res) => {
  try {
    const currentUser = req.currentUser || await User.findOne({ userId: req.userId });
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).send({ message: "User with the given id not present" });

    if (currentUser.userType !== constants.userType.superAdmin && !sameCompany(currentUser.companyId, user.companyId)) {
      return res.status(403).send({ message: "You cannot access users from another company" });
    }
    return res.status(200).send(objectConverter.userResponse([user]));
  } catch (err) {
    return res.status(500).send({ message: "Error while fetching user" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const currentUser = req.currentUser || await User.findOne({ userId: req.userId });
    const target = await User.findOne({ userId: req.params.userId });
    if (!target) return res.status(404).send({ message: "User not found" });

    if (currentUser.userType !== constants.userType.superAdmin && !sameCompany(currentUser.companyId, target.companyId)) {
      return res.status(403).send({ message: "You cannot update users from another company" });
    }
    if (currentUser.userType !== constants.userType.superAdmin && req.body.userType === constants.userType.superAdmin) {
      return res.status(403).send({ message: "Company admin cannot create or promote a Super Admin" });
    }

    if (req.body.name !== undefined) target.name = req.body.name;
    if (req.body.userStatus !== undefined) target.userStatus = req.body.userStatus;
    if (req.body.userType !== undefined) target.userType = req.body.userType;

    if (currentUser.userType === constants.userType.superAdmin && req.body.companyId !== undefined) {
      target.companyId = req.body.companyId || null;
    }

    await target.save();
    return res.status(200).send({ message: "User record has been successfully updated" });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Some internal error while updating the user record" });
  }
};
