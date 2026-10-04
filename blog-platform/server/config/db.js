const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log('[DB] No MONGO_URI specified. Operating with embedded SQLite database.');
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    isConnected = true;
    console.log('[DB] MongoDB connected successfully');
  } catch (err) {
    console.log(`[DB] Local MongoDB not reachable (${err.message}).`);
    console.log('[DB] Running seamlessly with zero-config embedded SQLite database (server/data/blog.db).');
  }
};

const isMongoConnected = () => isConnected;

module.exports = connectDB;
module.exports.isMongoConnected = isMongoConnected;
