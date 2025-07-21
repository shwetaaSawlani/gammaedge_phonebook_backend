"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.accessToken = exports.logout = exports.login = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_user_1 = require("../models/models.user");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const models_blacklist_1 = require("../models/models.blacklist");
const PasswordValidator_1 = require("../utils/PasswordValidator");
const EmailValidator = __importStar(require("email-validator"));
const registerUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    if (!email || !password) {
        throw new ApiError_1.ApiError(400, "Email and Password are required to Register");
    }
    const verifyEmail = EmailValidator.validate(email);
    if (!verifyEmail) {
        throw new ApiError_1.ApiError(400, "Email is not valid");
    }
    const result = PasswordValidator_1.validator.validate(password);
    if (!result.valid) {
        res.send(result.errors);
    }
    const lowercasedEmail = email.toLowerCase();
    const userExist = yield models_user_1.User.findOne({ email: lowercasedEmail });
    if (userExist) {
        throw new ApiError_1.ApiError(409, "User already exists with this email. Please log in or use a different email.");
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
    const user = yield models_user_1.User.create({ name: username, email: lowercasedEmail, password: hashedPassword });
    if (!user) {
        throw new ApiError_1.ApiError(500, "Failed to create user. Please try again.");
    }
    const jwtSecret = process.env.JWT_SECRET;
    const payload = { id: user._id };
    const refresh = process.env.REFRESH_SECRET;
    const accessToken = jsonwebtoken_1.default.sign(payload, jwtSecret);
    if (!accessToken) {
        throw new ApiError_1.ApiError(400, "failed to assign token");
    }
    const refreshToken = jsonwebtoken_1.default.sign(payload, refresh);
    if (!refreshToken) {
        throw new ApiError_1.ApiError(400, "failed to asign refreshToken");
    }
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 60 * 60 * 1000
    });
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 1000
    });
    console.log("username", user.name);
    res.status(201).json(new ApiResponse_1.ApiResponse(201, {
        user: {
            _id: user._id,
            username: user.name,
            email: user.email,
        },
        accessToken
    }, "User registered successfully"));
}));
exports.registerUser = registerUser;
const login = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError_1.ApiError(400, "Email and Password are required to Register");
    }
    const user = yield models_user_1.User.findOne({ email });
    if (!user) {
        throw new ApiError_1.ApiError(404, "cannot find user with this email, Please Register");
    }
    const isMatch = yield bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError_1.ApiError(400, "Invalid Credentials");
    }
    const payload = { id: user._id };
    const refresh = process.env.REFRESH_SECRET;
    const accessToken = jsonwebtoken_1.default.sign(payload, `${process.env.JWT_SECRET}`);
    const refreshToken = jsonwebtoken_1.default.sign(payload, refresh);
    if (!refreshToken) {
        throw new ApiError_1.ApiError(400, "failed to asign refreshToken");
    }
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 60 * 60 * 1000
    });
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 1000
    });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, {
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
        },
        accessToken
    }, "user logged in succesfully"));
}));
exports.login = login;
const logout = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        throw new ApiError_1.ApiError(401, "Access Denied / Unauthorized request: No token provided or invalid format.");
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new ApiError_1.ApiError(401, "Access Denied / Unauthorized request: Token is missing.");
    }
    if (token === 'null') {
        throw new ApiError_1.ApiError(401, "Access Denied / Unauthorized request: Token is invalid (null string).");
    }
    console.log(token);
    const checkIfBlacklisted = yield models_blacklist_1.Blacklist.findOne({ token: token });
    if (checkIfBlacklisted) {
        throw new ApiError_1.ApiError(400, "Please login Again");
    }
    const blacklist = yield models_blacklist_1.Blacklist.create({ token: token });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, blacklist, "you are logged out!!!"));
}));
exports.logout = logout;
const accessToken = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside refresh");
    console.log(req);
    const refresh = req.cookies.refreshToken;
    console.log(refresh);
    if (!refresh) {
        throw new ApiError_1.ApiError(400, "Refresh Token not found");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refresh, `${process.env.REFRESH_SECRET}`);
        if (!decoded || !decoded.id) {
            throw new ApiError_1.ApiError(401, "Refresh token is invalid or expired. Please log in again.");
        }
        const newAccessToken = jsonwebtoken_1.default.sign({ id: decoded.id }, `${process.env.JWT_SECRET}`);
        res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 60 * 1000 });
        res.status(200).json(new ApiResponse_1.ApiResponse(200, { accessToken: newAccessToken }, "New access token generated"));
    }
    catch (err) {
        console.error("Error refreshing token:", err);
        throw new ApiError_1.ApiError(401, "Token refresh failed. Please log in again.");
    }
}));
exports.accessToken = accessToken;
