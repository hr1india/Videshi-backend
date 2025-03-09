import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import admin from "../config/firebase.js";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

// Signup with Email/Password
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      authProvider: "local",
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login with Email/Password
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Google Authentication
export const socialAuth = async (req, res) => {
  try {
    const { token, provider } = req.body;

    if (provider !== "google") {
      return res.status(400).json({ message: "Invalid provider" });
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ message: "Invalid Firebase token" });
    }

    const email = decodedToken.email;
    const name = decodedToken.name;
    const uid = decodedToken.uid;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        authProvider: provider,
        firebaseUid: uid,
      });

      await user.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token: jwtToken, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
