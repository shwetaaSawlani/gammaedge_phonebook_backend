"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
// import dotenv from 'dotenv';
// dotenv.config();
const db_1 = __importDefault(require("./db/db"));
const app_1 = require("./app");
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
app_1.app.use((0, cookie_parser_1.default)());
const options = {
    key: fs_1.default.readFileSync('key.pem', 'utf8'),
    cert: fs_1.default.readFileSync('certificate.pem', 'utf8')
};
const httpsServer = https_1.default.createServer(options, app_1.app);
(0, db_1.default)()
    .then(() => {
    httpsServer.listen(`${process.env.PORT}`, () => {
        console.log(`HTTPS server listening on port ${process.env.PORT}`);
    });
})
    .catch((err) => {
    console.log("MongoDb coonection fail !!!!", err);
});
