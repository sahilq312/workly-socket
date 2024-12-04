import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
  chatRoomId : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "ChatRoom",
    required : true
  },
  sender : {
    type : String,
    required : true
  },
  content : {
    type : String,
    required : true
  },
},
{
  timestamps : true
}
)
const Message = mongoose.model("Message", messageSchema);
export default Message;