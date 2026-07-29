import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;


        const user = await User.findOne({ email });


        if(!user){
            return res.status(404).json({
                message:"User not found"
            });
        }


        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );


        if(!isPasswordCorrect){
            return res.status(400).json({
                message:"Invalid password"
            });
        }


        const token = jwt.sign(
            { id:user._id },
            "secretkey",
            { expiresIn:"7d" }
        );


        res.status(200).json({
            message:"Login successful",
            token,
            user:{
                name:user.name,
                email:user.email,
                role:user.role
            }
        });


    } catch(error){

        res.status(500).json({
            message:error.message
        });

    }

});


router.post("/register", async (req, res) => {

    try {

        const { name, email, password, role } = req.body;


        const existingUser = await User.findOne({ email });

        if(existingUser){
            return res.status(400).json({
                message:"User already exists"
            });
        }


        const hashedPassword = await bcrypt.hash(password,10);


        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role
        });


        await newUser.save();


        res.status(201).json({
            message:"User registered successfully"
        });


    } catch(error){

        res.status(500).json({
            message:error.message
        });

    }

});


export default router;