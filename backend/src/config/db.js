import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // We will define MONGO_URI in our .env file later
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1); // Exit the process with failure
  }
};

export default connectDB;