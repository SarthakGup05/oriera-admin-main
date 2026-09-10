import express from "express";
import os from "os";
import fs from "fs";
import { db } from "../libs/db.js";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

// 🧩 Helper: check Cloudinary API
async function checkCloudinary() {
  try {
    const result = await cloudinary.api.ping();
    return { status: "ok", message: "Cloudinary API reachable", details: result };
  } catch (error) {
    return { status: "error", message: "Cloudinary API unreachable", details: error.message };
  }
}

// 🧩 Helper: get disk usage
function getDiskUsage() {
  try {
    const stat = fs.statSync("/");
    return {
      total: "N/A", // fs.statSync("/") doesn’t expose disk space directly — needs OS-specific tools
      free: "N/A",
      note: "Disk usage limited in Node.js runtime (use df command for full check)",
    };
  } catch {
    return { total: "unknown", free: "unknown" };
  }
}

// 🟢 Lightweight ping endpoint (ideal for keep-alive cron jobs)
router.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is active", timestamp: new Date().toISOString() });
});

// 🧩 Main health route
router.get("/full", async (req, res) => {
  try {
    // Database query check (PostgreSQL compatible)
    await db.$queryRaw`SELECT 1`;

    const cloudinaryStatus = await checkCloudinary();

    // 🧠 System stats
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const cpuLoad = os.loadavg();
    const diskUsage = getDiskUsage();

    // 🟢 Response
    res.status(200).json({
      status: "ok",
      message: "Full system, database, and API health check successful",
      database: {
        prisma: "connected",
        provider: "postgresql",
      },
      cloudinary: cloudinaryStatus,
      server: {
        uptime: `${Math.round(uptime)}s`,
        memory: {
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        },
        cpu_load: cpuLoad.map(v => v.toFixed(2)), // [1m, 5m, 15m]
        platform: os.platform(),
        hostname: os.hostname(),
      },
      disk: diskUsage,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Full health check failed:", err.message);
    res.status(500).json({
      status: "error",
      message: "One or more health checks failed",
      details: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
