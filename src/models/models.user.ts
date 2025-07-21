import { timeStamp } from "console";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
   name:{
     type: String,
   },
   email: {
    type:String,
    lowercase:true,
    unique:true,
    required : [true, "email is required"],
   },
   password :{
    type:String,
    required : true,
   }
},{
    timestamps: true
});

export const User = mongoose.model("user", userSchema)