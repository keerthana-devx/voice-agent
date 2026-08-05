import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Interview from "../models/Interview.js";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

/**
 * Socket.IO initialization and handlers (presence foundation)
 * - Validates JWT during handshake
 * - Allows join/leave of rooms by meetingId
 * - Maintains in-memory participant lists per room
 * - Emits peer:joined / peer:left / participants:update events
 */

const rooms = {}; // { meetingId: { socketId: participantSummary } }

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: ENV.FRONTEND_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 20000,
  });

  // JWT validation middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Authentication error: missing token"));

      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      if (!decoded?.id) return next(new Error("Authentication error: invalid token"));

      const user = await User.findById(decoded.id).select("_id name email role").lean();
      if (!user) return next(new Error("Authentication error: user not found"));

      socket.user = user;
      return next();
    } catch (err) {
      console.error("Socket auth error:", err.message || err);
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log("[socket] connected:", socket.id, "user=", user?.email);

    const broadcastParticipants = (meetingId) => {
      const list = rooms[meetingId] ? Object.values(rooms[meetingId]) : [];
      io.to(meetingId).emit("participants:update", { meetingId, participants: list });
    };

    socket.on("join-room", async ({ meetingId }) => {
      try {
        if (!meetingId) {
          socket.emit("error", { message: "Missing meetingId" });
          return;
        }

        const interview = await Interview.findOne({ meetingId }).lean();
        if (!interview) {
          socket.emit("error", { message: "Interview not found" });
          return;
        }

        const uid = String(user._id);
        const isParticipant = [String(interview.interviewer), String(interview.candidate)].includes(uid);
        if (!isParticipant) {
          socket.emit("error", { message: "Forbidden: not a participant of this interview" });
          return;
        }

        socket.join(meetingId);
        rooms[meetingId] = rooms[meetingId] || {};
        rooms[meetingId][socket.id] = {
          socketId: socket.id,
          userId: uid,
          name: user.name,
          role: user.role,
          connectedAt: new Date().toISOString(),
        };

        // notify others
        socket.to(meetingId).emit("peer:joined", { socketId: socket.id, user: rooms[meetingId][socket.id] });

        // ack
        socket.emit("joined", { meetingId, socketId: socket.id, participants: Object.values(rooms[meetingId]) });

        // broadcast updated participants
        broadcastParticipants(meetingId);

        console.log(`[socket] ${user.email} joined room ${meetingId}`);
      } catch (err) {
        console.error("join-room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("leave-room", ({ meetingId }) => {
      try {
        if (rooms[meetingId] && rooms[meetingId][socket.id]) {
          delete rooms[meetingId][socket.id];
        }
        socket.leave(meetingId);
        socket.to(meetingId).emit("peer:left", { socketId: socket.id });
        const list = rooms[meetingId] ? Object.values(rooms[meetingId]) : [];
        io.to(meetingId).emit("participants:update", { meetingId, participants: list });
        console.log(`[socket] ${user.email} left room ${meetingId}`);
      } catch (err) {
        console.error("leave-room error:", err);
      }
    });

    socket.on("get-participants", ({ meetingId }, cb) => {
      const list = rooms[meetingId] ? Object.values(rooms[meetingId]) : [];
      if (cb && typeof cb === "function") cb({ meetingId, participants: list });
    });

    socket.on("presence:heartbeat", ({ meetingId }) => {
      if (rooms[meetingId] && rooms[meetingId][socket.id]) {
        rooms[meetingId][socket.id].lastSeen = new Date().toISOString();
      }
    });

    socket.on("disconnecting", () => {
      const joinedRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      joinedRooms.forEach((meetingId) => {
        if (rooms[meetingId]) {
          delete rooms[meetingId][socket.id];
          socket.to(meetingId).emit("peer:left", { socketId: socket.id, userId: user._id });
          broadcastParticipants(meetingId);
        }
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", socket.id, "reason=", reason);
    });

    socket.on("rooms:debug", (cb) => {
      if (cb && typeof cb === "function") cb({ rooms });
    });
  });

  return io;
}
