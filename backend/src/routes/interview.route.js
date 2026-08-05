import express from "express";
import { body, validationResult } from "express-validator";
import Interview from "../models/Interview.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Helper: format validation errors
const formatValidationErrors = (errorsArray) =>
  errorsArray.map((e) => ({ field: e.param, message: e.msg }));

// Get interviews for the authenticated user (either as interviewer or candidate)
router.get("/my-interviews", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find interviews where user is either interviewer or candidate
    const interviews = await Interview.find({
      $or: [{ interviewer: userId }, { candidate: userId }],
    })
      .populate("interviewer", "name email")
      .populate("candidate", "name email")
      .sort({ date: -1 });

    return res.status(200).json({ message: "Interviews fetched successfully", interviews });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Get single interview by meeting ID (only if user is part of the interview)
router.get("/meeting/:meetingId", requireAuth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const interview = await Interview.findOne({ meetingId })
      .populate("interviewer", "name email")
      .populate("candidate", "name email");

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const userId = req.user._id.toString();
    const interviewerId = interview.interviewer._id ? interview.interviewer._id.toString() : interview.interviewer.toString();
    const candidateId = interview.candidate._id ? interview.candidate._id.toString() : interview.candidate.toString();

    if (userId !== interviewerId && userId !== candidateId) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    return res.status(200).json({ message: "Interview fetched successfully", interview });
  } catch (error) {
    console.error("Error fetching interview:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Update interview status (only participants can update)
router.patch(
  "/:interviewId/status",
  requireAuth,
  body("status").isString().isLength({ min: 1 }).withMessage("Status is required"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed", errors: formatValidationErrors(errors.array()) });
      }

      const { interviewId } = req.params;
      const { status } = req.body;

      const interview = await Interview.findById(interviewId);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      const userId = req.user._id.toString();
      const interviewerId = interview.interviewer.toString();
      const candidateId = interview.candidate.toString();

      if (userId !== interviewerId && userId !== candidateId) {
        return res.status(403).json({ message: "Forbidden: Access denied" });
      }

      interview.status = status;
      await interview.save();

      const updatedInterview = await Interview.findById(interviewId)
        .populate("interviewer", "name email")
        .populate("candidate", "name email");

      return res.status(200).json({ message: "Interview status updated successfully", interview: updatedInterview });
    } catch (error) {
      console.error("Error updating interview:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

// Create interview - only allow creating interviews where the authenticated user is one of the participants
router.post(
  "/create",
  requireAuth,
  body("interviewer").isMongoId().withMessage("Interviewer must be a valid user id"),
  body("candidate").isMongoId().withMessage("Candidate must be a valid user id"),
  body("role").isString().notEmpty().withMessage("Role is required"),
  body("date").optional().isISO8601().withMessage("Date must be a valid ISO8601 date"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed", errors: formatValidationErrors(errors.array()) });
      }

      const { interviewer, candidate, role, date } = req.body;
      const userId = req.user._id.toString();

      // The creator must be part of the interview (either interviewer or candidate)
      if (userId !== interviewer && userId !== candidate) {
        return res.status(403).json({ message: "Forbidden: You can only create interviews for yourself" });
      }

      const meetingId = Math.random().toString(36).substring(2, 10);

      const newInterview = new Interview({ interviewer, candidate, role, date, meetingId });
      await newInterview.save();

      const populated = await Interview.findById(newInterview._id)
        .populate("interviewer", "name email")
        .populate("candidate", "name email");

      return res.status(201).json({ message: "Interview created successfully", interview: populated });
    } catch (error) {
      console.error("Error creating interview:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

export default router;
