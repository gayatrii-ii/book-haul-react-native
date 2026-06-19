import express from "express";
import User from "../models/User.js";
import UserBook from "../models/UserBook.js";
import Book from "../models/Book.js";
import Haul from "../models/Haul.js";
import jwt from "jsonwebtoken";
import protectRoute from "../middleware/auth.middleware.js";
import cloudinary from "../lib/cloudinary.js";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password should be at least 6 characters long" });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: "Username should be at least 3 characters long" });
    }

    // check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // get random aesthetic book/nature-themed avatar
    const aestheticAvatars = [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=150&h=150&q=80",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=150&h=150&q=80",
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=150&h=150&q=80",
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=150&h=150&q=80",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=150&h=150&q=80",
      "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=150&h=150&q=80",
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=150&h=150&q=80",
      "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=150&h=150&q=80",
      "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?auto=format&fit=crop&w=150&h=150&q=80"
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const avatarIndex = Math.abs(hash) % aestheticAvatars.length;
    const profileImage = aestheticAvatars[avatarIndex];

    const user = new User({
      email,
      username,
      password,
      profileImage,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        readingGoal: user.readingGoal,
        membershipTier: user.membershipTier,
      },
    });
  } catch (error) {
    console.log("Error in register route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    // check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        readingGoal: user.readingGoal,
        membershipTier: user.membershipTier,
      },
    });
  } catch (error) {
    console.log("Error in login route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get authenticated user details
router.get("/me", protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update profile fields (like readingGoal)
router.patch("/profile", protectRoute, async (req, res) => {
  try {
    const { readingGoal, profileImage, bio } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (readingGoal !== undefined) {
      user.readingGoal = parseInt(readingGoal);
    }
    if (profileImage !== undefined) {
      if (profileImage.startsWith("data:image")) {
        try {
          const uploadRes = await cloudinary.uploader.upload(profileImage, {
            folder: "bookhaul_avatars",
          });
          user.profileImage = uploadRes.secure_url;
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          return res.status(500).json({ message: "Failed to upload image to cloud storage" });
        }
      } else {
        user.profileImage = profileImage;
      }
    }
    if (bio !== undefined) {
      user.bio = bio;
    }

    await user.save();
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      readingGoal: user.readingGoal,
      membershipTier: user.membershipTier,
      bio: user.bio,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's public profile details
router.get("/users/:id", protectRoute, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id).select("-password -email");
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // Fetch recommendations posted by targetUser
    const books = await Book.find({ user: targetUser._id }).sort({ createdAt: -1 });

    // Fetch book hauls (curations) curated by targetUser
    const hauls = await Haul.find({ user: targetUser._id }).sort({ createdAt: -1 }).populate("books");

    // Fetch library books to calculate completed books
    const userLibrary = await UserBook.find({ user: targetUser._id });
    const completedCount = userLibrary.filter(b => b.status === "Completed").length;

    res.json({
      user: {
        id: targetUser._id,
        username: targetUser.username,
        profileImage: targetUser.profileImage,
        createdAt: targetUser.createdAt,
        readingGoal: targetUser.readingGoal,
        membershipTier: targetUser.membershipTier,
        bio: targetUser.bio || "",
      },
      books,
      hauls,
      completedCount,
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
