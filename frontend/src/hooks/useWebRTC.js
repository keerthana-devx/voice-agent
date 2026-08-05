import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

/**
 * useWebRTC hook
 * - Manages Socket.IO connection (auth via token)
 * - Joins meeting room
 * - Manages localMedia, remote streams, RTCPeerConnections
 * - Forwards signaling via socket events: webrtc:offer/answer/ice-candidate
 * - Maintains participants list from server events
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

  const ICE_SERVERS = options.iceServers || { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

  const addRemoteStream = useCallback((id, stream) => {
    remoteStreamsRef.current = { ...remoteStreamsRef.current, [id]: stream };
    setRemoteStreams({ ...remoteStreamsRef.current });
  }, []);

  const removeRemoteStream = useCallback((id) => {
    const copy = { ...remoteStreamsRef.current };
    if (copy[id]) {
      // stop tracks on old stream
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

    const socket = io(serverUrl, { auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    // request local media
    const startLocal = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error("getUserMedia", err);
        setError({ type: "media", message: err.message || "Failed to get camera/microphone" });
      }
    };

    startLocal();

    socket.on("connect", () => {
      setConnected(true);
      // Join the meeting; server authorizes
      socket.emit("join-room", { meetingId });
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.warn("socket disconnected", reason);
    });

    socket.on("joined", ({ participants: list }) => {
      setInCall(true);
      setParticipants(list || []);
      // create offers to existing participants (except ourselves)
      (list || []).forEach((p) => {
        if (p.socketId && p.socketId !== socket.id) {
          createOffer(p.socketId);
        }
      });
    });

    socket.on("participants:update", ({ participants: list }) => {
      setParticipants(list || []);
    });

    socket.on("peer:joined", ({ socketId, user }) => {
      // update participants will be broadcast by server; show transient message if needed
      // create offer to the joining peer
      if (socketId !== socket.id) createOffer(socketId);
    });

    socket.on("peer:left", ({ socketId }) => {
      // cleanup pc + remote stream
      const pc = pcsRef.current[socketId];
      if (pc) {
        try { pc.close(); } catch (e) {}
        delete pcsRef.current[socketId];
      }
      removeRemoteStream(socketId);
    });

    // Signaling
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
      // keep for UI handling
      setError({ type: "socket", message: payload?.message || "Socket error" });
    });

    // cleanup on unmount
    return () => {
      try { socket.emit("leave-room", { meetingId }); } catch (e) {}
      socket.disconnect();
      setConnected(false);
      setInCall(false);
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
  }, [serverUrl, meetingId, token]);

  const createPeerConnection = useCallback(async (remoteId) => {
    if (pcsRef.current[remoteId]) return pcsRef.current[remoteId];
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
    }

    // collect remote
    pc.ontrack = (e) => {
      e.streams.forEach((s) => addRemoteStream(remoteId, s));
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && socketRef.current) {
        socketRef.current.emit("webrtc:ice-candidate", { to: remoteId, candidate: ev.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "failed" || state === "disconnected" || state === "closed") {
        try { pc.close(); } catch (e) {}
        delete pcsRef.current[remoteId];
        removeRemoteStream(remoteId);
      }
    };

    pcsRef.current[remoteId] = pc;
    return pc;
  }, [addRemoteStream, removeRemoteStream]);

  const createOffer = useCallback(async (remoteId) => {
    try {
      const pc = await createPeerConnection(remoteId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("webrtc:offer", { to: remoteId, sdp: pc.localDescription });
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
