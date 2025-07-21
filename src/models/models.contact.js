"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const contactschema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        lowercase: false
    },
    avatar: {
        type: String
    },
    phoneNumber: {
        type: Number,
        required: [true, "Phone number is required"],
        unique: true
    },
    address: {
        type: String,
        required: false,
    },
    label: {
        type: String,
        enum: {
            values: ['Work', 'School', 'Friends', 'Family']
        },
    },
    bookmarked: {
        type: Boolean,
        default: false
    },
    // user:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:'User',
    //     required:true
    // }    
}, { timestamps: true });
exports.Contact = mongoose_1.default.model("Contact", contactschema);
