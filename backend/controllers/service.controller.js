import { db } from "../libs/db.js";
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// ==========================================
// 1. CONFIGURATION
// ==========================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'services',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' }, // Optimized for screens
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const cleanName = file.originalname.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
      return `service-${cleanName}-${timestamp}`;
    },
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

export const uploadServiceImages = upload.single('serviceImage');

// ==========================================
// 2. HELPER FUNCTIONS (Logic Core)
// ==========================================

/**
 * sanitizes FormData inputs. 
 * Converts "null"/"undefined" strings to null, trims strings, returns numbers if needed.
 */
const cleanInput = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === 'null' || trimmed === 'undefined') return null;
    if (trimmed === '') return ''; // Allow empty string if intentional
    return trimmed;
  }
  return value;
};

/**
 * Parses "true"/"false" strings from FormData into actual booleans
 */
const parseBoolean = (val) => {
  if (val === undefined) return undefined;
  if (val === 'true' || val === true || val === '1') return true;
  if (val === 'false' || val === false || val === '0') return false;
  return false; // Default fallback
};

/**
 * Safely parses features from JSON string or CSV
 */
const parseFeatures = (features) => {
  if (!features) return [];
  if (Array.isArray(features)) return features;
  
  if (typeof features === 'string') {
    const cleaned = features.trim();
    if (cleaned === '' || cleaned === 'null' || cleaned === 'undefined') return [];
    
    try {
      // Try parsing as JSON array
      return JSON.parse(cleaned);
    } catch (e) {
      // Fallback: Treat as Comma Separated Values
      return cleaned.split(',').map(f => f.trim()).filter(f => f.length > 0);
    }
  }
  return [];
};

/**
 * Cloudinary Deletion Helpers
 */
const extractPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
      const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
      return publicIdWithExt.replace(/\.[^/.]+$/, '');
    }
  } catch (error) {
    console.error('Error extracting public_id:', error);
  }
  return null;
};

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete image ${publicId}:`, error);
  }
};

// ==========================================
// 3. CONTROLLERS
// ==========================================

// --- Create Service ---
export const createService = async (req, res) => {
  let newImagePublicId = null;

  try {
    // 1. Capture Uploaded File Details
    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.path;
      newImagePublicId = req.file.public_id;
    }

    // 2. Process Inputs
    const {
      name, slug, title, subtitle, description,
      features, duration, metaTitle, metaDescription,
      isActive, featured, sortOrder
    } = req.body;

    const cleanName = cleanInput(name);
    const cleanSlug = cleanInput(slug);
    const cleanTitle = cleanInput(title);
    const cleanSubtitle = cleanInput(subtitle);
    const cleanDescription = cleanInput(description);

    // 3. Validation
    if (!cleanName || !cleanSlug || !cleanTitle || !cleanDescription) {
      throw new Error("Missing required fields: name, slug, title, or description");
    }

    // 4. Create in DB
    const newService = await db.service.create({
      data: {
        name: cleanName,
        slug: cleanSlug,
        title: cleanTitle,
        subtitle: cleanSubtitle,
        description: cleanDescription,
        coverImage: imageUrl,
        mainImage: imageUrl, // Mapping same image to both fields as requested
        features: parseFeatures(features),
        duration: cleanInput(duration),
        metaTitle: cleanInput(metaTitle),
        metaDescription: cleanInput(metaDescription),
        isActive: parseBoolean(isActive) ?? true,
        featured: parseBoolean(featured) ?? false,
        sortOrder: parseInt(sortOrder) || 0,
      }
    });

    res.status(201).json(newService);

  } catch (error) {
    console.error("Error creating service:", error);
    
    // FAIL-SAFE: If DB creation failed, delete the image we just uploaded
    if (newImagePublicId) {
      await deleteCloudinaryImage(newImagePublicId);
    }

    if (error.code === 'P2002') {
      const target = error.meta?.target?.[0] || 'field';
      return res.status(409).json({ error: `A service with this ${target} already exists.` });
    }

    res.status(400).json({ error: error.message || "Error creating service" });
  }
};

// --- Update Service ---
export const updateService = async (req, res) => {
  let newImagePublicId = null;

  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) return res.status(400).json({ error: "Invalid ID" });

    // 1. Check if service exists first
    const existingService = await db.service.findUnique({ where: { id: Number(id) } });
    if (!existingService) {
      // If we uploaded a file but the ID is wrong, delete the file immediately
      if (req.file) await deleteCloudinaryImage(req.file.public_id);
      return res.status(404).json({ error: "Service not found" });
    }

    // 2. Prepare Update Data
    const data = req.body;
    const updatePayload = {};

    // Helper macro to only update fields that are present
    const fields = ['name', 'slug', 'title', 'subtitle', 'description', 'duration', 'metaTitle', 'metaDescription'];
    fields.forEach(field => {
      const cleaned = cleanInput(data[field]);
      if (cleaned !== undefined) updatePayload[field] = cleaned;
    });

    if (data.features !== undefined) updatePayload.features = parseFeatures(data.features);
    if (data.isActive !== undefined) updatePayload.isActive = parseBoolean(data.isActive);
    if (data.featured !== undefined) updatePayload.featured = parseBoolean(data.featured);
    if (data.sortOrder !== undefined) updatePayload.sortOrder = parseInt(data.sortOrder);

    // 3. Handle Image Replacement
    if (req.file) {
      newImagePublicId = req.file.public_id;
      updatePayload.coverImage = req.file.path;
      updatePayload.mainImage = req.file.path;
    }

    // 4. Update DB
    const updatedService = await db.service.update({
      where: { id: Number(id) },
      data: updatePayload
    });

    // 5. Cleanup Old Image (Only if update succeeded AND we have a new image)
    if (req.file && existingService.coverImage) {
      const oldPublicId = extractPublicIdFromUrl(existingService.coverImage);
      if (oldPublicId) await deleteCloudinaryImage(oldPublicId);
    }

    res.status(200).json(updatedService);

  } catch (error) {
    console.error("Error updating service:", error);

    // FAIL-SAFE: If DB update failed, delete the NEW image we just uploaded
    if (newImagePublicId) {
      await deleteCloudinaryImage(newImagePublicId);
    }

    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Slug or Name already exists." });
    }
    res.status(500).json({ error: "Internal server error during update" });
  }
};

// --- Get All Services ---
export const getAllServices = async (req, res) => {
  try {
    const { featured, isActive, sortBy = 'sortOrder', sortOrder = 'asc' } = req.query;
    
    const where = {};
    if (isActive !== undefined && isActive !== 'all') where.isActive = parseBoolean(isActive);
    if (featured !== undefined) where.featured = parseBoolean(featured);

    const services = await db.service.findMany({
      where,
      orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' }
    });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
};

// --- Get By ID ---
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) return res.status(400).json({ error: "Invalid ID" });

    const service = await db.service.findUnique({ where: { id: Number(id) } });
    if (!service) return res.status(404).json({ error: "Service not found" });

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ error: "Error fetching service" });
  }
};

// --- Get By Slug ---
export const getServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const service = await db.service.findUnique({ where: { slug } });
    if (!service) return res.status(404).json({ error: "Service not found" });

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ error: "Error fetching service" });
  }
};

// --- Delete Service ---
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) return res.status(400).json({ error: "Invalid ID" });

    // 1. Find service to get image URL
    const service = await db.service.findUnique({ where: { id: Number(id) } });
    if (!service) return res.status(404).json({ error: "Service not found" });

    // 2. Delete from DB
    await db.service.delete({ where: { id: Number(id) } });

    // 3. Delete from Cloudinary (Async/Non-blocking)
    if (service.coverImage) {
      const publicId = extractPublicIdFromUrl(service.coverImage);
      if (publicId) await deleteCloudinaryImage(publicId);
    }

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
};

// --- Toggle Status ---
export const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) return res.status(400).json({ error: "Invalid ID" });

    const service = await db.service.findUnique({ where: { id: Number(id) } });
    if (!service) return res.status(404).json({ error: "Service not found" });

    const updated = await db.service.update({
      where: { id: Number(id) },
      data: { isActive: !service.isActive }
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle status" });
  }
};