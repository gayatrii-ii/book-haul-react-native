import mongoose from "mongoose";
import "dotenv/config";
import GlobalBook from "./models/GlobalBook.js";
import Circle from "./models/Circle.js";
import User from "./models/User.js";
import { connectDB } from "./lib/db.js";

const booksToSeed = [
  {
    title: "Normal People",
    author: "Sally Rooney",
    pages: 273,
    genre: "Fiction",
    isbn: "9781984822178",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
  },
  {
    title: "I Want to Die but I Want to Eat Tteokbokki",
    author: "Baek Sehee",
    pages: 500,
    genre: "Memoir",
    isbn: "9781635579383",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=300",
  },
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    pages: 304,
    genre: "Fantasy",
    isbn: "9780525559474",
    image: "https://images.unsplash.com/photo-1614849963640-9cc74b2a826f?auto=format&fit=crop&q=80&w=300",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    pages: 320,
    genre: "Self-Help",
    isbn: "9780735211292",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=300",
  },
  {
    title: "Before the Coffee Gets Cold",
    author: "Toshikazu Kawaguchi",
    pages: 213,
    genre: "Fiction",
    isbn: "9781529029581",
    image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=300",
  },
];

const seed = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Seed Books
    for (const book of booksToSeed) {
      await GlobalBook.findOneAndUpdate({ isbn: book.isbn }, book, {
        upsert: true,
        new: true,
      });
      console.log(`Upserted book: ${book.title}`);
    }

    // Find any user to associate with starter circles
    const user = await User.findOne();
    if (user) {
      console.log(`Found user ${user.username} to create starter circles.`);

      const normalPeopleBook = await GlobalBook.findOne({ title: "Normal People" });
      const coffeeBook = await GlobalBook.findOne({ title: "Before the Coffee Gets Cold" });

      const circlesToSeed = [
        {
          name: "Rooney Readers",
          description: "A circle for exploring Sally Rooney's novels. Currently reading Normal People.",
          createdBy: user._id,
          members: [user._id],
          currentBook: normalPeopleBook ? normalPeopleBook._id : undefined,
          milestonePage: 150,
        },
        {
          name: "Coffee & Books",
          description: "Let's read Before the Coffee Gets Cold and meet up to chat.",
          createdBy: user._id,
          members: [user._id],
          currentBook: coffeeBook ? coffeeBook._id : undefined,
          milestonePage: 100,
        }
      ];

      for (const circle of circlesToSeed) {
        await Circle.findOneAndUpdate({ name: circle.name }, circle, {
          upsert: true,
          new: true,
        });
        console.log(`Upserted circle: ${circle.name}`);
      }
    } else {
      console.log("No user found in the DB. Skipping circle seeding. Sign in first then seed again to link circles.");
    }

    console.log("Database seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();
