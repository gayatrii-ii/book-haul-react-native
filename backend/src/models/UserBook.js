import mongoose from "mongoose";

const userBookSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GlobalBook",
      required: true,
    },
    status: {
      type: String,
      enum: ["To-Read", "Reading", "Completed", "DNF"],
      default: "To-Read",
    },
    currentPage: {
      type: Number,
      default: 0,
    },
    totalPages: {
      type: Number,
      default: 0,
    },
    dateStarted: {
      type: Date,
    },
    dateFinished: {
      type: Date,
    },
  },
  { timestamps: true }
);

const UserBook = mongoose.model("UserBook", userBookSchema);

export default UserBook;
