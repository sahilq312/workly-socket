import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "./model/message.js";
import Chatroom from "./model/chat-session.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

const EVENTS = {
  SEND_MESSAGE: "send_message",
  JOIN_ROOM: "join_room",
  RECEIVE_MESSAGE: "receive_message",
};

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Database connection error:", err));

// Utility functions
/* const fetchMessages = async (chatRoomId) => {
  return Chatroom.findById(chatRoomId).populate("messages").exec();
}; */

async function fetchMessages(chatRoomId) {
  try {
      const chatroom = await Chatroom.findById(chatRoomId).populate({
          path: "messages",
          options: { sort: { createdAt: 1 } }, // Sort messages by creation time
      });
      return chatroom ? chatroom.messages : [];
  } catch (err) {
      console.error("Error fetching messages:", err);
      throw err;
  }
}


const saveMessage = async (chatRoomId, sender, content) => {
  const message = new Message({ chatRoomId, sender, content });
  await message.save();
  await Chatroom.updateOne({ _id: chatRoomId }, { $push: { messages: message._id } });
  return message;
};

// API Routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
}); 

app.post("/create-chatroom", async (req, res) => {
  const { application } = req.body;
  console.log(application);
  try {
    const chatroomExists = await Chatroom.findOne({ application });
  if (chatroomExists) {
    res.status(400).json({ error: "Chatroom already exists" });
    } else {
      const chatroom = new Chatroom({ application });
      await chatroom.save();
      res.json({ id: chatroom._id });
    }
  } catch (error) {
    console.error("Error creating chatroom:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/messages/:chatRoomId", async (req, res) => {
  try {
    const messages = await fetchMessages(req.params.chatRoomId);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Socket.IO Handlers
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on(EVENTS.JOIN_ROOM, (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`User joined room: ${chatRoomId}`);
  });

  socket.on(EVENTS.SEND_MESSAGE, async ({ chatRoomId, sender, content }) => {
    try {
      const message = await saveMessage(chatRoomId, sender, content);
      io.to(chatRoomId).emit(EVENTS.RECEIVE_MESSAGE, message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(8000, () => {
  console.log("Server running on port 8000");
});
