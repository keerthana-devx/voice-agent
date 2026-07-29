import express from "express";
import Interview from "../models/Interview.js";

const router = express.Router();

// Get interviews for a specific user (either as interviewer or candidate)
router.get("/my-interviews/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Find interviews where user is either interviewer or candidate
        const interviews = await Interview.find({
            $or: [
                { interviewer: userId },
                { candidate: userId }
            ]
        })
        .populate("interviewer", "name email")
        .populate("candidate", "name email")
        .sort({ date: -1 });

        res.status(200).json({
            message: "Interviews fetched successfully",
            interviews
        });

    } catch (error) {
        console.error("Error fetching interviews:", error);
        res.status(500).json({
            message: error.message
        });
    }
});

// Get single interview by meeting ID
router.get("/meeting/:meetingId", async (req, res) => {
    try {
        const { meetingId } = req.params;

        const interview = await Interview.findOne({ meetingId })
            .populate("interviewer", "name email")
            .populate("candidate", "name email");

        if (!interview) {
            return res.status(404).json({
                message: "Interview not found"
            });
        }

        res.status(200).json({
            message: "Interview fetched successfully",
            interview
        });

    } catch (error) {
        console.error("Error fetching interview:", error);
        res.status(500).json({
            message: error.message
        });
    }
});

// Update interview status
router.patch("/:interviewId/status", async (req, res) => {
    try {
        const { interviewId } = req.params;
        const { status } = req.body;

        const updatedInterview = await Interview.findByIdAndUpdate(
            interviewId,
            { status },
            { new: true }
        )
        .populate("interviewer", "name email")
        .populate("candidate", "name email");

        if (!updatedInterview) {
            return res.status(404).json({
                message: "Interview not found"
            });
        }

        res.status(200).json({
            message: "Interview status updated successfully",
            interview: updatedInterview
        });

    } catch (error) {
        console.error("Error updating interview:", error);
        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/create", async (req, res) => {

    try {

        const {
            interviewer,
            candidate,
            role,
            date
        } = req.body;


        const meetingId = Math.random()
            .toString(36)
            .substring(2,10);


        const newInterview = new Interview({
            interviewer,
            candidate,
            role,
            date,
            meetingId
        });


        await newInterview.save();
        console.log("Saved interview:", newInterview);


        res.status(201).json({
            message: "Interview created successfully",
            interview: newInterview
        });


    } catch(error){

        res.status(500).json({
            message:error.message
        });

    }

});


export default router;