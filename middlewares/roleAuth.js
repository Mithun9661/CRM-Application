exports.isAdmin = (req,res,next)=>{
   if(req.userType !== "ADMIN"){
      return res.status(403).send({
          message:"Admin access required"
      })
   }
   next();
}