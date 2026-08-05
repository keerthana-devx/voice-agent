import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

/**
 * useWebRTC hook
 * - Manages Socket.IO connection (auth via token)
 * - Joins meeting room
 * - Manages localMedia, remote streams, RTCPeerConnections
 * - Forwards signaling via socket events: webrtc:offer/answer/ice-candidate
 * - Maintains participants list from server events
 *
 * Options:
 * - iceServers: array
 * - devices: { audioDeviceId, videoDeviceId }
 */
export default function useWebRTC({ serverUrl, meetingId, token, options = {} }) {
  const socketRef = useRef(null);
  const pcsRef = useRef({});
  const localStreamRef = useRef(null);
  const remoteStreamsRef = useRef({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [participants, setParticipants] = useState([]);
  const [connected, setConnected] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [error, setError] = useState(null);

  const HEARTBEAT_MS = 10000; // send heartbeat every 10s
  const heartbeatRef = useRef(null);

  const ICE_SERVERS = options.iceServers || { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  const devices = options.devices || {};

  const addRemoteStream = useCallback((id, stream) => {
    remoteStreamsRef.current = { ...remoteStreamsRef.current, [id]: stream };
    setRemoteStreams({ ...remoteStreamsRef.current });
  }, []);

  const removeRemoteStream = useCallback((id) => {
    const copy = { ...remoteStreamsRef.current };
    if (copy[id]) {
      try {
        copy[id].getTracks().forEach((t) => t.stop());
      } catch (e) {}
    }
    delete copy[id];
    remoteStreamsRef.current = copy;
    setRemoteStreams(copy);
  }, []);

  useEffect(() => {
    if (!serverUrl || !meetingId || !token) return;

    setError(null);

    const socket = io(serverUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    // request local media with chosen devices
    const startLocal = async () => {
      try {
        const constraints = {
          video: devices.videoDeviceId ? { deviceId: { exact: devices.videoDeviceId } } : true,
          audio: devices.audioDeviceId ? { deviceId: { exact: devices.audioDeviceId } } : true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error("getUserMedia", err);
        setError({ type: "media", message: err.message || "Failed to get camera/microphone" });
      }
    };

    startLocal();

    // connection events
    socket.on("connect", () => {
      setConnected(true);
      // Join the meeting; server authorizes
      try {
        socket.emit("join-room", { meetingId });
      } catch (e) {}

      // start heartbeat
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        try {
          socket.emit("presence:heartbeat", { meetingId });
        } catch (e) {}
      }, HEARTBEAT_MS);
    });

    socket.on("connect_error", (err) => {
      console.error("socket connect_error", err?.message || err);
      setError({ type: "socket", message: err?.message || "Socket connection failed" });
      // if unauthorized, bubble up auth type
      if (err && /auth|token|Authentication/i.test(err.message || "")) {
        setError({ type: "auth", message: err.message || "Authentication failed" });
      }
    });

    socket.on("reconnect_attempt", () => {
      setError({ type: "socket", message: "Reconnecting..." });
    });

    socket.on("reconnect", (attempt) => {
      setError(null);
      setConnected(true);
      try {
        socket.emit("join-room", { meetingId });
      } catch (e) {}
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.warn("socket disconnected", reason);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    });

    // When we receive participants ack, decide who creates offers deterministically to avoid collisions
    socket.on("joined", ({ participants: list }) => {
      setInCall(true);
      setParticipants(list || []);
      // create offers only when our socket.id is lexicographically smaller to avoid collision
      (list || []).forEach((p) => {
        try {
          if (p.socketId && p.socketId !== socket.id && socket.id < p.socketId) {
            createOffer(p.socketId);
          }
        } catch (e) {}
      });
    });

    socket.on("participants:update", ({ participants: list }) => {
      setParticipants(list || []);
    });

    socket.on("peer:joined", ({ socketId, user }) => {
      // on peer joined, only the peer with smaller id initiates
      if (socketId !== socket.id && socket.id < socketId) createOffer(socketId);
    });

    socket.on("peer:left", ({ socketId }) => {
      const pc = pcsRef.current[socketId];
      if (pc) {
        try { pc.close(); } catch (e) {}
        delete pcsRef.current[socketId];
      }
      removeRemoteStream(socketId);
    });

    // Signaling handlers
    socket.on("webrtc:offer", async ({ from, sdp }) => {
      try {
        const pc = await createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { to: from, sdp: pc.localDescription });
      } catch (err) {
        console.error("handle offer", err);
      }
    });

    socket.on("webrtc:answer", async ({ from, sdp }) => {
      const pc = pcsRef.current[from];
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (err) {
        console.error("handle answer", err);
      }
    });

    socket.on("webrtc:ice-candidate", async ({ from, candidate }) => {
      const pc = pcsRef.current[from];
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn("addIceCandidate", err);
      }
    });

    socket.on("socket:error", (payload) => {
      console.warn("socket error", payload);
      setError({ type: "socket", message: payload?.message || "Socket error" });
    });

    // cleanup on unmount
    return () => {
      try { socket.emit("leave-room", { meetingId }); } catch (e) {}
      try { socket.off(); } catch (e) {}
      try { socket.disconnect(); } catch (e) {}
      setConnected(false);
      setInCall(false);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      Object.values(pcsRef.current).forEach((pc) => { try { pc.close(); } catch (e) {} });
      pcsRef.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      localStreamRef.current = null;
      setLocalStream(null);
      Object.keys(remoteStreamsRef.current).forEach((k) => {
        try { remoteStreamsRef.current[k].getTracks().forEach((t) => t.stop()); } catch (e) {}
      });
      remoteStreamsRef.current = {};
      setRemoteStreams({});
      setParticipants([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl, meetingId, token, devices?.videoDeviceId, devices?.audioDeviceId]);

  const createPeerConnection = useCallback(async (remoteId) => {
    if (pcsRef.current[remoteId]) return pcsRef.current[remoteId];
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
    }

    // collect remote streams
    pc.ontrack = (e) => {
      e.streams.forEach((s) => addRemoteStream(remoteId, s));
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && socketRef.current) {
        socketRef.current.emit("webrtc:ice-candidate", { to: remoteId, candidate: ev.candidate });
      }
    };

    pc.onconnectionstatechange = async () => {
      const state = pc.connectionState;
      if (state === "failed") {
        // try ICE restart via new offer
        try {
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);
          if (socketRef.current) socketRef.current.emit("webrtc:offer", { to: remoteId, sdp: pc.localDescription });
        } catch (e) {
          console.warn("ICE restart failed", e);
        }
      }

      if (state === "disconnected" || state === "closed") {
        try { pc.close(); } catch (e) {}
        delete pcsRef.current[remoteId];
        removeRemoteStream(remoteId);
      }
    };

    pcsRef.current[remoteId] = pc;
    return pc;
  }, [addRemoteStream, removeRemoteStream, ICE_SERVERS]);

  const createOffer = useCallback(async (remoteId, opts = {}) => {
    try {
      const pc = await createPeerConnection(remoteId);
      const offer = await pc.createOffer(opts);
      await pc.setLocalDescription(offer);
      if (socketRef.current) socketRef.current.emit("webrtc:offer", { to: remoteId, sdp: pc.localDescription });
    } catch (err) {
      console.error("createOffer", err);
    }
  }, [createPeerConnection]);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
  }, []);

  const startScreenShare = useCallback(async () => {
    if (!localStreamRef.current) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      Object.values(pcsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });
      screenTrack.onended = () => {
        const camTrack = localStreamRef.current && localStreamRef.current.getVideoTracks()[0];
        Object.values(pcsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender && camTrack) sender.replaceTrack(camTrack);
        });
      };
    } catch (err) {
      console.error("startScreenShare", err);
      setError({ type: "screen", message: err.message || "Screen share failed" });
    }
  }, []);

  const endCall = useCallback(() => {
    try { if (socketRef.current) socketRef.current.emit("leave-room", { meetingId }); } catch (e) {}
    try { if (socketRef.current) socketRef.current.disconnect(); } catch (e) {}
    Object.values(pcsRef.current).forEach((pc) => { try { pc.close(); } catch (e) {} });
    pcsRef.current = {};
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    localStreamRef.current = null;
    setLocalStream(null);
    Object.keys(remoteStreamsRef.current).forEach((k) => {
      try { remoteStreamsRef.current[k].getTracks().forEach((t) => t.stop()); } catch (e) {}
    });
    remoteStreamsRef.current = {};
    setRemoteStreams({});
    setParticipants([]);
    setInCall(false);
    setConnected(false);
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, [meetingId]);

  return {
    socketRef,
    localStream,
    remoteStreams,
    participants,
    connected,
    inCall,
    error,
    toggleMic,
    toggleCamera,
    startScreenShare,
    endCall,
  };
}
