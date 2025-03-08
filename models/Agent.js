import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Now optional for social logins
    phone: { type: String, required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    languages: { type: [String], }, // Stores multiple languages
    role: { type: String, default: "agent" }, // Default role is 'agent'
    otp: String, // Field to store OTP
    otpExpires: Date, // Field to store OTP expiration time
  },
  { timestamps: true } // Adds createdAt and updatedAt
);


agentSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});
export default mongoose.model("Agent", agentSchema);
