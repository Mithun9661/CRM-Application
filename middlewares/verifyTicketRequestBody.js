const validateTicketReqBody = (req,res,next)=>{

    if(!req.body){
        return res.status(400).send({
            message:"Request body missing"
        });
    }

    if(!req.body.title){
        return res.status(400).send({
            message:"Title is required"
        });
    }

    if(!req.body.description){
        return res.status(400).send({
            message:"Description is required"
        });
    }

    next();
}
const validateTicketStatus = (req,res,next) =>{
    const status = req.body.status;

    const statusType = [constants.ticketStatuses.open,constants.ticketStatuses.closed,constants.ticketStatuses.blocked];
    if(status && !statusType.includes(status)){
        return res.status(400).send({
            message : "Status passed is not correct !"
        })
    }
    next();
}

module.exports = {
    validateTicketReqBody : validateTicketReqBody,
    validateTicketStatus : validateTicketStatus
}