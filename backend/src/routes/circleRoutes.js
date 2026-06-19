import express from "express";
import Circle from "../models/Circle.js";
import UserBook from "../models/UserBook.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all reading circles
router.get("/", protectRoute, async (req, res) => {
  try {
    const circles = await Circle.find()
      .populate("members", "username profileImage")
      .populate("createdBy", "username profileImage")
      .populate("currentBook")
      .sort({ createdAt: -1 });

    res.json(circles);
  } catch (error) {
    console.error("Get circles error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new reading circle
router.post("/", protectRoute, async (req, res) => {
  try {
    const { name, description, currentBookId, milestonePage } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Circle name is required" });
    }

    const newCircle = new Circle({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id],
      currentBook: currentBookId || undefined,
      milestonePage: milestonePage || 0,
      messages: [],
    });

    await newCircle.save();
    await newCircle.populate("currentBook");
    await newCircle.populate("members", "username profileImage");

    res.status(201).json(newCircle);
  } catch (error) {
    console.error("Create circle error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Join a reading circle
router.post("/:id/join", protectRoute, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    if (circle.members.some(id => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: "You are already a member of this circle" });
    }

    circle.members.push(req.user._id);
    await circle.save();
    await circle.populate("members", "username profileImage");

    res.json(circle);
  } catch (error) {
    console.error("Join circle error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Post a message in a circle
router.post("/:id/messages", protectRoute, async (req, res) => {
  try {
    const { content, spoilerPage } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const circle = await Circle.findById(req.params.id);
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    const message = {
      sender: req.user._id,
      content,
      spoilerPage: spoilerPage || 0,
      createdAt: new Date(),
    };

    circle.messages.push(message);
    await circle.save();

    // Populate sender details for the new message
    const savedCircle = await Circle.findById(req.params.id)
      .populate("messages.sender", "username profileImage");
    
    const newMsg = savedCircle.messages[savedCircle.messages.length - 1];

    // Real-time broadcast via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(`circle_${req.params.id}`).emit("new_message", newMsg);
    }

    res.status(201).json(newMsg);
  } catch (error) {
    console.error("Post message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get circle messages with Spoiler Block Protection
router.get("/:id/messages", protectRoute, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id)
      .populate("messages.sender", "username profileImage");
    
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Fetch user's current reading progress for the circle's current book
    let userProgressPage = 0;
    if (circle.currentBook) {
      const userBook = await UserBook.findOne({ user: req.user._id, book: circle.currentBook });
      if (userBook) {
        userProgressPage = userBook.currentPage;
      }
    }

    // Map and filter spoiler content
    const processedMessages = circle.messages.map((msg) => {
      const msgObj = msg.toObject();
      if (msg.spoilerPage > 0 && userProgressPage < msg.spoilerPage) {
        msgObj.isLocked = true;
        msgObj.content = `[Spoiler Locked - You are at page ${userProgressPage}, milestone is page ${msg.spoilerPage}]`;
      } else {
        msgObj.isLocked = false;
      }
      return msgObj;
    });

    res.json(processedMessages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
