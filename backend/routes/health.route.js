import express from "express";
import os from "os";
import fs from "fs";
import { performance } from "perf_hooks";
import { db } from "../libs/db.js";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

// Helper: Format uptime into human-readable string
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d > 0 ? `${d}d ` : ""}${h}h ${m}m ${s}s`;
}

// Helper: Measure Database health & latency
async function checkDatabase() {
  const start = performance.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const latency = (performance.now() - start).toFixed(2);
    return { status: "ok", latency: `${latency}ms`, provider: "postgresql" };
  } catch (error) {
    return { status: "error", message: "Database connection failed", error: error.message };
  }
}

// Helper: Measure Cloudinary API health & latency
async function checkCloudinary() {
  const start = performance.now();
  try {
    const result = await cloudinary.api.ping();
    const latency = (performance.now() - start).toFixed(2);
    return { status: "ok", latency: `${latency}ms`, message: "Cloudinary API reachable", details: result };
  } catch (error) {
    return { status: "error", message: "Cloudinary API unreachable", error: error.message };
  }
}

// Helper: Get real disk space metrics (Node.js 18+ fs.statfsSync)
function getDiskUsage() {
  try {
    if (typeof fs.statfsSync === "function") {
      const stats = fs.statfsSync(process.cwd());
      const totalBytes = stats.bsize * stats.blocks;
      const freeBytes = stats.bsize * stats.bfree;
      const availBytes = stats.bsize * stats.bavail;
      const usedBytes = totalBytes - freeBytes;
      const usagePercent = ((usedBytes / totalBytes) * 100).toFixed(2);

      return {
        status: "ok",
        total: `${(totalBytes / (1024 ** 3)).toFixed(2)} GB`,
        used: `${(usedBytes / (1024 ** 3)).toFixed(2)} GB`,
        free: `${(availBytes / (1024 ** 3)).toFixed(2)} GB`,
        usagePercent: `${usagePercent}%`,
      };
    }
  } catch (err) {
    // Fallback if filesystem stats fail or not accessible in serverless environment
  }
  return { status: "unknown", note: "Disk metrics restricted or unavailable in runtime" };
}

// Middleware to prevent caching health check responses
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

/**
 * 🟢 GET /api/v1/health
 * 🟢 GET /api/v1/health/ping
 * Lightweight Liveness Probe (for keep-alive cron jobs, UptimeRobot, load balancers)
 */
router.get(["/", "/ping", "/liveness"], (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is healthy and responding",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

/**
 * 🟡 GET /api/v1/health/readiness
 * Readiness Probe (checks critical dependencies like database)
 */
router.get("/readiness", async (req, res) => {
  const dbHealth = await checkDatabase();
  const isHealthy = dbHealth.status === "ok";

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: isHealthy ? "ok" : "degraded",
    message: isHealthy ? "Service is ready to handle traffic" : "Service database dependency unavailable",
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});

/**
 * 🧩 GET /api/v1/health/full
 * 🧩 GET /api/v1/health/details
 * Detailed Health & Diagnostics Endpoint (DB, Cloudinary, System stats, Memory, Disk)
 */
router.get(["/full", "/details"], async (req, res) => {
  try {
    const [dbHealth, cloudinaryHealth] = await Promise.all([
      checkDatabase(),
      checkCloudinary(),
    ]);

    const isSystemHealthy = dbHealth.status === "ok";
    const memoryUsage = process.memoryUsage();
    const processUptime = process.uptime();
    const osUptime = os.uptime();
    const diskUsage = getDiskUsage();

    const responsePayload = {
      status: isSystemHealthy ? "ok" : "degraded",
      message: isSystemHealthy
        ? "All critical backend services are healthy"
        : "One or more backend dependencies are experiencing issues",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        cloudinary: cloudinaryHealth,
      },
      system: {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        processUptime: formatUptime(processUptime),
        processUptimeSeconds: Math.floor(processUptime),
        systemUptime: formatUptime(osUptime),
        cpuLoadAvg: os.loadavg().map((v) => Number(v.toFixed(2))),
        memory: {
          rss: `${(memoryUsage.rss / (1024 * 1024)).toFixed(2)} MB`,
          heapUsed: `${(memoryUsage.heapUsed / (1024 * 1024)).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / (1024 * 1024)).toFixed(2)} MB`,
          external: `${(memoryUsage.external / (1024 * 1024)).toFixed(2)} MB`,
        },
        disk: diskUsage,
      },
      env: process.env.NODE_ENV || "development",
    };

    const statusCode = isSystemHealthy ? 200 : 503;
    res.status(statusCode).json(responsePayload);
  } catch (err) {
    console.error("❌ Full health check failed:", err.message);
    res.status(500).json({
      status: "error",
      message: "Unexpected error during health check execution",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

