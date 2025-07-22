import { Request, Response } from "express";
import mongoose from "mongoose";

import { DB_NAME } from "../constants";

   

console.log("Connecting to MongoDB at:", process.env.MONGODB_URI);

console.log("MONGO URI:", process.env.MONGODB_URI);

const connectDB = async()=>{
        console.log('Connecting to:', process.env.MONGODB_URI);
    try {
         console.log('Connecting to:', process.env.MONGODB_URI);
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI as string}/${DB_NAME}`)
       console.log('Connecting to:', process.env.MONGODB_URI);

       console.log(`\nMongoDB connected !! DB HOST :${connectionInstance.connection.host}`);
    } catch(error){
        console.log("MONDODB connection failed", error);
        process.exit(1)
    }
}

export default connectDB