import mongoose from 'mongoose';

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set');
    return;
  }

  // Check if already connected
  if (mongoose.connection.readyState >= 1) {
    console.log('✅ Already connected to MongoDB');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds for server selection
      socketTimeoutMS: 45000, // 45 seconds for socket operations
      connectTimeoutMS: 10000, // 10 seconds for initial connection
      family: 4, // Force IPv4
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    throw error;
  }
};

export default connectDB;
