"use strict";
// class ApiError extends Error{
//     statusCode: number;
//     data: null;
//     success: false;
//     errors: any[];
//     constructor(
//         statusCode:number, 
//         message :string = "Something Went Wrong",
//         error =[],
//         stack=""
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
//     ){
//         super(message)
//         this.statusCode=statusCode
//         this.data = null                              
//         this.message=message
//         this.success= false
//         this.errors= error
//     if(stack){
//         this.stack= stack
//     } else{
//         Error.captureStackTrace(this)
//     }
// }
// }
// export{ApiError}
class ApiError extends Error {
    constructor(statusCode, message = "Something Went Wrong", errors = [], stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.success = false;
        this.errors = errors;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.ApiError = ApiError;
