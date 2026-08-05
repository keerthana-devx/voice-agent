import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Interview from "../models/Interview.js";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

/**
 * initSocket(httpServer)
 * - Validates JWT on handshake
 * - Handles join-room / leave-room
 * - Maintains in-memory participant lists per room
 * - Emits peer:joined / peer:left and participants:update
 * - Forwards WebRTC signaling events between peers (offer/answer/ice)
 *
 * Note: presence map is intentionally in-memory for single-server setups.
 */

const rooms = {}; // { meetingId: { socketId: participantSummary } }

function findMeetingIdForSocket(socketId) {
  for (const meetingId of Object.keys(rooms)) {
    if (rooms[meetingId] && rooms[meetingId][socketId]) return meetingId;
  }
  return null;
}

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

    // Join a meeting room
    socket.on("join-room", async ({ meetingId }) => {
      try {
        if (typeof meetingId !== "string" || meetingId.trim() === "") {
          socket.emit("socket:error", { message: "Invalid meetingId" });
          return;
        }

        const interview = await Interview.findOne({ meetingId }).lean();
        if (!interview) {
          socket.emit("socket:error", { message: "Interview not found" });
          return;
        }

        const uid = String(user._id);
        const isParticipant = [String(interview.interviewer), String(interview.candidate)].includes(uid);
        if (!isParticipant) {
          socket.emit("socket:error", { message: "Forbidden: not a participant of this interview" });
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
          lastSeen: new Date().toISOString(),
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
        socket.emit("socket:error", { message: "Failed to join room" });
      }
    });

    // Leave room voluntarily
    socket.on("leave-room", ({ meetingId }) => {
      try {
        if (rooms[meetingId] && rooms[meetingId][socket.id]) {
          delete rooms[meetingId][socket.id];
          // cleanup empty room
          if (Object.keys(rooms[meetingId]).length === 0) delete rooms[meetingId];
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

    // Client can request current participants
    socket.on("get-participants", ({ meetingId }, cb) => {
      const list = rooms[meetingId] ? Object.values(rooms[meetingId]) : [];
      if (cb && typeof cb === "function") cb({ meetingId, participants: list });
    });

    // Heartbeat
    socket.on("presence:heartbeat", ({ meetingId }) => {
      if (rooms[meetingId] && rooms[meetingId][socket.id]) {
        rooms[meetingId][socket.id].lastSeen = new Date().toISOString();
      }
    });

    // WebRTC signaling: offer
    socket.on("webrtc:offer", ({ to, sdp }) => {
      try {
        // validate that sender and receiver are in same meeting
        const fromMeeting = findMeetingIdForSocket(socket.id);
        const toMeeting = findMeetingIdForSocket(to);
        if (!fromMeeting || fromMeeting !== toMeeting) {
          socket.emit("socket:error", { message: "Peer not in same room or unknown" });
          return;
        }
        io.to(to).emit("webrtc:offer", { from: socket.id, sdp, user: { id: socket.user._id, name: socket.user.name } });
      } catch (err) {
        console.error("webrtc:offer error", err);
        socket.emit("socket:error", { message: "Failed to forward offer" });
      }
    });

    // WebRTC signaling: answer
    socket.on("webrtc:answer", ({ to, sdp }) => {
      try {
        const fromMeeting = findMeetingIdForSocket(socket.id);
        const toMeeting = findMeetingIdForSocket(to);
        if (!fromMeeting || fromMeeting !== toMeeting) {
          socket.emit("socket:error", { message: "Peer not in same room or unknown" });
          return;
        }
        io.to(to).emit("webrtc:answer", { from: socket.id, sdp });
      } catch (err) {
        console.error("webrtc:answer error", err);
        socket.emit("socket:error", { message: "Failed to forward answer" });
      }
    });

    // WebRTC signaling: ICE candidate
    socket.on("webrtc:ice-candidate", ({ to, candidate }) => {
      try {
        const fromMeeting = findMeetingIdForSocket(socket.id);
        const toMeeting = findMeetingIdForSocket(to);
        if (!fromMeeting || fromMeeting !== toMeeting) {
          socket.emit("socket:error", { message: "Peer not in same room or unknown" });
          return;
        }
        io.to(to).emit("webrtc:ice-candidate", { from: socket.id, candidate });
      } catch (err) {
        console.error("webrtc:ice-candidate error", err);
        socket.emit("socket:error", { message: "Failed to forward ICE candidate" });
      }
    });

    // Clean up when socket disconnects
    socket.on("disconnecting", () => {
      const joinedRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      joinedRooms.forEach((meetingId) => {
        if (rooms[meetingId]) {
          delete rooms[meetingId][socket.id];
          // cleanup empty room
          if (Object.keys(rooms[meetingId]).length === 0) delete rooms[meetingId];
          socket.to(meetingId).emit("peer:left", { socketId: socket.id, userId: user._id });
          broadcastParticipants(meetingId);
        }
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", socket.id, "reason=", reason);
    });

    // Debug helper
    socket.on("rooms:debug", (cb) => {
      if (cb && typeof cb === "function") cb({ rooms });
    });
  });

  return io;
}
