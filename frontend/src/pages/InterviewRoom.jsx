import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const InterviewRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [time, setTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const meetingId = searchParams.get("id") || "demo-room";

  useEffect(() => {
    let interval;
    if (isInCall) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleJoinCall = () => {
    setIsInCall(true);
    setTime(0);
  };

  const handleLeaveCall = () => {
    setIsInCall(false);
    setTime(0);
    navigate("/dashboard");
  };

  const mockParticipants = [
    { id: 1, name: "John Doe", role: "Candidate", avatar: "JD", isSpeaking: true },
    { id: 2, name: "You", role: "Interviewer", avatar: "ME", isSpeaking: false },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isInCall ? (
          /* Pre-call Lobby */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Interview Room
                </h1>
                <p className="text-gray-400">
                  Meeting ID: <span className="font-mono text-indigo-400">{meetingId}</span>
                </p>
              </div>

              {/* Video Preview */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900/50 to-purple-900/50 mb-6 border border-white/10">
                {isCameraOn ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white">
                        ME
                      </div>
                      <p className="text-gray-400">Camera Preview</p>
                    </div>
                </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#131323]">
                    <div className="text-center">
                      <VideoOff className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-500">Camera is off</p>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-white">Ready to join</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isMicOn
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  }`}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isCameraOn
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  }`}
                >
                  {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-14 h-14 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Join Button */}
              <Button
                fullWidth
                size="large"
                onClick={handleJoinCall}
                leftIcon={<Video className="w-5 h-5" />}
              >
                Join Interview
              </Button>

              {/* Tips */}
              <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      AI Interview Assistant
                    </h3>
                    <p className="text-sm text-gray-400">
                      Our AI will analyze communication patterns, technical responses,
                      and provide real-time insights during the interview.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* Active Call */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-white">Interview in Progress</h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                  <span>•</span>
                  <span className="font-mono">{meetingId}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(time)}
                  </span>
                </div>
              </div>
              <Button
                variant="danger"
                leftIcon={<Phone className="w-4 h-4" />}
                onClick={handleLeaveCall}
              >
                End Call
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Video Area */}
              <div className="lg:col-span-2">
                <Card className="aspect-video relative overflow-hidden">
                  {/* Main Video */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white">
                        JD
                      </div>
                      <p className="text-white font-semibold">John Doe</p>
                      <p className="text-sm text-gray-400">Candidate</p>
                    </div>
                  </div>

                  {/* AI Analysis Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <Card className="p-4 backdrop-blur-xl bg-black/50 border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-semibold text-white">
                          AI Analysis
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">Communication</span>
                            <span className="text-green-400">85%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                              style={{ width: "85%" }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">Technical</span>
                            <span className="text-indigo-400">78%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                              style={{ width: "78%" }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">Confidence</span>
                            <span className="text-blue-400">92%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                              style={{ width: "92%" }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Participants */}
                <Card>
                  <Card.Header>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Participants
                      </h2>
                      <span className="text-xs text-gray-500">
                        {mockParticipants.length}
                      </span>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-2">
                      {mockParticipants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                            {participant.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {participant.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {participant.role}
                            </p>
                          </div>
                          {participant.isSpeaking && (
                            <div className="flex items-center gap-0.5">
                              <span className="w-1 h-3 bg-green-500 rounded-full animate-pulse" />
                              <span className="w-1 h-4 bg-green-500 rounded-full animate-pulse [animation-delay:0.1s]" />
                              <span className="w-1 h-2 bg-green-500 rounded-full animate-pulse [animation-delay:0.2s]" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <Card.Header>
                    <h2 className="text-sm font-semibold text-white">Actions</h2>
                  </Card.Header>
                  <Card.Content>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="secondary"
                        size="small"
                        fullWidth
                        onClick={() => setIsScreenSharing(!isScreenSharing)}
                        leftIcon={<Monitor className="w-4 h-4" />}
                      >
                        {isScreenSharing ? "Stop Share" : "Share Screen"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        fullWidth
                        leftIcon={<Maximize2 className="w-4 h-4" />}
                      >
                        Fullscreen
                      </Button>
                    </div>
                  </Card.Content>
                </Card>

                {/* AI Insights */}
                <Card>
                  <Card.Header>
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      AI Insights
                    </h2>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-400">
                          Strong communication skills detected
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-400">
                          Good eye contact maintained
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-400">
                          Consider asking more technical questions
                        </p>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default InterviewRoom;