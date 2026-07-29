import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  Mic,
  Video,
  Brain,
  Zap,
  Shield,
  Globe,
  ChevronRight,
  Play,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: "Voice Recognition",
      description:
        "Advanced AI-powered voice analysis for accurate speech-to-text transcription and sentiment detection.",
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Video Interviews",
      description:
        "Seamless HD video conferencing with real-time AI assistance and automated recording.",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Analysis",
      description:
        "Deep learning algorithms analyze candidate responses, body language, and communication skills.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Feedback",
      description:
        "Real-time scoring and detailed feedback reports generated immediately after each interview.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Platform",
      description:
        "Enterprise-grade security with end-to-end encryption and GDPR compliance.",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Reach",
      description:
        "Conduct interviews across time zones with automatic scheduling and multi-language support.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Interviews Conducted" },
    { value: "500+", label: "Companies Trust Us" },
    { value: "95%", label: "Satisfaction Rate" },
    { value: "50+", label: "Countries Reached" },
  ];

  const testimonials = [
    {
      quote:
        "Talent IQ has revolutionized our hiring process. We've reduced interview time by 60% while improving candidate quality.",
      author: "Sarah Chen",
      role: "HR Director",
      company: "TechCorp",
    },
    {
      quote:
        "The AI insights are incredibly accurate. It's like having a team of expert interviewers analyzing every candidate.",
      author: "Michael Roberts",
      role: "Talent Acquisition Lead",
      company: "StartupX",
    },
    {
      quote:
        "Finally, a platform that understands the nuances of remote interviewing. Our global hiring has never been easier.",
      author: "Priya Sharma",
      role: "CEO",
      company: "GlobalTech",
    },
  ];

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
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-[blob_7s_infinite]" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-[blob_7s_infinite_2s]" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-[blob_7s_infinite_4s]" />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Talent IQ</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="#features"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              to="#testimonials"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Testimonials
            </Link>
            <Link
              to="#pricing"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="small"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
            <Button onClick={() => navigate("/register")}>Get Started</Button>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-16 left-0 right-0 mx-6 p-6 rounded-2xl bg-[#131323]/95 backdrop-blur-xl border border-white/10"
          >
            <div className="flex flex-col gap-4">
              <Link
                to="#features"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                to="#testimonials"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Testimonials
              </Link>
              <Link
                to="#pricing"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
                <Button fullWidth onClick={() => navigate("/register")}>
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Interview Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Revolutionize Your{" "}
              <span className="gradient-text">Hiring Process</span>
              <br />
              with Intelligent Interviews
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Talent IQ combines cutting-edge AI with seamless video
              conferencing to deliver insightful, efficient, and bias-free
              candidate evaluations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button
                size="large"
                onClick={() => navigate("/register")}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Start Free Trial
              </Button>
              <Button
                variant="secondary"
                size="large"
                leftIcon={<Play className="w-5 h-5" />}
              >
                Watch Demo
              </Button>
            </div>

            {/* Hero Image/Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative max-w-5xl mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-500/20">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
                  alt="Dashboard Preview"
                  className="w-full"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powerful Features for{" "}
              <span className="gradient-text">Modern Hiring</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to conduct world-class interviews, powered by
              advanced AI technology.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card hover className="h-full p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center mb-4">
                    <div className="text-indigo-400">{feature.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 px-6 py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Loved by{" "}
              <span className="gradient-text">Industry Leaders</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See what hiring managers and recruiters are saying about Talent
              IQ.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {testimonial.author[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {testimonial.author}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-32">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to Transform Your Hiring?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of companies using Talent IQ to make better
                hiring decisions faster.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="large"
                  variant="secondary"
                  onClick={() => navigate("/register")}
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                >
                  Start Free Trial
                </Button>
                <Button
                  size="large"
                  className="bg-white text-indigo-600 hover:bg-gray-100"
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Talent IQ</span>
              </div>
              <p className="text-gray-500 text-sm">
                AI-powered interview platform for modern hiring teams.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    GDPR
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} Talent IQ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;