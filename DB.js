import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

export async function connect() {
    try {
      const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("TodoList");
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("Error connecting to the database", error);
  }
}
