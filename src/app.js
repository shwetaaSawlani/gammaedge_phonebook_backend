"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const ApiError_js_1 = require("./utils/ApiError.js");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_js_1 = require("./swagger.js");
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json({ limit: "2mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "2mb" }));
app.use(express_1.default.static("public"));
app.use((0, cookie_parser_1.default)());
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_js_1.swaggerSpec));
//routes
const routes_contact_1 = __importDefault(require("./routes/routes.contact"));
app.use("/api/v1/contact", routes_contact_1.default);
const routes_User_1 = __importDefault(require("./routes/routes.User"));
app.use("/api/v1/user", routes_User_1.default);
// app.use((err:Error, req:Request, res:Response, next:NextFunction) => {
//   console.error("Global Error:", err.message);
//   res.status(500).json({
//     success: false,
//     message: err.message || "Internal Server Error",
//   });
// });
app.use((err, _req, res, _next) => {
    console.error("Global Error Caught:", err);
    if (err instanceof ApiError_js_1.ApiError) {
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
});
