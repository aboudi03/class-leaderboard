export type MongoErrorCode =
  | "MONGODB_URI_MISSING"
  | "MONGODB_AUTH_FAILED"
  | "MONGODB_UNREACHABLE"
  | "MONGODB_ERROR";

export function getMongoErrorCode(error: unknown): MongoErrorCode {
  const details = error as { code?: number; name?: string; message?: string };

  if (details.message?.includes("MONGODB_URI is not set")) {
    return "MONGODB_URI_MISSING";
  }

  if (details.code === 8000 || details.message?.includes("authentication failed")) {
    return "MONGODB_AUTH_FAILED";
  }

  if (details.name === "MongoServerSelectionError") {
    return "MONGODB_UNREACHABLE";
  }

  return "MONGODB_ERROR";
}
