import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("sslmode=require") || process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined,
});
const adapter = new PrismaPg(pool);

// 🔒 Use a global variable to prevent multiple Prisma instances in dev/hot reload
const globalForPrisma = globalThis;

// ✅ Maintain your existing export name (`db`) so no other file breaks
export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// 🧠 Cache the Prisma instance globally in dev (hot reload safe)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// 🧩 Optional but helpful: test connection once at startup
(async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    console.log("✅ Connected to the database successfully.");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

// 🧹 Graceful shutdown (for Express or Node)
process.on("beforeExit", async () => {
  await db.$disconnect();
  console.log("🧹 Prisma disconnected gracefully.");
});
