import mongoose from "mongoose";

const interviewSchema=new mongoose.Schema(
    {
        interviewer:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
         candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      default: "scheduled",
    },

    meetingId: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);


const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
    
