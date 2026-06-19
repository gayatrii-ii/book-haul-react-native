import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import job from "./lib/cron.js";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import libraryRoutes from "./routes/libraryRoutes.js";
import haulRoutes from "./routes/haulRoutes.js";
import circleRoutes from "./routes/circleRoutes.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket client connected:", socket.id);

  socket.on("join_circle", (circleId) => {
    socket.join(`circle_${circleId}`);
    console.log(`Socket client ${socket.id} joined room circle_${circleId}`);
  });

  socket.on("leave_circle", (circleId) => {
    socket.leave(`circle_${circleId}`);
    console.log(`Socket client ${socket.id} left room circle_${circleId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket client disconnected:", socket.id);
  });
});

job.start();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/hauls", haulRoutes);
app.use("/api/circles", circleRoutes);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
