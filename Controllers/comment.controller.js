const Comment = require("../Models/comment.model");
const User = require("../Models/user.model");

exports.createComment = async (req, res) => {

    try {

        const loggedInUser = await User.findOne({
            userId : req.userId
        });

        const commentObj = {
            content : req.body.content,
            ticketId : req.params.ticketId,
            commenterId : loggedInUser._id
        };

        const createdComment = await Comment.create(commentObj);

        return res.status(201).send(createdComment);

    } catch (err) {

        console.log("Some error happened while create a comment", err);

        return res.status(500).send({
            message : "Some internal server error"
        });
    }
};

/**
 * Get the comment for the given ticket
 */
exports.fetchComments = async (req,res)=>{
    try{
        const comments = await Comment.find({ticketId : req.params.ticketId});
        res.status(200).send(comments);
    }catch(err){
        console.log("Some internal error happened , while fetching the comments",err);
        res.status(500).send({
            message : "Some internal server error !"
        });
    }
}