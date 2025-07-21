import { Router } from "express";
import { registerUser,login, logout,accessToken } from "../controllers/controller.Auth";
// import {home} from "../controllers/controller.contact"
import { verifyUserToken } from "../middlewares/middleware.auth";

let router=  Router()

router.route("/register").post(registerUser);
router.route("/login/").post(login);
// router.route("/home").get(verifyUserToken, home);
router.route("/logout").post(logout);

router.route("/generatetoken").post(accessToken);

export default router