// routes/gallery.route.js
import express from "express";
import {
  createGalleryImage,
  getAllGalleryImages,
  getGalleryImageById,
  updateGalleryImage,
  deleteGalleryImage,
  getCategories,
  uploadGalleryImage
} from "../controllers/gallery.controller.js";
import { authMiddleware } from "../middleware/authmiddleware.js";

const GalleryRouter = express.Router();

// Public routes
GalleryRouter.get("/images", getAllGalleryImages);
GalleryRouter.get("/image/:id", getGalleryImageById);
GalleryRouter.get("/categories", getCategories);

// Protected routes (admin only)
GalleryRouter.post("/upload", uploadGalleryImage, createGalleryImage);
GalleryRouter.put("/image/:id", updateGalleryImage);
GalleryRouter.delete("/image/:id", deleteGalleryImage);

export default GalleryRouter;
