const Ticket = require("../Models/ticket.model");

const validateCommentRequestBody = async(req,res,next) =>{

    //Validate if the ticketId is present
    if(!req.params.ticketId){
        return res.status(400).send({
            message : "Failed ! Ticket id is not present in the path param"
        })
    }
    //Need to check if it's a valid ticket
    const ticket = await Ticket.findOne({
        _id : req.params.ticketId
    })

    if(!ticket){
        return res.ststus(400).send({
            message : "Failed ! Ticket id passed is not valid"
        });
    }

    //Validation of content - It can't be empty
    if(!req.body.content){
        return res.status(400).send({
            message : "Failed ! Content of the comment can't be empty"

        });
    
    }
    next();
}

const validateTicketId = async(req,res,next) =>{

    //Need to check if it's a valid ticket
    const ticket = await Ticket.findOne({
        _id : req.params.ticketId
    })

    if(!ticket){
        return res.ststus(400).send({
            message : "Failed ! Ticket id passed is not valid"
        });
    }
    next();
}

module.exports = {
    validateCommentRequestBody : validateCommentRequestBody,
    validateTicketId : validateTicketId
}