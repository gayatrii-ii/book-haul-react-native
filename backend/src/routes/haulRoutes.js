import express from "express";
import Haul from "../models/Haul.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Log a new haul
router.post("/", protectRoute, async (req, res) => {
  try {
    const { name, totalCost, books } = req.body;
    if (!name || totalCost === undefined) {
      return res.status(400).json({ message: "Name and totalCost are required" });
    }

    const newHaul = new Haul({
      user: req.user._id,
      name,
      totalCost,
      books: books || [],
    });

    await newHaul.save();
    await newHaul.populate("books");

    res.status(201).json(newHaul);
  } catch (error) {
    console.error("Log haul error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user hauls
router.get("/", protectRoute, async (req, res) => {
  try {
    const hauls = await Haul.find({ user: req.user._id })
      .populate("books")
      .sort({ createdAt: -1 });

    res.json(hauls);
  } catch (error) {
    console.error("Get hauls error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
