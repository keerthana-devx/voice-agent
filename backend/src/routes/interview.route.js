import express from "express";
import Interview from "../models/Interview.js";

const router = express.Router();


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