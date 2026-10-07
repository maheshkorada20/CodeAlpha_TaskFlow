const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow');
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    // Fallback: If 127.0.0.1 fails, try localhost or cloud cluster
    if (process.env.MONGODB_FALLBACK_URI) {
      try {
        console.log('[Database] Retrying with fallback URI...');
        const conn2 = await mongoose.connect(process.env.MONGODB_FALLBACK_URI);
        console.log(`[Database] MongoDB Fallback Connected: ${conn2.connection.host}`);
        return;
      } catch (err2) {
        console.error(`[Database Fallback Error] ${err2.message}`);
      }
    }
    process.exit(1);
  }
};

module.exports = connectDB;
