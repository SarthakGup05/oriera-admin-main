// controllers/gallery.controller.js
import { db } from "../libs/db.js";
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary storage for gallery
const galleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 2000, height: 2000, crop: 'limit' },
          { quality: 'auto:best' },
          { fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      return `gallery-${timestamp}-${randomString}`;
    },
  },
});

const upload = multer({
  storage: galleryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

export const uploadGalleryImage = upload.single('image');

// Create gallery image
export const createGalleryImage = async (req, res) => {
  try {
    const {
      alt,
      title,
      category,
      description,
      featured,
      isActive,
      sortOrder,
      metaTitle,
      metaDescription,
      serviceId
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    if (!title || !category || !alt) {
      return res.status(400).json({ 
        error: 'Title, category, and alt text are required' 
      });
    }

    // Create thumbnail URL from Cloudinary
    const thumbUrl = req.file.path.replace('/upload/', '/upload/c_thumb,w_400,h_400/');

    const galleryImage = await db.gallery.create({
      data: {
        src: req.file.path, // Full Cloudinary URL
        thumb: thumbUrl,
        alt,
        title,
        category,
        description: description || '',
        featured: featured === 'true' || featured === true || false,
        isActive: isActive === 'true' || isActive === true || true,
        sortOrder: parseInt(sortOrder) || 0,
        metaTitle: metaTitle || '',
        metaDescription: metaDescription || '',
        publicId: req.file.public_id,
        cloudinaryUrl: req.file.path,
        serviceId: serviceId ? parseInt(serviceId) : null,
      }
    });

    res.status(201).json(galleryImage);
  } catch (error) {
    console.error('Error creating gallery image:', error);
    
    // Clean up uploaded file on error
    if (req.file?.public_id) {
      await cloudinary.uploader.destroy(req.file.public_id);
    }
    
    res.status(500).json({ 
      error: 'Error creating gallery image', 
      details: error.message 
    });
  }
};

// Get all gallery images
export const getAllGalleryImages = async (req, res) => {
  try {
    const { 
      category, 
      featured,
      isActive = 'true',
      sortBy = 'date',
      sortOrder = 'desc',
      limit,
      offset,
      serviceId
    } = req.query;

    const where = {};
    
    if (isActive !== 'all') {
      where.isActive = isActive === 'true';
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (featured !== undefined) {
      where.featured = featured === 'true';
    }

    if (serviceId) {
      where.serviceId = parseInt(serviceId);
    }

    const orderBy = {};
    switch (sortBy) {
      case 'title':
        orderBy.title = sortOrder;
        break;
      case 'sortOrder':
        orderBy.sortOrder = sortOrder;
        break;
      case 'category':
        orderBy.category = sortOrder;
        break;
      case 'date':
      default:
        orderBy.date = sortOrder;
        break;
    }

    const galleryImages = await db.gallery.findMany({
      where,
      orderBy,
      include: {
        service: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

    // Get total count for pagination
    const totalCount = await db.gallery.count({ where });

    res.status(200).json({
      images: galleryImages,
      totalCount,
      hasMore: limit && offset ? (parseInt(offset) + parseInt(limit)) < totalCount : false
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ error: 'Error fetching gallery images' });
  }
};

// Get gallery image by ID
export const getGalleryImageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid image ID" });
    }

    const galleryImage = await db.gallery.findUnique({
      where: { id: Number(id) },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    if (!galleryImage) {
      return res.status(404).json({ error: "Gallery image not found" });
    }

    res.status(200).json(galleryImage);
  } catch (error) {
    console.error('Error fetching gallery image:', error);
    res.status(500).json({ error: 'Error fetching gallery image' });
  }
};

// Update gallery image
export const updateGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      alt,
      title,
      category,
      description,
      featured,
      isActive,
      sortOrder,
      metaTitle,
      metaDescription,
      serviceId
    } = req.body;

    console.log('Update request received:', { id, body: req.body }); // Debug log

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid image ID" });
    }

    // Check if image exists
    const existingImage = await db.gallery.findUnique({
      where: { id: Number(id) }
    });

    if (!existingImage) {
      return res.status(404).json({ error: "Gallery image not found" });
    }

    // Validate required fields
    if (!title || !category || !alt) {
      return res.status(400).json({ 
        error: 'Title, category, and alt text are required' 
      });
    }

    // Build update data object - FIXED: Proper type conversion
    const updateData = {
      alt: String(alt).trim(),
      title: String(title).trim(),
      category: String(category).trim(),
      description: description ? String(description).trim() : '',
      featured: Boolean(featured === 'true' || featured === true),
      isActive: Boolean(isActive === 'true' || isActive === true),
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      metaTitle: metaTitle ? String(metaTitle).trim() : '',
      metaDescription: metaDescription ? String(metaDescription).trim() : '',
      serviceId: serviceId && serviceId !== "none" && serviceId !== null ? parseInt(serviceId) : null,
      updatedAt: new Date() // Add updated timestamp
    };

    console.log('Update data prepared:', updateData); // Debug log

    const updatedImage = await db.gallery.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        service: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    console.log('Image updated successfully:', updatedImage.id); // Debug log

    res.status(200).json(updatedImage);
  } catch (error) {
    console.error('Error updating gallery image:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Duplicate entry found',
        details: error.message 
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Invalid service reference',
        details: 'The specified service does not exist' 
      });
    }

    res.status(500).json({ 
      error: 'Error updating gallery image', 
      details: error.message 
    });
  }
};


// Delete gallery image
export const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid image ID" });
    }

    const existingImage = await db.gallery.findUnique({
      where: { id: Number(id) }
    });

    if (!existingImage) {
      return res.status(404).json({ error: "Gallery image not found" });
    }

    // Delete from Cloudinary
    if (existingImage.publicId) {
      await cloudinary.uploader.destroy(existingImage.publicId);
    }

    await db.gallery.delete({
      where: { id: Number(id) }
    });

    res.status(200).json({ 
      message: "Gallery image deleted successfully",
      deletedImage: existingImage 
    });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ 
      error: 'Error deleting gallery image', 
      details: error.message 
    });
  }
};

// Get categories
export const getCategories = async (req, res) => {
  try {
    const categories = await db.gallery.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    });

    const categoryList = categories.map(item => item.category);
    
    res.status(200).json(categoryList);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
};
