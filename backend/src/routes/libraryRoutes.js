import express from "express";
import UserBook from "../models/UserBook.js";
import GlobalBook from "../models/GlobalBook.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Add global book to library
router.post("/", protectRoute, async (req, res) => {
  try {
    const { bookId, status } = req.body;
    if (!bookId) {
      return res.status(400).json({ message: "Book ID is required" });
    }

    const book = await GlobalBook.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found in catalog" });
    }

    // Check if already in user library
    let userBook = await UserBook.findOne({ user: req.user._id, book: bookId });
    if (userBook) {
      return res.status(400).json({ message: "Book is already in your library" });
    }

    userBook = new UserBook({
      user: req.user._id,
      book: bookId,
      status: status || "To-Read",
      totalPages: book.pages,
      dateStarted: status === "Reading" ? new Date() : undefined,
    });

    await userBook.save();
    await userBook.populate("book");

    res.status(201).json(userBook);
  } catch (error) {
    console.error("Add library book error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Search global catalog of books
router.get("/catalog", protectRoute, async (req, res) => {
  try {
    const { q, userAdded } = req.query;
    let filter = {};
    if (q) {
      filter = {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { author: { $regex: q, $options: "i" } },
          { genre: { $regex: q, $options: "i" } },
          { isbn: { $regex: q, $options: "i" } },
        ],
      };
    } else if (userAdded === "true") {
      filter = { isbn: /^MANUAL-/ };
    }
    const books = await GlobalBook.find(filter).sort({ createdAt: -1 }).limit(20);
    res.json(books);
  } catch (error) {
    console.error("Catalog search error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user library books (optional status filter)
router.get("/", protectRoute, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status && status !== "All") {
      filter.status = status;
    }

    const libraryBooks = await UserBook.find(filter)
      .populate("book")
      .sort({ updatedAt: -1 });

    res.json(libraryBooks);
  } catch (error) {
    console.error("Get library books error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update library book status or page count
router.patch("/:id", protectRoute, async (req, res) => {
  try {
    const { status, currentPage } = req.body;
    const userBook = await UserBook.findOne({ _id: req.params.id, user: req.user._id }).populate("book");
    if (!userBook) {
      return res.status(404).json({ message: "Library record not found" });
    }

    if (status) {
      const prevStatus = userBook.status;
      userBook.status = status;
      if (status === "Reading" && prevStatus !== "Reading") {
        userBook.dateStarted = new Date();
      }
      if (status === "Completed" && prevStatus !== "Completed") {
        userBook.dateFinished = new Date();
        userBook.currentPage = userBook.totalPages || userBook.book?.pages || 0;
      }
    }

    if (currentPage !== undefined) {
      userBook.currentPage = currentPage;
      if (userBook.totalPages && currentPage >= userBook.totalPages && userBook.status !== "Completed") {
        userBook.status = "Completed";
        userBook.dateFinished = new Date();
      }
    }

    await userBook.save();
    res.json(userBook);
  } catch (error) {
    console.error("Update library book error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add custom book manually
router.post("/custom", protectRoute, async (req, res) => {
  try {
    const { title, author, pages, genre } = req.body;
    if (!title || !author || !pages) {
      return res.status(400).json({ message: "Title, author, and page count are required" });
    }

    const isbn = "MANUAL-" + Math.floor(1000000000 + Math.random() * 9000000000);

    // Create a new GlobalBook
    const newGlobalBook = new GlobalBook({
      title,
      author,
      pages,
      genre: genre || "General",
      image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300", // placeholder
      isbn,
    });

    await newGlobalBook.save();

    // Add to user library
    const userBook = new UserBook({
      user: req.user._id,
      book: newGlobalBook._id,
      status: "To-Read",
      totalPages: pages,
    });

    await userBook.save();
    await userBook.populate("book");

    res.status(201).json(userBook);
  } catch (error) {
    console.error("Add custom book error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
