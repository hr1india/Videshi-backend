import express from "express";
import { signup, login, socialAuth } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/social-auth", socialAuth);

export default router;
