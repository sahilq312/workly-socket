import mongoose, { Schema } from "mongoose";

const chatroomSchema = new Schema({
    application: {
        type: Number,
        required: true,
    },
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
    ],
});

const Chatroom = mongoose.model("Chatroom", chatroomSchema);
export default Chatroom;


/* import mongoose, { Schema } from "mongoose";

const chatroomSchema = new Schema({
    application : {
        type : String,
        required : true
    },
});
const Chatroom = mongoose.model("Chatroom", chatroomSchema)
export default Chatroom; */