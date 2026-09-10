import express from "express";
import {
  getAllBlogs,
  getBlogStats,
  getBlogCategories,
  getBlogById,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus,
  toggleBlogFeatured,
  uploadInlineImage,
  uploadBlogCoverImage,
  uploadBlogContentImage,
} from "../controllers/blog.controller.js";
import { authMiddleware } from "../middleware/authmiddleware.js";

const blogRouter = express.Router();

/* -------------------------------------------------------------------------- */
/*                                Public Routes                               */
/* -------------------------------------------------------------------------- */
blogRouter.get("/stats", getBlogStats);
blogRouter.get("/categories", getBlogCategories);
blogRouter.get("/slug/:slug", getBlogBySlug);
blogRouter.get("/:id", getBlogById);
blogRouter.get("/", getAllBlogs);

/* -------------------------------------------------------------------------- */
/*                            Protected Admin Routes                          */
/* -------------------------------------------------------------------------- */
blogRouter.post("/create", authMiddleware, uploadBlogCoverImage, createBlog);
blogRouter.put("/:id", authMiddleware, uploadBlogCoverImage, updateBlog);
blogRouter.delete("/:id", authMiddleware, deleteBlog);
blogRouter.patch("/:id/status", authMiddleware, toggleBlogStatus);
blogRouter.patch("/:id/featured", authMiddleware, toggleBlogFeatured);
blogRouter.post("/upload-content-image", authMiddleware, uploadBlogContentImage, uploadInlineImage);

export default blogRouter;
