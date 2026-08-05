import http from "http";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import authRoute from "./routes/auth.route.js";
import interviewRoute from "./routes/interview.route.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { initSocket } from "./socket/socket.js";

const app = express();

// 1) Env loaded via ENV import

// 2) Body parser
app.use(express.json());

// 3) Security and logging middlewares
if (ENV.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(helmet());

const corsOptions = {
  origin: ENV.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use(apiLimiter);

// 4) Connect to DB before routes
connectDB();

// 5) Routes
app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is running" });
});

app.use("/api/auth", authRoute);
app.use("/api/interview", interviewRoute);

// 6) 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Not Found" });
});

// 7) Centralized error handler
app.use(errorHandler);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = initSocket(server);

// Start server
server.listen(ENV.PORT, () => console.log("server is running on port:", ENV.PORT));
