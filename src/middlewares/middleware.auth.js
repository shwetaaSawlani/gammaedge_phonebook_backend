"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUserTokenFromCookie = exports.verifyUserToken = void 0;
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_user_1 = require("../models/models.user");
const verifyUserToken = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError_1.ApiError(401, "Access Denied / Unauthorized request: No token provided or invalid format.");
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new ApiError_1.ApiError(401, "Access Denied / Unauthorized request: Token is missing.");
    }
    try {
        const verifiedUser = jsonwebtoken_1.default.verify(token, `${process.env.JWT_SECRET}`);
        req.user = verifiedUser;
        console.log(verifiedUser);
        console.log("user is verfified");
        next();
    }
    catch (err) {
        throw new ApiError_1.ApiError(401, "Error during token verfication / user is unauthorized");
    }
}));
exports.verifyUserToken = verifyUserToken;
const verifyUserTokenFromCookie = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // 1. Get the token from the 'accessToken' cookie
    const accessToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken; // Use optional chaining for safety
    if (!accessToken) {
        // If no access token cookie is found, the request is unauthorized
        throw new ApiError_1.ApiError(401, "Access Denied / Unauthorized request: No access token cookie provided.");
    }
    // 2. Verify the token
    try {
        // Ensure process.env.JWT_SECRET is treated as a string
        const decodedToken = jsonwebtoken_1.default.verify(accessToken, process.env.JWT_SECRET);
        // Optional: Fetch user details from DB to ensure user still exists and is active
        // If your JWT payload already contains all necessary user info (e.g., email, username),
        // and you don't need to check against the DB on every request, you can skip this DB lookup.
        // However, fetching from DB adds an extra layer of security (e.g., if user was disabled).
        if (!decodedToken || !decodedToken.id) {
            throw new ApiError_1.ApiError(401, "Invalid token payload: User ID missing.");
        }
        const user = yield models_user_1.User.findById(decodedToken.id).select('-password -refreshToken');
        if (!user) {
            // User not found in DB or token refers to a non-existent user
            throw new ApiError_1.ApiError(401, "Access Denied / Unauthorized request: User not found or token invalid.");
        }
        // 3. Attach the decoded payload (or the fetched user object) to the request
        req.user = user; // Attach the user object for downstream use
        console.log("User verified from accessToken cookie:", user); // Log for debugging
        next(); // Proceed to the next middleware/route handler
    }
    catch (error) {
        // Handle specific JWT errors
        console.error("Access token verification failed from cookie:", error.message);
        if (error.name === 'TokenExpiredError') {
            throw new ApiError_1.ApiError(401, "Access Denied / Unauthorized request: Access token expired. Please log in again.");
        }
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError_1.ApiError(401, "Access Denied / Unauthorized request: Invalid access token. Please log in again.");
        }
        // Generic error for other unexpected JWT issues
        throw new ApiError_1.ApiError(500, "Authentication failed due to token error.");
    }
}));
exports.verifyUserTokenFromCookie = verifyUserTokenFromCookie;
