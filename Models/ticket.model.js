const mongoose = require("mongoose");
const constants = require("../utils/constants");

const ticketSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    ticketPriority: { type: Number, required: true, default: 4 },
    description: { type: String, required: true, trim: true },
    status: { type: String, required: true, default: constants.ticketStatuses.open },
    reporter: { type: String, required: true },
    assignee: { type: String },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        default: null,
        index: true
    },
    ticketHistory: [{
        action: String,
        updatedBy: String,
        oldValue: Object,
        newValue: Object,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
