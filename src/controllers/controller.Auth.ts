
import { Request, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {User} from "../models/models.user"
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import {Blacklist} from "../models/models.blacklist";
import {validator} from "../utils/PasswordValidator"
import * as EmailValidator from 'email-validator';

const registerUser = asyncHandler(async (req: Request, res: Response) => {
    
    const { username, email, password } = req.body;
    
    if (!email || !password) {
        throw new ApiError(400, "Email and Password are required to Register");
    }
     const verifyEmail = EmailValidator.validate(email);

    if(!verifyEmail){
        throw new ApiError(400, "Email is not valid")
    }

   const result = validator.validate(password);
   
   if (!result.valid) {
   res.send(result.errors);
   }
  
    const lowercasedEmail = email.toLowerCase();
    const userExist = await User.findOne({ email: lowercasedEmail });
    
    if (userExist) {
        throw new ApiError(409, "User already exists with this email. Please log in or use a different email.");
    }

    const hashedPassword = await bcrypt.hash(password, 10); 
    const user = await User.create({ name : username, email: lowercasedEmail, password: hashedPassword });

    if (!user) {
        throw new ApiError(500, "Failed to create user. Please try again.");
    }

    const jwtSecret = process.env.JWT_SECRET;
    const payload  = {id: user._id};
    const refresh = process.env.REFRESH_SECRET;


    const accessToken = jwt.sign(
        payload,
        jwtSecret as string, 
    );

    if(!accessToken){
        throw new ApiError(400, "failed to assign token")
    }

    const refreshToken = jwt.sign(payload, refresh as string);

     if(!refreshToken){
        throw new ApiError(400, "failed to asign refreshToken")
     }  

     res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge:   7* 60*60 * 1000
        });

    res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false,
                  sameSite: 'lax',
            maxAge:  60 * 1000
        });
    
   console.log("username", user.name);
    res.status(201).json( 
        new ApiResponse(201, 
            {
                user: {
                    _id: user._id,
                    username: user.name,
                    email: user.email,
                },
                accessToken
            }, "User registered successfully"
        )
    );

});



const login = asyncHandler (async (req: Request, res:Response)=>{
    const {email, password } = req.body; 

    if (!email || !password) {
        throw new ApiError(400, "Email and Password are required to Register");
    }

const user = await User.findOne({ email }); 
if (!user) {
    throw new ApiError(404, "cannot find user with this email, Please Register");
}
const isMatch = await bcrypt.compare(password, user.password); 

if(!isMatch){
       throw new ApiError(400, "Invalid Credentials");
}
    const payload  = {id: user._id};
    const refresh = process.env.REFRESH_SECRET;
 
const accessToken = jwt.sign(payload, `${process.env.JWT_SECRET}`); 
  

    const refreshToken = jwt.sign(payload, refresh as string);
    if(!refreshToken){
        throw new ApiError(400, "failed to asign refreshToken")
     }   

     res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
                  sameSite: 'lax',
            maxAge:  7*60 *60 * 1000
        });

          res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false,
                  sameSite: 'lax',
            maxAge:  60 * 1000
        });
     

res.status(200).json (new ApiResponse(200, {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                },
                accessToken
}, "user logged in succesfully"));
});
 



const logout = asyncHandler(async(req:Request, res: Response)=>{
     const authHeader = req.headers.authorization;
    
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    throw new ApiError(401, "Access Denied / Unauthorized request: No token provided or invalid format.");
  }
 const token = authHeader.split(' ')[1];
 
  if (!token) { 
    throw new ApiError(401, "Access Denied / Unauthorized request: Token is missing.");
  }
  
  if (token === 'null') { 
    throw new ApiError(401, "Access Denied / Unauthorized request: Token is invalid (null string).");
  }
   console.log(token);

  const checkIfBlacklisted = await Blacklist.findOne({ token: token });
    if (checkIfBlacklisted) {
     throw new ApiError(400, "Please login Again");
    }
    const blacklist = await Blacklist.create({ token: token });
    res.status(200).json(new ApiResponse(200, blacklist , "you are logged out!!!"));
});



const accessToken = asyncHandler(async (req: Request, res: Response) => {
  console.log("inside refresh");
  console.log(req);

  const refresh = req.cookies.refreshToken;
  console.log(refresh)
  if (!refresh) {
    throw new ApiError(400, "Refresh Token not found");
  }

  try {
    const decoded = jwt.verify(refresh, `${process.env.REFRESH_SECRET}`) as jwt.JwtPayload;

    if (!decoded || !decoded.id) {
      throw new ApiError(401, "Refresh token is invalid or expired. Please log in again.");
    }

    const newAccessToken = jwt.sign({ id: decoded.id }, `${process.env.JWT_SECRET}`);

    res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: false,       sameSite: 'lax',   maxAge:  60 * 1000});
    res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, "New access token generated"));
  } catch (err) {
    console.error("Error refreshing token:", err);
    throw new ApiError(401, "Token refresh failed. Please log in again.");
  }
});


export { registerUser, login, logout, accessToken}

