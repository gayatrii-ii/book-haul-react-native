import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  spoilerPage: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const circleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    currentBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GlobalBook",
    },
    milestonePage: {
      type: Number,
      default: 0,
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

const Circle = mongoose.model("Circle", circleSchema);

export default Circle;
