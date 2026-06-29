const mongoose = require("mongoose");
const constants = require("../utils/constants");
const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    userId : {
        
          type : String,
          required : true,
          unique : true
    },
    password : {
        type : String,
        required : true,
        minLength : 7
         
    },
     email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        minLength : 5
         
    },
    userType :{
        type : String,
        enum : [constants.userType.customer, constants.userType.admin, constants.userType.engineer],
        required : true,
        default : constants.userType.customer

    },
    userStatus : {
        type : String,
        enum : [constants.userStatuses.approved, constants.userStatuses.pending, constants.userStatuses.blocked],
        required : true,
        default : constants.userStatuses.approved

    }
}, {timestamps : true});

// module.exports = mongoose.model("User", userSchema);
module.exports =
    mongoose.models.User ||
    mongoose.model("User", userSchema);