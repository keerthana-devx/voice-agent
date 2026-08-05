import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  DB_URL: process.env.DB_URL || "mongodb://localhost:27017/voice-agent",
  JWT_SECRET: process.env.JWT_SECRET || "change_this_jwt_secret_in_production",
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
};
