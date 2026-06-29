const mongoose = require("mongoose");
const constants = require("../utils/constants");


const ticketSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true
    },
    ticketPriority : {
        type : Number,
        required : true,
        default : 4
    },
    description : {
        type : String,
        required : true
    },
    status : {
        type : String,
        required : true,
        default : constants.ticketStatuses.open
    },
    reporter : {  //We will be used the userId
        type : String,
        required : true
    },
    assignee : {
        type : String,
    },
    ticketHistory: [
        {
            action: String,
            updatedBy: String,
            oldValue: Object,
            newValue: Object,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]


},{timestamps : true});

module.exports = mongoose.model("Ticket" , ticketSchema);
