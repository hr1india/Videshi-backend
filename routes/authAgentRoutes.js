import express from "express";
import {
  register,
  login,
  logout,
  editProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authAgent.js";

const router = express.Router();

// Manual authentication
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.put("/edit-profile", editProfile); 

// Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes example
router.get("/profile",(req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
