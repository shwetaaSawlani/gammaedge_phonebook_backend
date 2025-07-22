require('dotenv').config()
import connectDB from "./db/db";
import { app } from "./app";
import https from "https";
import fs from "fs";
import cookieParser from 'cookie-parser';
app.use(cookieParser());

const options = {
  key: fs.readFileSync('key.pem','utf8'),
  cert: fs.readFileSync('certificate.pem', 'utf8')
};

const httpsServer = https.createServer(options, app);

connectDB()
.then(()=>{
    httpsServer.listen(`${process.env.PORT}`, () => {
  console.log(`HTTPS server listening on port ${process.env.PORT}`);
});
})
.catch((err)=>{
    console.log("MongoDb coonection fail !!!!", err);
})


