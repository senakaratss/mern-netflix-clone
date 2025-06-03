import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existinUserByUsername = await User.findOne({ username });
    const existinUserByEmail = await User.findOne({ email });
    if (existinUserByEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }
    if (existinUserByUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all the fields" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Please enter a password with at least 6 characters",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const PROFILE_PICS = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];
    const image = PROFILE_PICS[Math.floor(Math.random() * PROFILE_PICS.length)];

    const newUser = await User({
      username,
      email,
      password: hashedPassword,
      image,
    });

    generateTokenAndSetCookie(newUser._id, res);
    await newUser.save();
    //Remove password from the response
    return res.status(201).json({
      success: true,
      user: {
        ...newUser._doc,
        password: "",
      },
    });
  } catch (error) {
    console.error("Error signup controller: " + error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all the fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(user._id, res);
    res
      .status(200)
      .json({ success: true, user: { ...user._doc, password: "" } });
  } catch (error) {
    console.error("Error login controller: " + error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const logout = (req, res) => {
  try {
    res.clearCookie("jwt-netflix");
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Error logout controller: " + error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const authCheck = async (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.error("Error authCheck controller: " + error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
