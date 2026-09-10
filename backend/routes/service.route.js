import express from "express";
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceBySlug,
  toggleServiceStatus,
  uploadServiceImages,
} from "../controllers/service.controller.js";
import { authMiddleware } from "../middleware/authmiddleware.js";

const ServiceRouter = express.Router();

// Service Routes

// 1. Static/Specific Routes FIRST
ServiceRouter.post("/create", uploadServiceImages, createService);
ServiceRouter.get("/get-services", getAllServices);

// 2. Specific Dynamic Routes SECOND (Before generic ID)
// ✅ Moved this UP. Now /slug/anything will match here first.
ServiceRouter.get("/slug/:slug", getServiceBySlug); 

// 3. Generic ID Routes LAST
// ❌ If this was above /slug/:slug, it would trap the request
ServiceRouter.get("/:id", authMiddleware, getServiceById);

ServiceRouter.put("/update-service/:id", uploadServiceImages, updateService);
ServiceRouter.delete("/delete-service/:id",  deleteService);
ServiceRouter.post("/toggle-service-status/:id", authMiddleware, toggleServiceStatus);

export default ServiceRouter;