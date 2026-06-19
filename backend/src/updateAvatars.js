import mongoose from "mongoose";
import "dotenv/config";
import User from "./models/User.js";

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

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for profile picture migration...");

    const users = await User.find();
    console.log(`Found ${users.length} users in database.`);

    for (const user of users) {
      let hash = 0;
      const username = user.username || "user";
      for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
      }
      const avatarIndex = Math.abs(hash) % aestheticAvatars.length;
      const newAvatarUrl = aestheticAvatars[avatarIndex];

      user.profileImage = newAvatarUrl;
      await user.save();
      console.log(`Updated user ${user.username} profile image to: ${newAvatarUrl}`);
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
