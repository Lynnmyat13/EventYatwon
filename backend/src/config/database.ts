import mongoose from "mongoose";

const DATABASE_NAME = "eventyatwon_db";

export const connectDatabase = async (): Promise<typeof mongoose> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(mongoUri, {
    dbName: DATABASE_NAME,
  });

  console.log(`MongoDB connected to database: ${connection.connection.name}`);

  return connection;
};
