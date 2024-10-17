import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_URI}/connectify`,
      {
        writeConcern: { w: "majority" },
      }
    );

    console.log(connectionInstance.Connection.STATES.connected);

    console.log(`\n Mongodb connect :)\nhost: ${connectionInstance}`);
  } catch (error) {
    console.error("MONGODB connection error", error);
    // throw error;
    process.exit(1);
  }
};
