import { db } from "../libs/db.js";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine if it's an image or video
    const isVideo = file.mimetype.startsWith('video/');
    const isImage = file.mimetype.startsWith('image/');
    
    if (isVideo) {
      return {
        folder: 'testimonials/videos',
        resource_type: 'video',
        format: 'mp4', // Convert to mp4 for consistency
        transformation: [
          { width: 720, height: 1280, crop: 'fill', gravity: 'center' }, // 9:16 aspect ratio
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
      };
    } else if (isImage) {
      return {
        folder: 'testimonials/images',
        resource_type: 'image',
        format: 'jpg',
        transformation: [
          { width: 800, height: 800, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
      };
    }
    
    throw new Error('Unsupported file type');
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  },
});

// Multer middleware for handling multiple file types
export const uploadTestimonialFiles = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// Get all testimonials with filtering and pagination
export const getTestimonials = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      service, 
      isActive, 
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter conditions
    const where = {};
    if (type) where.type = type;
    if (service) where.service = service;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (featured !== undefined) where.featured = featured === 'true';
    
    // Build orderBy
    const orderBy = {};
    if (sortBy === 'sortOrder') {
      orderBy.sortOrder = sortOrder;
      orderBy.createdAt = 'desc'; // Secondary sort
    } else {
      orderBy[sortBy] = sortOrder;
    }
    
    const [testimonials, total] = await Promise.all([
      db.testimonial.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
      }),
      db.testimonial.count({ where })
    ]);
    
    res.json({
      testimonials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get testimonials error:', err);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
};

// Get single testimonial
export const getTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await db.testimonial.findUnique({
      where: { id: Number(id) }
    });
    
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    
    res.json(testimonial);
  } catch (err) {
    console.error('Get testimonial error:', err);
    res.status(500).json({ error: 'Failed to fetch testimonial' });
  }
};

// Create a testimonial with Cloudinary integration
export const createTestimonial = async (req, res) => {
  try {
       console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    const {
      name,
      service,
      rating,
      text,
      location,
      email,
      phone,
      type = 'text'
    } = req.body;
    
    // Validate required fields
    if (!name || !service || !rating || !location || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, service, rating, location, email' 
      });
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    // Validate type-specific requirements
    if (type === 'text' && !text?.trim()) {
      return res.status(400).json({ 
        error: 'Text review content is required for text testimonials' 
      });
    }
    
    if (type === 'video' && !req.files?.video) {
      return res.status(400).json({ 
        error: 'Video file is required for video testimonials' 
      });
    }
    
    const testimonialData = {
      name: name.trim(),
      service,
      rating: parseInt(rating),
      text: text?.trim() || '',
      location: location.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      type,
      isActive: false, // Requires admin approval
      featured: false,
      sortOrder: 0
    };
    
    // Handle profile image upload
    if (req.files?.image?.[0]) {
      testimonialData.image = req.files.image[0].path;
    }
    
    // Handle video upload for video testimonials
    if (type === 'video' && req.files?.video?.[0]) {
      const videoFile = req.files.video[0];
      testimonialData.videoUrl = videoFile.path;
      
      // Generate video poster/thumbnail
      try {
        const posterUrl = cloudinary.url(videoFile.public_id, {
          resource_type: 'video',
          format: 'jpg',
          transformation: [
            { width: 400, height: 711, crop: 'fill', gravity: 'center' }, // 9:16 poster
            { quality: 'auto:good' },
            { start_offset: '2' } // Take screenshot at 2 seconds
          ]
        });
        testimonialData.videoPoster = posterUrl;
      } catch (posterErr) {
        console.error('Error generating video poster:', posterErr);
        // Continue without poster - not critical
      }
    }
    
    const testimonial = await db.testimonial.create({
      data: testimonialData
    });
    
    res.status(201).json({
      message: 'Testimonial submitted successfully and is pending approval',
      testimonial
    });
    
  } catch (err) {
    console.error('Create testimonial error:', err);
    
    // Clean up uploaded files if database operation fails
    if (req.files) {
      const filesToDelete = [];
      if (req.files.image?.[0]?.public_id) filesToDelete.push(req.files.image[0].public_id);
      if (req.files.video?.[0]?.public_id) filesToDelete.push({ public_id: req.files.video[0].public_id, resource_type: 'video' });
      
      if (filesToDelete.length > 0) {
        try {
          await cloudinary.api.delete_resources(filesToDelete);
        } catch (deleteErr) {
          console.error('Error cleaning up uploaded files:', deleteErr);
        }
      }
    }
    
    res.status(400).json({ 
      error: 'Failed to create testimonial',
      details: err.message 
    });
  }
};

