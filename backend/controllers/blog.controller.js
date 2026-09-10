import { db } from "../libs/db.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

/* -------------------------------------------------------------------------- */
/*                               Cloudinary set-up                            */
/* -------------------------------------------------------------------------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for blog cover images
const blogCoverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogs/covers",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1600, height: 900, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
    public_id: () => `blog-cover-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  },
});

// Storage for in-content rich editor images
const blogContentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogs/content",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [
      { width: 1400, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
    public_id: () => `blog-inline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  },
});

const uploadCover = multer({
  storage: blogCoverStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadContent = multer({
  storage: blogContentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadBlogCoverImage = uploadCover.single("coverImage");
export const uploadBlogContentImage = uploadContent.single("image");

/* -------------------------------------------------------------------------- */
/*                              Helper utilities                              */
/* -------------------------------------------------------------------------- */
const parseBool = (val) => val === "true" || val === true;
const parseNumber = (val) => (val !== undefined && val !== null && !isNaN(Number(val)) ? Number(val) : undefined);

// Slug generator
export const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Calculate read time
export const calculateReadTime = (content) => {
  if (!content) return "1 min read";
  // Strip HTML tags
  const plainText = content.replace(/<[^>]*>/g, " ");
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
};

// Parse tags from input (could be JSON string, array, or comma-separated string)
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
};

/* -------------------------------------------------------------------------- */
/*                                Controllers                                 */
/* -------------------------------------------------------------------------- */

