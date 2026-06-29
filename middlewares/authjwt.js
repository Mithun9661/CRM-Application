const jwt = require("jsonwebtoken");
const config = require("../configs/auth.config");
const User = require("../Models/user.model");
const constants = require("../utils/constants");
const verifyToken = (req , res, next) => {
    
    let token = req.headers["x-access-token"];

    // Swagger / Bearer Token support
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
    }

    if(!token){
        return res.status(403).send({
            message : "No Access token Passed  !"
        });
    }
    //Verification of the jwt Token
    jwt.verify(token, config.secret, (err, decoded) => {
        if(err){
            return res.status(401).send({
                message : "Unauthorized ! Invalid token !"
            });
        }
        req.userId = decoded.id;
    next();
    });
    

}

const isAdmin = async (req, res, next) => {
    //Find the user type from the userId which is set in the req by the verifyToken middleware
    const user = await User.findOne({
        userId : req.userId});
    if(user && user.userType == constants.userType.admin){
        next();
    } else {
        return res.status(403).send({
            message : "only  Admin Role is allowed access to this API !"
        });
    }
}

module.exports = {
    verifyToken : verifyToken,
    isAdmin : isAdmin
};