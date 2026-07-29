import express from "express";
import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import authRoute from "./routes/auth.route.js";
import interviewRoute from "./routes/interview.route.js"


const app=express();

console.log(ENV.PORT);
console.log(ENV.DB_URL);


app.get("/health",(req,res)=>{
    res.status(200).json({msg:"api is running"});

});
connectDB();
app.use(express.json());
app.use("/api/auth",authRoute);
app.use("/api/interview", interviewRoute);

app.listen(ENV.PORT,()=>console.log("server is running on port:",ENV.PORT));
