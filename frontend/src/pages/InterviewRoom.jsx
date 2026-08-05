import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Monitor,
  Users,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Maximize2,
  Settings,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import useWebRTC from "../hooks/useWebRTC";
import { useAuth } from "../context/AuthContext";

const InterviewRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get("id") || "demo-room";

  // Pre-call device check state
  const [previewStream, setPreviewStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [deviceError, setDeviceError] = useState(null);
  const [joinRequested, setJoinRequested] = useState(false);
  const [time, setTime] = useState(0);

  // notifications
  const [notice, setNotice] = useState(null);

  const localPreviewRef = useRef(null);
  const { token, user } = useAuth();
  const serverUrl = import.meta.env.VITE_SOCKET_SERVER || window.location.origin;

  // Only mount hook when user requested join (so preview + device check happens first)
  const webrtc = joinRequested
    ? useWebRTC({
        serverUrl,
        meetingId,
        token,
        options: {
          iceServers: [
            { urls: import.meta.env.VITE_STUN_SERVER || "stun:stun.l.google.com:19302" },
            ...(import.meta.env.VITE_TURN_SERVER
              ? [
                  {
                    urls: import.meta.env.VITE_TURN_SERVER,
                    username: import.meta.env.VITE_TURN_USERNAME,
                    credential: import.meta.env.VITE_TURN_PASSWORD,
                  },
                ]
              : []),
          ],
        },
      })
    : null;

  // timer
  useEffect(() => {
    let interval;
    if (webrtc?.inCall) {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [webrtc?.inCall]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // Pre-call: get preview media and test devices
  useEffect(() => {
    let mounted = true;
    const getPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setPreviewStream(stream);
        setCameraReady(!!stream.getVideoTracks().length);
        setMicReady(!!stream.getAudioTracks().length);
        setDeviceError(null);
        if (localPreviewRef.current) localPreviewRef.current.srcObject = stream;
      } catch (err) {
        console.warn("device preview error", err);
        setDeviceError(err?.message || "Camera/Microphone access denied");
        setCameraReady(false);
        setMicReady(false);
      }
    };
    getPreview();
    return () => {
      mounted = false;
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notification helper
  useEffect(() => {
    if (!webrtc) return;
    // participant join/left notices
    const prevLen = { current: webrtc.participants?.length || 0 };
    const unsub = () => {};
    const check = () => {
      const len = webrtc.participants?.length || 0;
      if (len > prevLen.current) {
        setNotice("User joined");
        setTimeout(() => setNotice(null), 3000);
      } else if (len < prevLen.current) {
        setNotice("User left");
        setTimeout(() => setNotice(null), 3000);
      }
      prevLen.current = len;
    };
    const iv = setInterval(check, 500);
    return () => clearInterval(iv);
  }, [webrtc]);

  // Join button handler
  const handleJoinCall = () => {
    // Ensure preview devices ok
    if (deviceError) return;
    setJoinRequested(true);
  };

  const handleLeaveCall = () => {
    if (webrtc && webrtc.endCall) webrtc.endCall();
    setJoinRequested(false);
    if (previewStream) previewStream.getTracks().forEach((t) => t.stop());
    navigate("/dashboard");
  };

  // useWebRTC bound controls
  const toggleMic = () => webrtc?.toggleMic();
  const toggleCamera = () => webrtc?.toggleCamera();
  const startScreenShare = () => webrtc?.startScreenShare();

  // Connection status computation
  const connectionStatus = () => {
    if (!webrtc) return deviceError ? "Failed" : "Not connected";
    if (webrtc.error) return "Failed";
    if (!webrtc.connected) return "Connecting";
    if (webrtc.inCall) return "Connected";
    return "Connected";
  };

  // Render helpers
  const renderStatusBadge = () => {
    const status = connectionStatus();
    const color = status === "Connected" ? "bg-green-500" : status === "Connecting" ? "bg-yellow-400" : "bg-red-500";
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${color} text-black text-sm`}> 
        <div className="w-2 h-2 rounded-full" />
        {status}
      </div>
    );
  };

  // Render remote video(s)
  const renderRemote = () => {
    const map = webrtc?.remoteStreams || {};
    const keys = Object.keys(map);
    if (!keys.length) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-2xl font-semibold mb-2">Waiting for other participant</div>
            <div className="text-sm">They will appear here once they join.</div>
          </div>
        </div>
      );
    }
    // show the first remote as main
    const first = keys[0];
    return (
      <video
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        ref={(el) => { if (el && map[first]) el.srcObject = map[first]; }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!joinRequested ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
            <Card className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Interview Lobby</h1>
                  <p className="text-sm text-gray-400">Meeting ID: <span className="font-mono text-indigo-400">{meetingId}</span></p>
                </div>
                <div>{renderStatusBadge()}</div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-4">
                    <video ref={localPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" />
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className={`px-3 py-1 rounded-xl ${cameraReady ? 'bg-green-600/20 text-green-300' : 'bg-red-600/10 text-red-300'}`}>
                      {cameraReady ? 'Camera ready ✓' : 'Camera not available'}
                    </div>
                    <div className={`px-3 py-1 rounded-xl ${micReady ? 'bg-green-600/20 text-green-300' : 'bg-red-600/10 text-red-300'}`}>
                      {micReady ? 'Microphone ready ✓' : 'Microphone not available'}
                    </div>
                  </div>

                  {deviceError && (
                    <div className="mb-4 p-3 rounded bg-red-900 text-red-100">{deviceError}. Please allow camera and microphone access in your browser settings.</div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button size="large" onClick={handleJoinCall} leftIcon={<Video className="w-5 h-5" />} disabled={!!deviceError}>
                      Join Interview
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
                  </div>
                </div>

                <div>
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-2">Pre-call checks</h3>
                    <ul className="text-sm space-y-2 text-gray-300">
                      <li>{cameraReady ? 'Camera ✓' : 'Camera ✕'}</li>
                      <li>{micReady ? 'Microphone ✓' : 'Microphone ✕'}</li>
                      <li>Network: {webrtc?.connected ? 'Connected' : 'Unknown'}</li>
                    </ul>
                  </Card>

                  <Card className="mt-4 p-4">
                    <h3 className="text-sm font-semibold mb-2">Tips</h3>
                    <p className="text-sm text-gray-400">Use a wired connection for best quality. Close other apps that use the camera or microphone.</p>
                  </Card>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold">Interview in Progress</h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Live</span>
                  <span>•</span>
                  <span className="font-mono">{meetingId}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime(time)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {renderStatusBadge()}
                <Button variant="danger" leftIcon={<Phone className="w-4 h-4" />} onClick={handleLeaveCall}>End Call</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="aspect-video relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 flex items-center justify-center">
                    {webrtc ? renderRemote() : <div className="text-gray-400">Connecting...</div>}
                  </div>

                  {/* Local floating preview */}
                  <div className="absolute bottom-6 right-6 w-44 h-28 rounded-lg overflow-hidden border border-white/10">
                    <video
                      autoPlay
                      muted
                      playsInline
                      ref={(el) => { if (el && (webrtc?.localStream || previewStream)) el.srcObject = webrtc?.localStream || previewStream; }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <Card.Header>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4" /> Participants</h2>
                      <span className="text-xs text-gray-500">{webrtc?.participants?.length || 0}</span>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-2">
                      {(webrtc?.participants || []).map((p) => (
                        <div key={p.socketId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">{(p.name||'U').charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{p.name || 'Participant'}</p>
                            <p className="text-xs text-gray-500">{p.role || ''}</p>
                          </div>
                          {/* speaking indicator placeholder */}
                        </div>
                      ))}

                      {(!webrtc?.participants || webrtc.participants.length <= 1) && (
                        <div className="p-3 text-sm text-gray-400">Waiting for interviewer/candidate to join...</div>
                      )}
                    </div>
                  </Card.Content>
                </Card>

                <Card>
                  <Card.Header>
                    <h2 className="text-sm font-semibold text-white">Controls</h2>
                  </Card.Header>
                  <Card.Content>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="ghost" size="small" fullWidth onClick={toggleMic} leftIcon={webrtc?.localStream && webrtc.localStream.getAudioTracks()[0]?.enabled ? <Mic /> : <MicOff />}>Mic</Button>
                      <Button variant="ghost" size="small" fullWidth onClick={toggleCamera} leftIcon={webrtc?.localStream && webrtc.localStream.getVideoTracks()[0]?.enabled ? <Video /> : <VideoOff />}>Camera</Button>
                      <Button variant="secondary" size="small" fullWidth onClick={startScreenShare} leftIcon={<Monitor />}>Share Screen</Button>
                      <Button variant="secondary" size="small" fullWidth leftIcon={<Maximize2 />}>Fullscreen</Button>
                    </div>
                  </Card.Content>
                </Card>

                <Card>
                  <Card.Header>
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /> AI Insights</h2>
                  </Card.Header>
                  <Card.Content>
                    <p className="text-sm text-gray-400">AI assistant will provide analysis after the interview. (Coming soon)</p>
                  </Card.Content>
                </Card>
              </div>
            </div>

            {/* transient notice */}
            {notice && <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-2 rounded text-sm">{notice}</div>}

            {/* socket / media errors */}
            {webrtc?.error && (
              <div className="fixed top-6 right-6 bg-red-900 text-red-100 px-3 py-2 rounded">{webrtc.error.message}</div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default InterviewRoom;