// GET /api/v1/blogs - List blogs with filtering, search, pagination
export const getAllBlogs = async (req, res) => {
  try {
    const {
      search,
      category,
      status = "all", // "all", "published", "draft", "archived"
      featured,
      isActive,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const where = {};

    // Status filter
    if (status && status !== "all") {
      where.status = status;
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = parseBool(isActive);
    }

    // Category filter
    if (category && category !== "all") {
      where.category = category;
    }

    // Featured filter
    if (featured !== undefined) {
      where.featured = parseBool(featured);
    }

    // Search filter (title, excerpt, content)
    if (search && search.trim() !== "") {
      const searchTerm = search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { excerpt: { contains: searchTerm, mode: "insensitive" } },
        { category: { contains: searchTerm, mode: "insensitive" } },
        { author: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const pageNum = Math.max(1, parseNumber(page) || 1);
    const take = Math.min(50, Math.max(1, parseNumber(limit) || 10));
    const skip = (pageNum - 1) * take;

    const orderBy = { [sortBy]: sortOrder.toLowerCase() === "asc" ? "asc" : "desc" };

    const [blogs, totalCount] = await Promise.all([
      db.blog.findMany({
        where,
        orderBy,
        take,
        skip,
      }),
      db.blog.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / take);

    res.status(200).json({
      success: true,
      blogs,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: take,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ success: false, message: "Error fetching blogs", error: error.message });
  }
};

// GET /api/v1/blogs/stats - Dashboard analytics
export const getBlogStats = async (req, res) => {
  try {
    const [total, published, draft, archived, totalViewsAggregate, topCategories] = await Promise.all([
      db.blog.count(),
      db.blog.count({ where: { status: "published" } }),
      db.blog.count({ where: { status: "draft" } }),
      db.blog.count({ where: { status: "archived" } }),
      db.blog.aggregate({
        _sum: { views: true, likes: true },
      }),
      db.blog.groupBy({
        by: ["category"],
        _count: { category: true },
        orderBy: { _count: { category: "desc" } },
        take: 5,
      }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        published,
        draft,
        archived,
        totalViews: totalViewsAggregate._sum.views || 0,
        totalLikes: totalViewsAggregate._sum.likes || 0,
        topCategories: topCategories.map((c) => ({
          category: c.category,
          count: c._count.category,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching blog stats:", error);
    res.status(500).json({ success: false, message: "Error fetching blog stats", error: error.message });
  }
};

// GET /api/v1/blogs/categories - Distinct categories
export const getBlogCategories = async (req, res) => {
  try {
    const categories = await db.blog.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    res.status(200).json({
      success: true,
      categories: categories.map((c) => c.category).filter(Boolean),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Error fetching categories" });
  }
};

// GET /api/v1/blogs/:id - Get blog by ID
export const getBlogById = async (req, res) => {
  try {
    const id = parseNumber(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid blog ID" });
    }

    const blog = await db.blog.findUnique({ where: { id } });
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error("Error fetching blog by ID:", error);
    res.status(500).json({ success: false, message: "Error fetching blog" });
  }
};

// GET /api/v1/blogs/slug/:slug - Get blog by slug (and fire-and-forget view count)
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ success: false, message: "Slug is required" });
    }

    const blog = await db.blog.findUnique({ where: { slug } });
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog post not found" });
    }

    // Increment views asynchronously
    db.blog.update({
      where: { id: blog.id },
      data: { views: { increment: 1 } },
    }).catch(console.error);

    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    res.status(500).json({ success: false, message: "Error fetching blog post" });
  }
};

// POST /api/v1/blogs/create - Create blog
export const createBlog = async (req, res) => {
  try {
    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      category = "Photography",
      tags,
      author = "Admin",
      authorImage,
      featured = false,
      status = "published",
      isActive = true,
      metaTitle,
      metaDescription,
      metaKeywords,
      publishedAt,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    // Generate unique slug
    let baseSlug = customSlug && customSlug.trim() ? generateSlug(customSlug) : generateSlug(title);
    if (!baseSlug) baseSlug = `post-${Date.now()}`;

    let slug = baseSlug;
    let counter = 1;
    while (await db.blog.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const readTime = calculateReadTime(content);
    const parsedTags = parseTags(tags);

    const newBlog = await db.blog.create({
      data: {
        title: title.trim(),
        slug,
        excerpt: excerpt ? excerpt.trim() : (content.replace(/<[^>]*>/g, " ").trim().slice(0, 160) + "..."),
        content,
        coverImage: req.file?.path || req.body.coverImageUrl || null,
        publicId: req.file?.filename || req.body.coverImagePublicId || null,
        category: category.trim(),
        tags: parsedTags,
        author: author.trim(),
        authorImage: authorImage || null,
        readTime,
        featured: parseBool(featured),
        status: ["draft", "published", "archived"].includes(status) ? status : "published",
        isActive: parseBool(isActive),
        metaTitle: metaTitle?.trim() || title.trim(),
        metaDescription: metaDescription?.trim() || excerpt?.trim() || null,
        metaKeywords: metaKeywords?.trim() || null,
        publishedAt: status === "published" ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog: newBlog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    // Cleanup uploaded cover if error
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    res.status(500).json({ success: false, message: "Error creating blog", error: error.message });
  }
};

// PUT /api/v1/blogs/:id - Update blog
export const updateBlog = async (req, res) => {
  try {
    const id = parseNumber(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid blog ID" });
    }

    const existing = await db.blog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      category,
      tags,
      author,
      authorImage,
      featured,
      status,
      isActive,
      metaTitle,
      metaDescription,
      metaKeywords,
      publishedAt,
      removeCoverImage,
    } = req.body;

    // Handle slug change if provided
    let newSlug = undefined;
    if (customSlug && customSlug.trim() && customSlug !== existing.slug) {
      let baseSlug = generateSlug(customSlug);
      newSlug = baseSlug;
      let counter = 1;
      while (await db.blog.findFirst({ where: { slug: newSlug, NOT: { id } } })) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    } else if (title && title.trim() !== existing.title && !customSlug) {
      // Optional: keep slug or update if explicitly needed
    }

    // Handle cover image replacement or removal
    let coverImage = undefined;
    let publicId = undefined;

    if (req.file) {
      // If user uploaded a new image, delete the old one on Cloudinary
      if (existing.publicId) {
        await cloudinary.uploader.destroy(existing.publicId).catch(() => {});
      }
      coverImage = req.file.path;
      publicId = req.file.filename;
    } else if (parseBool(removeCoverImage)) {
      if (existing.publicId) {
        await cloudinary.uploader.destroy(existing.publicId).catch(() => {});
      }
      coverImage = null;
      publicId = null;
    }

    const readTime = content ? calculateReadTime(content) : undefined;
    const parsedTags = tags !== undefined ? parseTags(tags) : undefined;

    const updatedBlog = await db.blog.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(newSlug !== undefined && { slug: newSlug }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category: category.trim() }),
        ...(parsedTags !== undefined && { tags: parsedTags }),
        ...(author !== undefined && { author: author.trim() }),
        ...(authorImage !== undefined && { authorImage }),
        ...(readTime !== undefined && { readTime }),
        ...(featured !== undefined && { featured: parseBool(featured) }),
        ...(status !== undefined && { status }),
        ...(isActive !== undefined && { isActive: parseBool(isActive) }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(metaKeywords !== undefined && { metaKeywords }),
        ...(publishedAt !== undefined && { publishedAt: new Date(publishedAt) }),
        ...(coverImage !== undefined && { coverImage, publicId }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    res.status(500).json({ success: false, message: "Error updating blog", error: error.message });
  }
};

// DELETE /api/v1/blogs/:id - Delete blog
export const deleteBlog = async (req, res) => {
  try {
    const id = parseNumber(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid blog ID" });
    }

    const existing = await db.blog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    // Delete image from Cloudinary
    if (existing.publicId) {
      await cloudinary.uploader.destroy(existing.publicId).catch(() => {});
    }

    await db.blog.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
      deletedBlog: existing,
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ success: false, message: "Error deleting blog", error: error.message });
  }
};

// PATCH /api/v1/blogs/:id/status - Toggle status
export const toggleBlogStatus = async (req, res) => {
  try {
    const id = parseNumber(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid blog ID" });
    }

    const existing = await db.blog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const newStatus = req.body.status || (existing.status === "published" ? "draft" : "published");

    const updated = await db.blog.update({
      where: { id },
      data: {
        status: newStatus,
        publishedAt: newStatus === "published" && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    });

    res.status(200).json({
      success: true,
      message: `Blog status updated to ${newStatus}`,
      blog: updated,
    });
  } catch (error) {
    console.error("Error toggling blog status:", error);
    res.status(500).json({ success: false, message: "Error toggling blog status" });
  }
};

// PATCH /api/v1/blogs/:id/featured - Toggle featured
export const toggleBlogFeatured = async (req, res) => {
  try {
    const id = parseNumber(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid blog ID" });
    }

    const existing = await db.blog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const updated = await db.blog.update({
      where: { id },
      data: { featured: !existing.featured },
    });

    res.status(200).json({
      success: true,
      message: `Blog ${updated.featured ? "marked as featured" : "unmarked as featured"}`,
      blog: updated,
    });
  } catch (error) {
    console.error("Error toggling featured status:", error);
    res.status(500).json({ success: false, message: "Error toggling featured status" });
  }
};

// POST /api/v1/blogs/upload-image - In-editor inline image upload to Cloudinary
export const uploadInlineImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    res.status(200).json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    console.error("Error uploading inline image:", error);
    res.status(500).json({ success: false, message: "Error uploading image", error: error.message });
  }
};
