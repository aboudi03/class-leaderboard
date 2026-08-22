import mongoose from "mongoose";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache = globalWithMongoose.mongooseCache ?? {
  connection: null,
  promise: null,
};

globalWithMongoose.mongooseCache = cache;

export async function connectToDatabase() {
  if (cache.connection) {
    console.info(`[MongoDB] Using existing connection to database: ${cache.connection.connection.name}`);
    return cache.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("[MongoDB] Connection failed: MONGODB_URI is not configured.");
    throw new Error("MONGODB_URI is not set. Add it to .env.local before starting the app.");
  }

  const databaseName = process.env.MONGODB_DB_NAME || "class-leaderboard";

  if (!cache.promise) {
    console.info(`[MongoDB] Connecting to database: ${databaseName}...`);
  }

  cache.promise ??= mongoose.connect(uri, {
    dbName: databaseName,
    bufferCommands: false,
  });

  try {
    cache.connection = await cache.promise;
    console.info(`[MongoDB] Connected successfully to database: ${cache.connection.connection.name}`);
  } catch (error) {
    cache.promise = null;
    console.error(
      "[MongoDB] Connection failed:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }

  return cache.connection;
}
