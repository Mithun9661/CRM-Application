const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    content : {
        type : String,
        required : true
    },
    ticketId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Ticket",
        required : true
    },
    commenterId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    }
},{timestamps : true});

module.exports = mongoose.model("Comment", commentSchema);