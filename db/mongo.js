import mongoose from "mongoose";

const connectDB = async () => {
  await mongoose.connect(process.env.DATABASE_URL);
};

export default connectDB;