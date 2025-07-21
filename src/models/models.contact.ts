import mongoose from "mongoose";

const contactschema= new mongoose.Schema({
    name:{
        type: String,
        required: [true, "Name is required" ],
        lowercase: false
    },
    avatar:{
        type : String
    },
    phoneNumber:{
        type: Number,
        required: [true, "Phone number is required" ],
        unique:true
    },
    address:{
        type: String,
        required: false,
    },
    label:{
        type:String,
        enum:{
            values:['Work', 'School', 'Friends', 'Family']
        },

    },
    bookmarked: { 
        type: Boolean, 
        default: false },
        // user:{
        //     type:mongoose.Schema.Types.ObjectId,
        //     ref:'User',
        //     required:true
        // }    

}, {timestamps:true})

export const Contact = mongoose.model("Contact", contactschema)