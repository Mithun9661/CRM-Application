const User = require("../Models/user.model");
const constants = require("../utils/constants");
const Ticket = require("../Models/ticket.model");

const {randomUUID: uuidv4} = require("crypto");
const {createRedis} = require("../utils/redisClient");
const redisClient = createRedis();

const dotenv =require('dotenv');
dotenv.config();

const QUEUE_KEY = process.env.QUEUE_KEY || 'queue:notifications';

/**
 * Define the controller  to create a new ticket.

 * As soon as a ticket is created , it should be auto assigned to an Engineer.
if available
*/

const sendMessageToRedis = async (req,engineer,ticket)=>{
    // We need send the ticket message to thr Redis queue

            /**
             * 1.Locator or the end point for fetching the new ticket
             * 2. Need to  send the list of email ids : a. User b. Assigned Engineer
             */


            const emailList = [];

            try{
                //We are trying to get the user obj
                const user = await User.findOne({userId : req.userId});
                emailList.push(user.email);

            }catch(err){
                console.log("Error while fetching the user object",err.message);
            }

            if(engineer?.email){
                emailList.push(engineer.email);
            }
            /**
             * Create the message that needs to be sent to the Redis queue
             */
            const ticketLink = process.env.BASE_URL||'127.0.0.1:7777/';
            const message = {
                emailList : emailList,
                ticketLink :  `${ticketLink}/crm/api/v1/tickets/${ticket._id}`
            }
            try{
                await enqueue(message);
                console.log("Message passed to Redis");

            }catch(err){
                console.log("Error while passing the message to Redis",err.message);
            }

    
   
}
exports.createTicket = async(req,res) => {

    console.log("BODY =", req.body);
    console.log("USER =", req.userId);

    const ticketObj = {
        title : req.body.title,
        ticketPriority : req.body.ticketPriority,
        description : req.body.description,
        status : req.body.status,
        reporter : req.userId
    };
    ticketObj.ticketHistory = [
        {
            action: "TICKET_CREATED",
            updatedBy: req.userId,
            newValue: {
                title: ticketObj.title,
                status: ticketObj.status
            }
        }
    ];

   //Create the ticket-Auto assign to the Eng if available
    const engineer = await User.findOne({
        userType : constants.userType.engineer,
        userStatus : constants.userStatuses.approved
        });
        if(engineer){
            ticketObj.assignee = engineer.userId;
    }
    try{
        const ticket = await Ticket.create(ticketObj);
        if(ticket){
           await sendMessageToRedis(req,engineer,ticket);
        return res.status(201).send(ticket);
        return
    }
    }catch(err){
        console.log("Error while creating the ticket", err.message);
        return res.status(500).send({
            message : err.message || "Some error occurred while creating the ticket"
        })
    }
}

/**
 * Controller for updating the tickets
 */


exports.updateTicket = async(req,res) => {
    const ticket = await Ticket.findOne({
        _id : req.params.id
    });

    //Which user is making the call
    const callingUserDetails = await User.findOne({userId : req.userId});
    //I want to check if the right user is trying to update the ticket
    /**
     * Calling user is the filer of the ticket
     * Engineer
     * Admin
     */
    // console.log(ticket);

    // console.log(ticket.reporter);
    // console.log(req.userId);
    

    if(ticket.reporter == req.userId || callingUserDetails.userType == constants.userType.engineer
        ||callingUserDetails.userType == constants.userType.admin
    ){
        //Allow to update the ticket
        ticket.title = req.body.title != undefined ? req.body.title : ticket.title,
        ticket.description = req.body.description != undefined ? req.body.description : ticket.description,
        ticket.ticketPriority= req.body.ticketPriority != undefined ? req.body.ticketPriority : ticket.ticketPriority,
        ticket.status = req.body.status != undefined ? req.body.status : ticket.status,
        ticket.assignee = req.body.assignee != undefined ? req.body.assignee : ticket.assignee

        const oldTicket = {
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            assignee: ticket.assignee
        };

        ticket.ticketHistory.push({
            action: "TICKET_UPDATED",
            updatedBy: req.userId,
            oldValue: oldTicket,
            newValue: {
                title: ticket.title,
                description: ticket.description,
                status: ticket.status,
                assignee: ticket.assignee
            }
        });

        const updatedTicket = await ticket.save();


        /**
         * I need to send the message to both the user and the engineer 
         */
        try{
            const eng_obj = await User.findOne({userId : updatedTicket.assignee });
            await sendMessageToRedis(req,eng_obj,updatedTicket);
            

        }catch(err){
            console.log("Error while fetching the engineer obj",err.message);
        }
        // await sendMessageToRedis(req,updatedTicket.assignee,updatedTicket);

        return res.status(200).send(updatedTicket);
    }else{
        return res.status(400).send({
            message : "ticket can only be updated by owner or engineer or admin"
        })
    }
}

