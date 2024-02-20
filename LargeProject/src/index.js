import dotenv from "dotenv"
import mongoose from "mongoose"

import connectDb from "./db/index.js"

dotenv.config({
    path: "./env"
})

connectDb();

/*
const express = require('express');
const app = express();
 ( async () => {
    try {
        await mongoose.connect(`${precess.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (err) => {
            console.log("error", err);
            throw err;
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
        
    } catch (error) {
        console.error("error", error);
        throw error
    }
})() */