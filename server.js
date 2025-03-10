const WebSocket = require("ws");
require("dotenv").config();
const mongoose = require("mongoose");

// MongoDB Connection - Ensuring it's connected only once
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log(" MongoDB Already Connected");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(" MongoDB Connected Successfully");
  } catch (error) {
    console.error(" MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Call the function to connect to MongoDB
connectDB();

// Define Message Schema & Model
const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", MessageSchema);

// WebSocket Server Setup
const server = new WebSocket.Server({ port: 4000 });
const users = new Map(); // Stores active users { userId: socket }

server.on("connection", (socket) => {
  let userId = null;

  socket.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString().trim());

      // User connects and registers their userId
      if (data.type === "connect") {
        userId = data.userId;
        users.set(userId, socket);
        console.log(`${userId} connected`);

        // Fetch chat history
        const history = await Message.find({
          $or: [{ from: userId }, { to: userId }],
        }).sort({ timestamp: 1 });

        socket.send(JSON.stringify({ type: "history", messages: history }));
      }

      // Private Messaging
      else if (data.type === "private") {
        const recipientSocket = users.get(data.to);
        const chatMessage = new Message({
          from: userId,
          to: data.to,
          message: data.message,
        });

        await chatMessage.save(); // Save to MongoDB

        if (recipientSocket) {
          recipientSocket.send(
            JSON.stringify({ from: userId, message: data.message })
          );
        }
      }
    } catch (error) {
      console.error(" Error processing message:", error);
    }
  });

  socket.on("close", () => {
    if (userId) {
      users.delete(userId);
      console.log(`${userId} disconnected`);
    }
  });
});

console.log(" WebSocket server running on ws://localhost:4000");
