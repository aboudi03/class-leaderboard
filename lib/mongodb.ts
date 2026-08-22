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

function normalizeMongoUri(value: string) {
  const configuredLine = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.includes("mongodb+srv://") || line.includes("mongodb://"));

  let uri = configuredLine ?? value.trim();
  const protocolIndex = uri.indexOf("mongodb");
  if (protocolIndex > 0) uri = uri.slice(protocolIndex);
  return uri.trim().replace(/^['"]|['"]$/g, "");
}

export async function connectToDatabase() {
  if (cache.connection) {
    console.info(`[MongoDB] Using existing connection to database: ${cache.connection.connection.name}`);
    return cache.connection;
  }

  const configuredUri = process.env.MONGODB_URI;
  if (!configuredUri) {
    console.error("[MongoDB] Connection failed: MONGODB_URI is not configured.");
    throw new Error("MONGODB_URI is not set. Add it to .env.local before starting the app.");
  }

  const uri = normalizeMongoUri(configuredUri);

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
