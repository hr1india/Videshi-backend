import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
connectDB(); // Connect to MongoDB

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes); // Use Auth Routes

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