// Update testimonial (admin only)
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, featured, sortOrder, ...otherFields } = req.body;
    
    const updateData = {};
    
    // Only allow specific fields to be updated
    if (isActive !== undefined) updateData.isActive = isActive;
    if (featured !== undefined) updateData.featured = featured;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);
    
    // Allow updating text content
    if (otherFields.text !== undefined) updateData.text = otherFields.text.trim();
    
    const testimonial = await db.testimonial.update({
      where: { id: Number(id) },
      data: updateData
    });
    
    res.json({
      message: 'Testimonial updated successfully',
      testimonial
    });
  } catch (err) {
    console.error('Update testimonial error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.status(400).json({ error: 'Failed to update testimonial' });
  }
};

// Delete a testimonial with Cloudinary cleanup
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, get the testimonial to access file URLs
    const testimonial = await db.testimonial.findUnique({
      where: { id: Number(id) }
    });
    
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    
    // Delete from database first
    await db.testimonial.delete({ 
      where: { id: Number(id) } 
    });
    
    // Clean up Cloudinary files
    const filesToDelete = [];
    
    // Extract public_id from image URL
    if (testimonial.image) {
      try {
        const imagePublicId = testimonial.image.split('/').pop().split('.')[0];
        if (imagePublicId) {
          filesToDelete.push(`testimonials/images/${imagePublicId}`);
        }
      } catch (parseErr) {
        console.error('Error parsing image URL:', parseErr);
      }
    }
    
    // Extract public_id from video URL
    if (testimonial.videoUrl) {
      try {
        const videoPublicId = testimonial.videoUrl.split('/').pop().split('.')[0];
        if (videoPublicId) {
          filesToDelete.push({
            public_id: `testimonials/videos/${videoPublicId}`,
            resource_type: 'video'
          });
        }
      } catch (parseErr) {
        console.error('Error parsing video URL:', parseErr);
      }
    }
    
    // Delete files from Cloudinary
    if (filesToDelete.length > 0) {
      try {
        await Promise.all(
          filesToDelete.map(file => 
            typeof file === 'string' 
              ? cloudinary.uploader.destroy(file)
              : cloudinary.uploader.destroy(file.public_id, { resource_type: file.resource_type })
          )
        );
      } catch (cloudinaryErr) {
        console.error('Error deleting files from Cloudinary:', cloudinaryErr);
        // Don't fail the request if file cleanup fails
      }
    }
    
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (err) {
    console.error('Delete testimonial error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
};

// Get testimonials for public display (active only)
export const getPublicTestimonials = async (req, res) => {
  try {
    const { 
      type, 
      service, 
      featured, 
      limit = 12,
      sortBy = 'sortOrder' 
    } = req.query;
    
    const where = { isActive: true };
    if (type) where.type = type;
    if (service) where.service = service;
    if (featured !== undefined) where.featured = featured === 'true';
    
    const orderBy = [];
    if (sortBy === 'sortOrder') {
      orderBy.push({ sortOrder: 'asc' });
      orderBy.push({ createdAt: 'desc' });
    } else {
      orderBy.push({ [sortBy]: 'desc' });
    }
    
    const testimonials = await db.testimonial.findMany({
      where,
      orderBy,
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        service: true,
        image: true,
        rating: true,
        text: true,
        location: true,
        type: true,
        videoUrl: true,
        videoPoster: true,
        featured: true,
        createdAt: true
        // Exclude sensitive info like email, phone
      }
    });
    
    res.json({ testimonials });
  } catch (err) {
    console.error('Get public testimonials error:', err);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
};
