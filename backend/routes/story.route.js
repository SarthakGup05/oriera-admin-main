// routes/stories.route.js
import express from "express";
import {
  getAllStories,
  getStoryById,
  createStory,
  updateStory,
  deleteStory,
  getCategories,
  uploadStoryImage
} from "../controllers/story.Controller.js";
import { authMiddleware } from "../middleware/authmiddleware.js";

const StoriesRouter = express.Router();

// Public routes
StoriesRouter.get("/stories", getAllStories);
StoriesRouter.get("/stories/:id", getStoryById);
StoriesRouter.get("/categories", getCategories);

// Protected routes (admin only)
StoriesRouter.post("/stories/create", authMiddleware, uploadStoryImage, createStory);
StoriesRouter.put("/stories/:id", authMiddleware, updateStory);
StoriesRouter.delete("/stories/:id", authMiddleware, deleteStory);

export default StoriesRouter;
