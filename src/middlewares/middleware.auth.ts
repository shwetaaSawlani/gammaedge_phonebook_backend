
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/models.user";

interface JwtPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}


const verifyUserToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, "Access Denied / Unauthorized request: No token provided or invalid format.");
  }

  const token = authHeader.split(' ')[1];


  if (!token) { 
    throw new ApiError(401, "Access Denied / Unauthorized request: Token is missing.");
  }
  

    try{
    const verifiedUser = jwt.verify(token, `${process.env.JWT_SECRET}`) as JwtPayload; 

    req.user = verifiedUser;

    console.log(verifiedUser);

   console.log("user is verfified");

   next();

    }catch(err){
      throw new ApiError(401, "Error during token verfication / user is unauthorized");
    }
 
});


const verifyUserTokenFromCookie = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // 1. Get the token from the 'accessToken' cookie
  const accessToken = req.cookies?.accessToken; // Use optional chaining for safety

  if (!accessToken) {
    // If no access token cookie is found, the request is unauthorized
    throw new ApiError(401, "Access Denied / Unauthorized request: No access token cookie provided.");
  }

  // 2. Verify the token
  try {
    // Ensure process.env.JWT_SECRET is treated as a string
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET as string) as JwtPayload;

    // Optional: Fetch user details from DB to ensure user still exists and is active
    // If your JWT payload already contains all necessary user info (e.g., email, username),
    // and you don't need to check against the DB on every request, you can skip this DB lookup.
    // However, fetching from DB adds an extra layer of security (e.g., if user was disabled).
    if (!decodedToken || !decodedToken.id) {
        throw new ApiError(401, "Invalid token payload: User ID missing.");
    }
    const user = await User.findById(decodedToken.id).select('-password -refreshToken') as JwtPayload;

    if (!user) {
      // User not found in DB or token refers to a non-existent user
      throw new ApiError(401, "Access Denied / Unauthorized request: User not found or token invalid.");
    }

    // 3. Attach the decoded payload (or the fetched user object) to the request
    req.user = user; // Attach the user object for downstream use

    console.log("User verified from accessToken cookie:", user); // Log for debugging
    next(); // Proceed to the next middleware/route handler

  } catch (error: any) {
    // Handle specific JWT errors
    console.error("Access token verification failed from cookie:", error.message);
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, "Access Denied / Unauthorized request: Access token expired. Please log in again.");
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, "Access Denied / Unauthorized request: Invalid access token. Please log in again.");
    }
    // Generic error for other unexpected JWT issues
    throw new ApiError(500, "Authentication failed due to token error.");
  }
});

export { verifyUserToken, verifyUserTokenFromCookie };