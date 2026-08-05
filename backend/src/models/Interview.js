import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    meetingId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to improve query performance
interviewSchema.index({ meetingId: 1 }, { unique: true });
interviewSchema.index({ date: 1 });
interviewSchema.index({ interviewer: 1 });
interviewSchema.index({ candidate: 1 });

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
