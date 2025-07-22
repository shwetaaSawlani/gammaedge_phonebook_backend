
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

  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {

    throw new ApiError(401, "Access Denied / Unauthorized request: No access token cookie provided.");
  }

  try {

    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET as string) as JwtPayload;
    if (!decodedToken || !decodedToken.id) {
        throw new ApiError(401, "Invalid token payload: User ID missing.");
    }
    const user = await User.findById(decodedToken.id).select('-password -refreshToken') as JwtPayload;

    if (!user) {
      throw new ApiError(401, "Access Denied / Unauthorized request: User not found or token invalid.");
    }

    req.user = user; 

    console.log("User verified from accessToken cookie:", user); 
    next();
  } catch (error: any) {
   
    console.error("Access token verification failed from cookie:", error.message);
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, "Access Denied / Unauthorized request: Access token expired. Please log in again.");
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, "Access Denied / Unauthorized request: Invalid access token. Please log in again.");
    }

    throw new ApiError(500, "Authentication failed due to token error.");
  }
});


export { verifyUserToken, verifyUserTokenFromCookie };