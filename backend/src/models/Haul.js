import mongoose from "mongoose";

const haulSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    totalCost: {
      type: Number,
      required: true,
    },
    books: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GlobalBook",
      },
    ],
  },
  { timestamps: true }
);

const Haul = mongoose.model("Haul", haulSchema);

export default Haul;
