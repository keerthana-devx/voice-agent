import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Video,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  MoreVertical,
  Filter,
  Search,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import api from "../api/axios";

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInterviews();
  }, [user]);

  const fetchInterviews = async () => {
    if (!user?._id) return;

    try {
      setIsLoading(true);
      const response = await api.get(`/interview/my-interviews/${user._id}`);
      setInterviews(response.data.interviews || []);
      setError("");
    } catch (err) {
      console.error("Error fetching interviews:", err);
      setError("Failed to load interviews");
      setInterviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter interviews based on user role
  const userInterviews = interviews.filter(
    (interview) =>
      (user?.role === "interviewer" && interview.interviewer?._id === user._id) ||
      (user?.role === "candidate" && interview.candidate?._id === user._id)
  );

  // Calculate stats
  const stats = [
    {
      label: "Total Interviews",
      value: userInterviews.length.toString(),
      change: "+0",
      trend: "up",
      icon: <Video className="w-5 h-5" />,
      color: "from-indigo-500 to-blue-500",
    },
    {
      label: "Scheduled",
      value: userInterviews.filter((i) => i.status === "scheduled").length.toString(),
      change: "+0",
      trend: "up",
      icon: <Calendar className="w-5 h-5" />,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Completed",
      value: userInterviews.filter((i) => i.status === "completed").length.toString(),
      change: "+0",
      trend: "up",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "from-purple-500 to-pink-500",
    },
    {
      label: user?.role === "interviewer" ? "Candidates" : "Interviews",
      value: new Set(userInterviews.map(i => user?.role === "interviewer" ? i.candidate?._id : i.interviewer?._id)).size.toString(),
      change: "+0",
      trend: "up",
      icon: <Users className="w-5 h-5" />,
      color: "from-orange-500 to-amber-500",
    },
  ];

  // Get upcoming interviews
  const upcomingInterviews = userInterviews
    .filter((i) => i.status === "scheduled")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  if (isLoading && !interviews.length) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome back, {user?.name || "User"}!
            </h1>
            <p className="text-gray-400">
              {user?.role === "interviewer"
                ? "Manage your interviews and candidates"
                : "View your upcoming interviews"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={fetchInterviews}
            >
              Refresh
            </Button>
            {user?.role === "interviewer" && (
              <Button
                onClick={() => navigate("/create-interview")}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                New Interview
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card hover className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}
                  >
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Upcoming Interviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {user?.role === "interviewer" ? "Upcoming Interviews" : "My Interviews"}
                </h2>
                <span className="text-sm text-gray-500">
                  {upcomingInterviews.length} {upcomingInterviews.length === 1 ? "interview" : "interviews"}
                </span>
              </div>
            </Card.Header>
            <Card.Content>
              {upcomingInterviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No upcoming interviews
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {user?.role === "interviewer"
                      ? "Create your first interview to get started"
                      : "You don't have any scheduled interviews yet"}
                  </p>
                  {user?.role === "interviewer" && (
                    <Button
                      onClick={() => navigate("/create-interview")}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Create Interview
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingInterviews.map((interview) => (
                    <motion.div
                      key={interview._id}
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                      onClick={() =>
                        navigate(`/interview-room?id=${interview.meetingId}`)
                      }
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user?.role === "interviewer"
                          ? interview.candidate?.name?.charAt(0) || "C"
                          : interview.interviewer?.name?.charAt(0) || "I"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {user?.role === "interviewer"
                            ? interview.candidate?.name || "Candidate"
                            : interview.interviewer?.name || "Interviewer"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {interview.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(interview.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(interview.date)}</span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            interview.status === "scheduled"
                              ? "bg-green-500/10 text-green-400"
                              : interview.status === "completed"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {interview.status}
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        size="small"
                        leftIcon={<Play className="w-3 h-3" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/interview-room?id=${interview.meetingId}`);
                        }}
                      >
                        Join
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Schedule Interview",
                icon: <Calendar className="w-5 h-5" />,
                action: () => navigate("/create-interview"),
                show: user?.role === "interviewer",
              },
              {
                label: "View Reports",
                icon: <TrendingUp className="w-5 h-5" />,
                action: () => {},
              },
              {
                label: "Manage Candidates",
                icon: <Users className="w-5 h-5" />,
                action: () => {},
                show: user?.role === "interviewer",
              },
              {
                label: "Settings",
                icon: <MoreVertical className="w-5 h-5" />,
                action: () => {},
              },
            ]
              .filter((action) => action.show !== false)
              .map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.action}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center text-indigo-400">
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    {action.label}
                  </span>
                </motion.button>
              ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;