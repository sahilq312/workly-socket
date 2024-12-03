import mongoose, { Schema } from "mongoose";

const chatroomSchema = new Schema({
    application : {
        type : String,
        required : true
    },
    messages : {
        type : [mongoose.Schema.Types.ObjectId],
        ref : "Message",
        default : []
    },
});
const Chatroom = mongoose.model("Chatroom", chatroomSchema)
export default Chatroom;