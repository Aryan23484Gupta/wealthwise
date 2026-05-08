const mongoose = require("mongoose");

async function connectDB() {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it to your backend environment variables.");
  }

  await mongoose.connect(MONGO_URI);
}

module.exports = connectDB;