/**
 * Fetching all the tickets :
 * 1. Customers -he/she should fetch only his own list of tickets
 * 2. Engineer - He/She should get all the tickets assigned to them created
 * 3. Admin - He/She should get  all the tickets irrespective
 */


exports.getAllTicket = async(req,res)=>{
    const queryObj ={};
    if(req.query.status){
    queryObj.status = req.query.status;
    }

    if(req.query.priority){
        queryObj.ticketPriority = req.query.priority;
    }

    if(req.query.assignee){
    queryObj.assignee = req.query.assignee;
    }
    // Search by title
    if(req.query.title){
      queryObj.title = {
        $regex: req.query.title,
        $options: "i"
      };
    }

 // Date Range Filter
    if(req.query.fromDate && req.query.toDate){
        queryObj.createdAt = {
        $gte: new Date(req.query.fromDate),
        $lte: new Date(req.query.toDate)
        };
    }

    /**
     * Fetch the user obj which is making the request
     */
    const savedUser = await User.findOne({
        userId : req.userId
    });
    // let tickets=[];

    if(savedUser.userType ==constants.userType.customer){
        //We should only return the tickets filed by this customers
        queryObj.reporter = savedUser.userId ;

    } else if(savedUser.userType==constants.userType.engineer){
        //get the tickets assigned to an engineer
        queryObj.assignee = savedUser.userId;
    } else{
        //Get all the tickets
    }
    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 5;

    const skip = (page - 1) * limit;

    const tickets = await Ticket.find(queryObj)
        .skip(skip)
        .limit(limit);

    const totalTickets = await Ticket.countDocuments(queryObj);

    return res.status(200).send({
        page,
        totalPages : Math.ceil(totalTickets/limit),
        totalTickets,
        tickets
    });

    return res.status(200).send(tickets)
}

/**
 * Fetch the ticket based on the ticketId
 */
exports.findTicketBasedOnId = async(req,res) => {
    const ticket = await Ticket.findOne({
        _id : req.params.id
    });
    const savedUser = await User.findOne({
        userId : req.userId
    });
    if(savedUser.userType == constants.userType.admin 
        || ticket.reporter == req.userId 
        || ticket.assignee == req.userId){
        return res.status(200).send(ticket);
        
    } else{
            return res.status(400).send({
                message : "Can't return the ticket details as you are not authorized"
            });
        }
    
     
}

const enqueue = async (payload)=>{
    const msg = JSON.stringify({
        id : uuidv4(),
        ts : new Date().toISOString(),
        ...payload
    });
    const len = await redisClient.rpush(QUEUE_KEY,msg);
    console.log(`[Producer]enqueued -> ${msg} queue lenght :${len}`);

}

exports.getTicketHistory = async (req,res)=>{

    try{

        const ticket = await Ticket.findById(req.params.id);

        if(!ticket){
            return res.status(404).send({
                message : "Ticket not found"
            });
        }

        return res.status(200).send(ticket.ticketHistory);

    }catch(err){

        return res.status(500).send({
            message : err.message
        });

    }
}