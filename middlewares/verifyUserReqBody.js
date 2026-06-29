const User = require("../Models/user.model");
const constants = require("../utils/constants");

validateUserRequestBody = async(req, res , next) =>{


    //Validate the UserName
    if(!req.body.name){
        res.status(400).send({
            message : "Failed ! Bad Request ,userName field is not passed or empty "
        });
        return ;
    }
    // Validate the user password
    if(!req.body.password){
        res.status(400).send({
            message : "Failed ! Bad Request ,password field is not passed or empty "
        });
        return ;
    }

    //Validate the userId
    if(!req.body.userId){
        res.status(400).send({
            message : "Failed ! Bad Request ,userId field is not passed or empty "
        });
        return ;
    }
    //Let check if the userId is unique

    const user = await User.findOne({ userId : req.body.userId });

    if (user!=null){
        res.status(400).send({
            message : "Failed ! Bad Request ,userId field is already registered , please change and try "
        });
        return ;
    }
    if(!req.body.email){
        res.status(400).send({
            message : "Failed ! Bad Request ,userId field is not passed or empty "
        });
        return ;
    }
    
    const user1 = await User.findOne({ email : req.body.email });
    if (user1!=null){
        res.status(400).send({
            message : "Failed ! Bad Request ,email field is already registered , please change and try "
        });
        return ;
    }
    //Validate the userType
    const possibleUserType = [constants.userType.customer,constants.userType.engineer,constants.userType.admin]

    if(req.body.userType && ! possibleUserType.includes(req.body.userType)){
        res.status(400).send({
            message : "UserType passed is invalid ! .. please correct and re-try !"
        });
        return ;
    }

    next();


}

const validateUserStatusAndUserType = async (req,res,next)=>{
    //Validate user types
    const userType = req.body.userType;
    const possibleUserType = [constants.userType.customer,constants.userType.engineer,constants.userType.admin]

    if(userType && ! possibleUserType.includes(userType)){
        res.status(400).send({
            message : "UserType provided is invalid ! .. possible values CUSTOMER | ENGINEER | ADMIN "
        });
        return ;
    }
    //Validate user status
    const userStatus = req.body.userStatus;
    const possibleUserStatus = [constants.userStatuses.approved,constants.userStatuses.pending,constants.userStatuses.blocked];
    if(userStatus && ! possibleUserStatus.includes(userStatus)){
        res.status(400).send({
            message : "UserStatus provided is invalid ! .. possible values APPROVED | PENDING | BLOCKED "
        });
        return ;
    }
    next();
}
module.exports = {
    validateUserReqBody : validateUserRequestBody,
    validateUserStatusAndUserType : validateUserStatusAndUserType
}