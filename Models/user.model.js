const mongoose = require("mongoose");
const constants = require("../utils/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minLength: 7,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minLength: 5,
    },

    // ================= USER ROLE =================
    userType: {
      type: String,
      enum: [
        constants.userType.customer,
        constants.userType.engineer,
        constants.userType.admin,
        constants.userType.superAdmin,
      ],
      required: true,
      default: constants.userType.customer,
    },

    // ================= USER STATUS =================
    userStatus: {
      type: String,
      enum: [
        constants.userStatuses.approved,
        constants.userStatuses.pending,
        constants.userStatuses.blocked,
      ],
      required: true,
      default: constants.userStatuses.approved,
    },

    // ================= MULTI-TENANT COMPANY =================
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    // Future: User can belong to a department
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);