import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
  roomName : {
    type : String,
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