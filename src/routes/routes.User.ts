import { Router } from "express";
import { registerUser,login, logout,accessToken } from "../controllers/controller.Auth";

let router=  Router()

router.route("/register").post(registerUser);
router.route("/login/").post(login);
router.route("/logout").post(logout);
router.route("/generatetoken").post(accessToken);

export default router