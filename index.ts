import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { db } from "./lib/db";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.post('/create-chatroom', async (req, res) => { 
    try {
        const chatroom = await db.chatRoom.create({});
        res.send(chatroom);
    } catch (error) {
        res.send(error);
    }
});

app.get('/chatrooms/:id', async (req, res) => { 
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.send("Chatroom id is required and must be a number");
    }
    try {
        const chatroom = await db.chatRoom.findUnique({
            where: {
                id: id
            },
            select: {
                id: true,
                messages: true
            }
        });
        res.send(chatroom);
    } catch (error) {
        res.send(error);
    }
});

io.on("connection", (socket: Socket) => {
    console.log("a user connected");

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });

    socket.on("join-room", async (roomId, userId) => {
        socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on("leave-room", async (roomId, userId) => {
        socket.leave(roomId);
        console.log(`User ${userId} left room ${roomId}`);
    });

    socket.on("send-message", async (roomId, sender, messageContent) => {
        const message = await db.message.create({
            data: {
                content: messageContent,
                sender: sender,
                chatRoomId: roomId,
            },
        });
        io.to(roomId).emit("receive-message", message);
    });
});

server.listen(8000, () => {
    console.log("Server is running on port 8000");
});
