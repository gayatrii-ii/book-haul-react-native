import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import Comment from "../models/Comment.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image, isFavorite, isReread, format, tags } = req.body;

    if (!image || !title || !caption || !rating) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // upload the image to cloudinary using unsigned preset, falling back to a placeholder if it fails
    let imageUrl = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=1000";
    try {
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: image,
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || "bookhaul",
        }),
      });

      const uploadData = await response.json();
      if (!response.ok) {
        throw new Error(uploadData.error?.message || "Unsigned upload failed");
      }
      imageUrl = uploadData.secure_url;
    } catch (uploadError) {
      console.warn("Cloudinary upload failed, using fallback placeholder image. Error:", uploadError.message);
    }

    // save to the database
    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
      isFavorite: isFavorite || false,
      isReread: isReread || false,
      format: format || "Physical Book",
      tags: tags || [],
    });

    await newBook.save();

    res.status(201).json(newBook);
  } catch (error) {
    console.log("Error creating book", error);
    res.status(500).json({ message: error.message });
  }
});

// pagination => infinite loading
router.get("/", protectRoute, async (req, res) => {
  // example call from react native - frontend
  // const response = await fetch("http://localhost:3000/api/books?page=1&limit=5");
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 2;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 }) // desc
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalBooks = await Book.countDocuments();

    const booksWithCommentsCount = await Promise.all(
      books.map(async (book) => {
        const commentsCount = await Comment.countDocuments({ book: book._id });
        const userIdStr = req.user._id.toString();
        const isLikedByMe = book.likes ? book.likes.some((id) => id.toString() === userIdStr) : false;
        const likesCount = book.likes ? book.likes.length : 0;
        return {
          ...book.toObject(),
          commentsCount,
          isLikedByMe,
          likesCount,
        };
      })
    );

    res.send({
      books: booksWithCommentsCount,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in get all books route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// get recommended books by the logged in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    console.error("Get user books error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // check if user is the creator of the book
    if (book.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Unauthorized" });

    // https://res.cloudinary.com/de1rm4uto/image/upload/v1741568358/qyup61vejflxxw8igvi0.png
    // delete image from cloduinary as well
    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleting image from cloudinary", deleteError);
      }
    }

    await book.deleteOne();

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log("Error deleting book", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get comments for a book
router.get("/:id/comments", protectRoute, async (req, res) => {
  try {
    const comments = await Comment.find({ book: req.params.id })
      .sort({ createdAt: 1 })
      .populate("user", "username profileImage");
    res.json(comments);
  } catch (error) {
    console.log("Error fetching comments", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add comment to a book
router.post("/:id/comments", protectRoute, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const newComment = new Comment({
      content,
      user: req.user._id,
      book: req.params.id,
    });

    await newComment.save();
    await newComment.populate("user", "username profileImage");

    res.status(201).json(newComment);
  } catch (error) {
    console.log("Error creating comment", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle like on a book
router.post("/:id/like", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const userIdStr = req.user._id.toString();
    if (!book.likes) {
      book.likes = [];
    }

    const index = book.likes.findIndex((id) => id.toString() === userIdStr);
    let isLikedByMe = false;

    if (index === -1) {
      book.likes.push(req.user._id);
      isLikedByMe = true;
    } else {
      book.likes.splice(index, 1);
      isLikedByMe = false;
    }

    await book.save();

    res.json({
      isLikedByMe,
      likesCount: book.likes.length,
    });
  } catch (error) {
    console.log("Error toggling like", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
