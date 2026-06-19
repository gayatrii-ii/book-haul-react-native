# BookHaul 📚

Welcome to **BookHaul**, a modern, full-stack mobile application built for book lovers to share their favorite reads, discover community recommendations, and keep track of their book collections.

This repository is structured as a **monorepo** containing both the backend REST API and the React Native/Expo mobile client.

---

## 🚀 Features

*   **User Authentication & Branding**: Secure signup and login with JWT and password hashing, featuring the official BookHaul brand logo integrated across the Login, Signup, and Sidebar headers.
*   **Minimalist Kindle/Medium Editorial Look**: Fully revamped layout with professional desaturated warm cream (Light) and indigo-charcoal (Dark) palettes, clean cards, and subtle accent stripes.
*   **Dynamic Theme & Font Settings**: Settings panel in the sidebar drawer to toggle Light/Dark appearance, scale reading font sizes (Small, Normal, Large, Extra-Large) on feed and chat rooms, and sync yearly goals.
*   **Advanced Review Customization**: Add ratings, captions, book covers, and custom options (Favorite Heart ❤️, Re-Read 🔄, E-Book/Audiobook formats, and comma-separated hashtags).
*   **Reading Circles & Spoiler Shield**: Interactive reading groups with discussions that blur/lock messages marked as spoilers until a member's personal library page progress reaches the target page.
*   **Image Uploads**: Integrated with Cloudinary for fast and optimized cover image hosting.
*   **Offline Support**: Session state, user settings, and tokens persisted locally using AsyncStorage.

---

## 🛠️ Tech Stack

### Mobile Frontend
*   **Framework**: [Expo SDK 56](https://expo.dev/) (React Native 0.85 & React 19)
*   **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Local Storage**: [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)

### Backend Server
*   **Runtime**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
*   **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) with [Mongoose](https://mongoosejs.com/)
*   **Security**: [bcryptjs](https://www.npmjs.com/package/bcryptjs) & [jsonwebtoken (JWT)](https://jwt.io/)
*   **Media Hosting**: [Cloudinary](https://cloudinary.com/)
*   **Cron Jobs**: [node-cron](https://www.npmjs.com/package/node-cron)

---

## 📂 Project Structure

```text
book-haul/
├── backend/                  # Node.js & Express server
│   ├── src/
│   │   ├── lib/              # Database & Cloudinary config
│   │   ├── middleware/       # JWT auth protection
│   │   ├── models/           # Mongoose schemas (User, Book)
│   │   ├── routes/           # Express router endpoints
│   │   └── index.js          # App entry point
│   ├── .env                  # Backend environment variables (ignored)
│   └── package.json
│
├── mobile/                   # React Native (Expo) app
│   ├── src/
│   │   ├── app/              # Expo Router pages & screens
│   │   ├── assets/           # Fonts, images, and global styles
│   │   ├── components/       # Reusable React Native components
│   │   ├── constants/        # Colors & API URL configuration
│   │   ├── lib/              # Helper utilities
│   │   └── store/            # Zustand global state (Auth & Books)
│   ├── app.json              # Expo configuration
│   └── package.json
│
├── package.json              # Monorepo root configuration
└── README.md
```

---

## ⚙️ Getting Started

### 1. Prerequisites
Make sure you have Node.js and npm installed on your machine. You will also need the **Expo Go** app installed on your physical mobile device.

*   [Download Node.js](https://nodejs.org/)
*   [Expo Go (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)
*   [Expo Go (iOS)](https://apps.apple.com/us/app/expo-go/id984021028)

### 2. Installation
Clone the repository and install the dependencies for both projects.

From the root directory, run:
```bash
# Install root workspace dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install mobile dependencies
cd ../mobile && npm install
```

### 3. Backend Environment Setup
Create a `.env` file in the `backend/` folder:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_token
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### 4. Running the Project

You can start both projects from the root workspace directory.

#### Start the Backend:
```bash
npm run backend
```
The server will run on `http://localhost:3000` (and connect to your MongoDB database).

#### Start the Mobile Client:
```bash
npm run mobile
```
This launches the Metro Bundler and outputs a QR code.

---

## 📱 Running on a Physical Phone (Expo Go)

1.  Ensure both your computer and your phone are connected to the **same Wi-Fi network**.
2.  Open **`mobile/src/constants/api.js`** and verify the `API_URL` is set to your computer's local IP address (e.g., `http://192.168.X.X:3000/api`).
3.  Scan the QR code shown in your terminal:
    *   **Android**: Scan using the **Expo Go** app.
    *   **iOS**: Scan using your iPhone's built-in **Camera** app and tap the prompt to open in Expo Go.
