// Database connection utility
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      bufferCommands: false, // Don't buffer commands if not connected
      maxPoolSize: 10,
    };
    
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log(`🗃️ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return true;
    
  } catch (error) {
    console.log("error: ",error);
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    
    // Don't try local MongoDB, just continue without database
    console.log('⚠️ Running without database connection');
    console.log('📝 Data will be stored in memory only');
    return false;
  }
};

// Response utility functions
export const sendResponse = (res, statusCode, success, message, data = null) => {
  res.status(statusCode).json({
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const sendError = (res, statusCode, message, error = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : null,
    timestamp: new Date().toISOString()
  });
};

// Video/Audio processing utilities
export const processVideoFrame = (frameData) => {
  // Utility to process base64 video frames
  try {
    const buffer = Buffer.from(frameData.split(',')[1], 'base64');
    return buffer;
  } catch (error) {
    throw new Error('Invalid frame data');
  }
};

export const processAudioChunk = (audioData) => {
  // Utility to process audio chunks
  try {
    const buffer = Buffer.from(audioData.split(',')[1], 'base64');
    return buffer;
  } catch (error) {
    throw new Error('Invalid audio data');
  }
};

// Interview scoring utilities
export const calculateInterviewScore = (behaviorData, speechData, answerData) => {
  const behaviorScore = behaviorData.reduce((acc, curr) => acc + curr.confidence, 0) / behaviorData.length;
  const speechScore = speechData.reduce((acc, curr) => acc + curr.clarity, 0) / speechData.length;
  const answerScore = answerData.reduce((acc, curr) => acc + (curr.rating || 50), 0) / answerData.length;
  
  return Math.round((behaviorScore + speechScore + answerScore) / 3);
};

// File upload utilities
export const validateFileUpload = (file, allowedTypes, maxSize) => {
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
  }
  
  return true;
};