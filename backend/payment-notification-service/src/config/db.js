// src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://son:son123@cluster0.imaiqbv.mongodb.net/?appName=Cluster0';
    
    await mongoose.connect(mongoURI);
    
    console.log('[Database] ✅ Kết nối MongoDB thành công!');
  } catch (err) {
    console.error('[Database] ❌ Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;