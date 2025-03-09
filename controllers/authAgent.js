import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendResetEmail } from "../utils/email.js"; // Reuse email utility
import Agent from "../models/Agent.js"; // Assuming the model is Agent.js
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const crypto = require("crypto");

// Generate JWT token function
const generateToken = (user) => {
  return jwt.sign(
    { _id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET, // Get JWT_SECRET from environment variables
    { expiresIn: "7d" }
  );
};

// Register function
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, languages } = req.body;

    if (await Agent.findOne({ email })) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    // const hashedPassword = await bcrypt.hash(password, 12);

    const agent = new Agent({
      name,
      email,
      password,
      phone,
      languages,
      role: "agent", // assuming agent role for consistency
    });

    await agent.save();
    const token = generateToken(agent);

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(201)
      .json({
        success: true,
        message: "Registration successful",
        user: { _id: agent._id, name: agent.name, email: agent.email, role: agent.role, token },
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Login function
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const agent = await Agent.findOne({ email: email.toLowerCase() });
    if (!agent) {
      return res.status(400).json({ success: false, error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, agent.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Invalid email or password" });
    }

    const token = generateToken(agent);

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        user: { _id: agent._id, name: agent.name, email: agent.email, role: agent.role, token },
      });
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Get Profile function
export const getProfile = (req, res) => {
  res.json({ success: true, user: req.user });
};

// Logout function
export const logout = (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    })
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

// Edit Profile function
export const editProfile = async (req, res) => {
  try {
    const { name, phone, languages } = req.body;
    const userId = req.user._id;

    const user = await Agent.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (languages) user.languages = languages;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, languages: user.languages },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Forgot Password function
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Agent.findOne({ email });

    if (!user) return res.status(400).json({ success: false, error: "User not found" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    user.otp = otp; // Store OTP in the user document
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
    await user.save();

    // Send OTP via email
    const emailResponse = await sendResetEmail(user.email, otp);
    if (!emailResponse.success) return res.status(500).json({ success: false, error: "Failed to send OTP" });

    res.json({ success: true, message: "OTP sent to your email. It will expire in 10 minutes." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reset Password function
export const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    // Find user with matching OTP and check if it's still valid
    const user = await Agent.findOne({
      otp,
      otpExpires: { $gt: new Date() }, // Check if OTP is not expired
    });

    if (!user) return res.status(400).json({ success: false, error: "Invalid or expired OTP" });

    // Hash the new password and update the user
    user.password = await bcrypt.hash(newPassword, 12);

    // Clear OTP after successful password reset
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
