// controllers/stories.controller.js
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

const storiesStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "stories",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1200, height: 800, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
    public_id: () => `story-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
  },
});

const upload = multer({
  storage: storiesStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export const uploadStoryImage = upload.single("image");

/* -------------------------------------------------------------------------- */
/*                              Helper utilities                              */
/* -------------------------------------------------------------------------- */
const parseBool = (val) => val === "true" || val === true;
const parseNumber = (val) => (val !== undefined ? Number(val) : undefined);

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

// GET /stories
export const getAllStories = async (req, res) => {
  try {
    const {
      category,
      featured,
      status = "published",
      includeInactive = "false",
      sortBy = "createdAt",
      sortOrder = "desc",
      limit,
      offset,
    } = req.query;

    const where = {};

    // status filter
    if (status !== "all") where.status = status;

    // active / inactive filter
    if (!parseBool(includeInactive)) where.isActive = true;

    // category filter
    if (category && category !== "all") where.category = category;

    // featured filter
    if (featured !== undefined) where.featured = parseBool(featured);

    // sorting
    const orderBy = { [sortBy]: sortOrder };

    const take = parseNumber(limit);
    const skip = parseNumber(offset);

    const [stories, totalCount] = await Promise.all([
      db.story.findMany({
        where,
        orderBy,
        ...(take && { take }),
        ...(skip && { skip }),
      }),
      db.story.count({ where }),
    ]);

    res.status(200).json({
      stories,
      totalCount,
      hasMore: take && skip ? skip + take < totalCount : false,
    });
  } catch (err) {
    console.error("Error fetching stories:", err);
    res.status(500).json({ error: "Error fetching stories" });
  }
};

// GET /stories/:id
export const getStoryById = async (req, res) => {
  try {
    const id = parseNumber(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid story ID" });

    const story = await db.story.findUnique({ where: { id } });
    if (!story) return res.status(404).json({ error: "Story not found" });

    // increment views (fire-and-forget)
    db.story.update({ where: { id }, data: { views: { increment: 1 } } }).catch(console.error);

    res.status(200).json(story);
  } catch (err) {
    console.error("Error fetching story:", err);
    res.status(500).json({ error: "Error fetching story" });
  }
};

// POST /stories  (upload middleware runs before this handler)
export const createStory = async (req, res) => {
  try {
    const {
      title,
      category,
      date = new Date().toISOString().split("T")[0],
      location = "",
      story,
      author,
      featured = false,
      status = "published",
      metaTitle = "",
      metaDescription = "",
      isActive = true,
    } = req.body;

    if (!title || !category || !story || !author) {
      return res.status(400).json({ error: "Title, category, story, and author are required" });
    }

    const newStory = await db.story.create({
      data: {
        title,
        category,
        date,
        location,
        story,
        author,
        featured: parseBool(featured),
        status,
        metaTitle,
        metaDescription,
        isActive: parseBool(isActive),
        mainImage: req.file?.path || "",
        publicId:  req.file?.public_id || null,
      },
    });

    res.status(201).json(newStory);
  } catch (err) {
    console.error("Error creating story:", err);

    // cleanup orphaned upload
    if (req.file?.public_id) await cloudinary.uploader.destroy(req.file.public_id);

    res.status(500).json({ error: "Error creating story", details: err.message });
  }
};

// PUT /stories/:id  (upload middleware runs before this handler – use only on routes where image may change)
export const updateStory = async (req, res) => {
  try {
    const id = parseNumber(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid story ID" });

    const existing = await db.story.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Story not found" });

    // Delete old asset if replacing
    if (req.file && existing.publicId) {
      await cloudinary.uploader.destroy(existing.publicId);
    }

    const {
      title,
      category,
      date,
      location,
      story,
      author,
      featured,
      status,
      metaTitle,
      metaDescription,
      isActive,
    } = req.body;

    const updatedStory = await db.story.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(date !== undefined && { date }),
        ...(location !== undefined && { location }),
        ...(story !== undefined && { story }),
        ...(author !== undefined && { author }),
        ...(featured !== undefined && { featured: parseBool(featured) }),
        ...(status !== undefined && { status }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(isActive !== undefined && { isActive: parseBool(isActive) }),
        ...(req.file && { mainImage: req.file.path, publicId: req.file.public_id }),
      },
    });

    res.status(200).json(updatedStory);
  } catch (err) {
    console.error("Error updating story:", err);

    // cleanup orphaned upload
    if (req.file?.public_id) await cloudinary.uploader.destroy(req.file.public_id);

    res.status(500).json({ error: "Error updating story", details: err.message });
  }
};

// DELETE /stories/:id
export const deleteStory = async (req, res) => {
  try {
    const id = parseNumber(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid story ID" });

    const existing = await db.story.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Story not found" });

    if (existing.publicId) await cloudinary.uploader.destroy(existing.publicId);
    await db.story.delete({ where: { id } });

    res.status(200).json({ message: "Story deleted successfully", deletedStory: existing });
  } catch (err) {
    console.error("Error deleting story:", err);
    res.status(500).json({ error: "Error deleting story", details: err.message });
  }
};

// GET /stories/categories
export const getCategories = async (_req, res) => {
  try {
    const categories = await db.story.findMany({
      select: { category: true },
      distinct: ["category"],
    });
    res.status(200).json(categories.map((c) => c.category));
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Error fetching categories" });
  }
};
