import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import Message from "./model/message.js";
import "dotenv/config";
import Chatroom from "./model/chat-session.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Fetch messages for a room
async function fetchMessages(roomName) {
  try {
    return await Message.find({ roomName }).sort({ createdAt: 1 });
  } catch (err) {
    console.error("Error fetching messages:", err);
    throw err;
  }
}

// Save a message to the database
async function saveMessage(roomName, sender, content) {
  try {
    const message = new Message({ roomName, sender, content });
    await message.save();

    // Add message to the chatroom's messages array
    await Chatroom.updateOne(
      { application: roomName },
      { $push: { messages: message._id } }
    );

    return message;
  } catch (err) {
    console.error("Error saving message:", err);
    throw err;
  }
}

// Create a new chatroom
app.post("/create-chatroom", async (req, res) => {
  const { application } = req.body;
  try {
    const roomExists = await Chatroom.findOne({ application });
    if (roomExists) {
      return res.status(400).json({ error: "Room already exists" });
    }
    const room = await Chatroom.create({ application });
    res.status(201).json({ id: room._id });
  } catch (err) {
    console.error("Error creating chatroom:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch messages for a room
app.get("/messages/:roomName", async (req, res) => {
  const roomName = req.params.roomName;
  try {
    const messages = await fetchMessages(roomName);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_room", async (roomName) => {
    socket.join(roomName);
    console.log(`User ${socket.id} joined room ${roomName}`);

    const messages = await fetchMessages(roomName);
    socket.emit("room_messages", messages);
  });

  socket.on("send_message", async ({ roomName, sender, content }) => {
    try {
      const newMessage = await saveMessage(roomName, sender, content);
      io.to(roomName).emit("receive_message", newMessage);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Start the server
server.listen(8000, () => {
  console.log("Server is running on port 8000");
});
