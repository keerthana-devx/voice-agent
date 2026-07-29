import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Users,
  Calendar,
  Clock,
  Briefcase,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import api from "../api/axios";

const CreateInterview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    candidate: "",
    role: "",
    date: "",
    time: "",
  });

  const roles = [
    "Software Engineer",
    "Product Manager",
    "Data Scientist",
    "UX Designer",
    "DevOps Engineer",
    "Product Designer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "ML Engineer",
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/interview/create", {
        interviewer: user._id,
        candidate: formData.candidate,
        role: formData.role,
        date: new Date(`${formData.date}T${formData.time}`).toISOString(),
      });

      if (response.status === 201) {
        setSuccess("Interview created successfully!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (err) {
      console.error("Error creating interview:", err);
      setError(err.response?.data?.message || "Failed to create interview");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Schedule Interview</h1>
              <p className="text-gray-400">
                Create a new interview session with AI-powered analysis
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-400 text-sm">{success}</span>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-400 text-sm">{error}</span>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Candidate ID */}
                <div className="md:col-span-2">
                  <Input
                    label="Candidate User ID"
                    type="text"
                    name="candidate"
                    value={formData.candidate}
                    onChange={handleChange}
                    placeholder="Enter candidate's MongoDB user ID"
                    leftIcon={<User className="w-5 h-5" />}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    The candidate must be registered in the system. You can find their user ID in the user management section.
                  </p>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Position / Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role} value={role} className="bg-[#131323]">
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <Input
                  label="Interview Date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  leftIcon={<Calendar className="w-5 h-5" />}
                  required
                />

                {/* Time */}
                <Input
                  label="Interview Time"
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  leftIcon={<Clock className="w-5 h-5" />}
                  required
                />
              </div>

              {/* Info Card */}
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      AI-Powered Analysis
                    </h3>
                    <p className="text-sm text-gray-400">
                      Our AI will analyze the candidate's communication skills,
                      technical knowledge, and cultural fit during the interview.
                      You'll receive a detailed report immediately after the
                      session.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  {isLoading ? "Creating..." : "Schedule Interview"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateInterview;