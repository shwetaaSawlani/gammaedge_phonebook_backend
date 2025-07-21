
import mongoose from "mongoose";
const BlacklistSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
        },
        user:{
            type:mongoose.Schema.Types.ObjectId,
             ref: "User",
        }        
        
    },
    { timestamps: true }
);
export const Blacklist= mongoose.model("blacklist", BlacklistSchema);
