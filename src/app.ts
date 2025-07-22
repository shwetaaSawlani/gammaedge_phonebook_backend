import express , { Request, Response, NextFunction } from "express";
import { ApiError } from "./utils/ApiError.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

const app = express()

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

app.use(express.json({limit: "2mb"}))
app.use(express.urlencoded({extended:true, limit:"2mb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//routes

import contactRouter from './routes/routes.contact'
app.use("/api/v1/contact", contactRouter)

import userRouter from './routes/routes.User'
app.use("/api/v1/user", userRouter)


// app.use((err:Error, req:Request, res:Response, next:NextFunction) => {
//   console.error("Global Error:", err.message);
//   res.status(500).json({
//     success: false,
//     message: err.message || "Internal Server Error",
//   });
// });

app.use(
  (err: unknown,  _req: Request,res: Response, _next: NextFunction ) => {
    console.error("Global Error Caught:", err);
    if (err instanceof ApiError) {
  
      return res.status(err.statusCode).json({
        success: err.success,
        message: err.message,
        errors: err.errors,
        data: err.data,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error", 
      errors: [err instanceof Error ? err.message : "An unexpected error occurred"],
    });
  }
);
export { app }; 