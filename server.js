
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5174",
  credentials: true
}));

app.use(express.json());

const mongoose = require("mongoose");

// Test route
app.get("/", (req, res) => {
  const dbStates = {
    0: "Disconnected (MongoDB server not reachable)",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };
  const dbStatus = dbStates[mongoose.connection.readyState] || "Unknown";

  res.json({
    message: "Finmate backend is running successfully!",
    status: "OK",
    port: PORT,
    database: dbStatus,
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });

  await connectDB();
};

startServer();
