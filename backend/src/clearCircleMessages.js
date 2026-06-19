import mongoose from "mongoose";
import "dotenv/config";
import Circle from "./models/Circle.js";

const clearMessages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // Clear messages for all circles
    const result = await Circle.updateMany({}, { $set: { messages: [] } });
    console.log(`Cleared messages in circles.`);

    console.log("Database cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
};

clearMessages();
