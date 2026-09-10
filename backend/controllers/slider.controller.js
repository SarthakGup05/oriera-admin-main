// src/controllers/sliderController.js
import { db } from '../libs/db.js';
import Joi from 'joi';
import { cloudinary, uploadToCloudinary } from '../utils/cloudinary.js';

const prisma = db;

// ===================================================
// 📋 Validation Schemas
// ===================================================
const createSliderSchema = Joi.object({
  title: Joi.string().required().min(1).max(200).trim(),
  subtitle: Joi.string().allow('', null).max(300).trim(),
  description: Joi.string().allow('', null).max(500).trim(),
  type: Joi.string().valid('IMAGE', 'VIDEO').required(),
  order: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true),
});

const updateSliderSchema = Joi.object({
  title: Joi.string().min(1).max(200).trim(),
  subtitle: Joi.string().allow('', null).max(300).trim(),
  description: Joi.string().allow('', null).max(500).trim(),
  type: Joi.string().valid('IMAGE', 'VIDEO'),
  order: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
});

// ===================================================
// 🧩 Helper Functions
// ===================================================
const IMAGE_TRANSFORM = [
  { crop: 'fill', gravity: 'auto' },
  { quality: 'auto:best' },
  { fetch_format: 'auto' },
  { dpr: 'auto' },
  { flags: 'progressive' },
];

const VIDEO_TRANSFORM = [
  { crop: 'fill', quality: 'auto:best', bit_rate: '8000k', video_codec: 'h264', audio_codec: 'aac', fps: '30' },
];

const getPublicIdFromUrl = (url) => {
  try {
    const match = url.match(/upload\/(?:v\d+\/)?([^\.]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// ===================================================
// 📦 Get All Sliders
// ===================================================
export const getAllSliders = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [sliders, total] = await Promise.all([
      prisma.slider.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: parseInt(limit),
      }),
      prisma.slider.count({ where }),
    ]);

    // Add optimized URL for each slider
    const enhanced = sliders.map((s) => ({
      ...s,
      optimizedUrl: s.mediaUrl
        ? s.mediaUrl.replace('/upload/', '/upload/c_fill,g_auto,q_auto:best,f_auto,dpr_auto/')
        : null,
    }));

    res.json({
      success: true,
      data: enhanced,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + sliders.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching sliders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sliders',
      error: error.message,
    });
  }
};

// ===================================================
// 🧱 Get Single Slider
// ===================================================
export const getSliderById = async (req, res) => {
  try {
    const { id } = req.params;
    const slider = await prisma.slider.findUnique({ where: { id } });

    if (!slider) {
      return res.status(404).json({ success: false, message: 'Slider not found' });
    }

    slider.optimizedUrl = slider.mediaUrl
      ? slider.mediaUrl.replace('/upload/', '/upload/c_fill,g_auto,q_auto:best,f_auto,dpr_auto/')
      : null;

    res.json({ success: true, data: slider });
  } catch (error) {
    console.error('Error fetching slider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch slider',
      error: error.message,
    });
  }
};

// ===================================================
// 🆕 Create Slider
// ===================================================
export const createSlider = async (req, res) => {
  try {
    const { error, value } = createSliderSchema.validate(req.body);
    if (error)
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });

    const { title, subtitle, description, type, order, isActive } = value;
    const desktopFile = req.files?.media?.[0];
    const mobileFile = req.files?.mobileMedia?.[0];

    if (!desktopFile)
      return res.status(400).json({
        success: false,
        message: 'Desktop media file is required',
      });

    let mediaUrl, mobileMediaUrl, posterUrl;

    // Upload Desktop
    if (type === 'IMAGE') {
      const desktopResult = await uploadToCloudinary(desktopFile.buffer, {
        folder: 'slider/images/desktop',
        resource_type: 'image',
        invalidate: true,
        transformation: IMAGE_TRANSFORM,
      });
      mediaUrl = desktopResult.secure_url;

      if (mobileFile) {
        const mobileResult = await uploadToCloudinary(mobileFile.buffer, {
          folder: 'slider/images/mobile',
          resource_type: 'image',
          invalidate: true,
          transformation: IMAGE_TRANSFORM,
        });
        mobileMediaUrl = mobileResult.secure_url;
      }
    } else if (type === 'VIDEO') {
      const desktopResult = await uploadToCloudinary(desktopFile.buffer, {
        folder: 'slider/videos/desktop',
        resource_type: 'video',
        invalidate: true,
        transformation: VIDEO_TRANSFORM,
      });
      mediaUrl = desktopResult.secure_url;

      if (mobileFile) {
        const mobileResult = await uploadToCloudinary(mobileFile.buffer, {
          folder: 'slider/videos/mobile',
          resource_type: 'video',
          invalidate: true,
          transformation: VIDEO_TRANSFORM,
        });
        mobileMediaUrl = mobileResult.secure_url;
      }

      const posterFile = req.files?.poster?.[0];
      if (posterFile) {
        const posterResult = await uploadToCloudinary(posterFile.buffer, {
          folder: 'slider/posters',
          resource_type: 'image',
          invalidate: true,
          transformation: IMAGE_TRANSFORM,
        });
        posterUrl = posterResult.secure_url;
      }
    }

    const slider = await prisma.slider.create({
      data: {
        title,
        subtitle: subtitle || null,
        description: description || null,
        type,
        mediaUrl,
        mobileMediaUrl: mobileMediaUrl || null,
        posterUrl: posterUrl || null,
        order,
        isActive,
      },
    });

    slider.optimizedUrl = mediaUrl
      ? mediaUrl.replace('/upload/', '/upload/c_fill,g_auto,q_auto:best,f_auto,dpr_auto/')
      : null;

    res.status(201).json({
      success: true,
      message: 'Slider created successfully',
      data: slider,
    });
  } catch (error) {
    console.error('Error creating slider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create slider',
      error: error.message,
    });
  }
};

// ===================================================
// ✏️ Update Slider
// ===================================================
export const updateSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateSliderSchema.validate(req.body);
    if (error)
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });

    const existingSlider = await prisma.slider.findUnique({ where: { id } });
    if (!existingSlider)
      return res.status(404).json({ success: false, message: 'Slider not found' });

    const updateData = { ...value };
    const desktopFile = req.files?.media?.[0];
    const mobileFile = req.files?.mobileMedia?.[0];
    const currentType = value.type || existingSlider.type;

    // Update Desktop
    if (desktopFile) {
      const result = await uploadToCloudinary(desktopFile.buffer, {
        folder: currentType === 'VIDEO' ? 'slider/videos/desktop' : 'slider/images/desktop',
        resource_type: currentType === 'VIDEO' ? 'video' : 'image',
        invalidate: true,
        transformation: currentType === 'VIDEO' ? VIDEO_TRANSFORM : IMAGE_TRANSFORM,
      });
      updateData.mediaUrl = result.secure_url;

      if (existingSlider.mediaUrl) {
        const publicId = getPublicIdFromUrl(existingSlider.mediaUrl);
        const folderPrefix = existingSlider.type === 'VIDEO' ? 'slider/videos/desktop' : 'slider/images/desktop';
        cloudinary.uploader.destroy(`${folderPrefix}/${publicId}`, {
          resource_type: existingSlider.type === 'VIDEO' ? 'video' : 'image',
        }).catch(console.warn);
      }
    }

    // Update Mobile
    if (mobileFile) {
      const result = await uploadToCloudinary(mobileFile.buffer, {
        folder: currentType === 'VIDEO' ? 'slider/videos/mobile' : 'slider/images/mobile',
        resource_type: currentType === 'VIDEO' ? 'video' : 'image',
        invalidate: true,
        transformation: currentType === 'VIDEO' ? VIDEO_TRANSFORM : IMAGE_TRANSFORM,
      });
      updateData.mobileMediaUrl = result.secure_url;

      if (existingSlider.mobileMediaUrl) {
        const publicId = getPublicIdFromUrl(existingSlider.mobileMediaUrl);
        const folderPrefix = existingSlider.type === 'VIDEO' ? 'slider/videos/mobile' : 'slider/images/mobile';
        cloudinary.uploader.destroy(`${folderPrefix}/${publicId}`, {
          resource_type: existingSlider.type === 'VIDEO' ? 'video' : 'image',
        }).catch(console.warn);
      }
    }

    // Poster
    const posterFile = req.files?.poster?.[0];
    if (posterFile && currentType === 'VIDEO') {
      const posterResult = await uploadToCloudinary(posterFile.buffer, {
        folder: 'slider/posters',
        resource_type: 'image',
        invalidate: true,
        transformation: IMAGE_TRANSFORM,
      });
      updateData.posterUrl = posterResult.secure_url;

      if (existingSlider.posterUrl) {
        const publicId = getPublicIdFromUrl(existingSlider.posterUrl);
        cloudinary.uploader.destroy(`slider/posters/${publicId}`).catch(console.warn);
      }
    }

    const updatedSlider = await prisma.slider.update({ where: { id }, data: updateData });
    updatedSlider.optimizedUrl = updatedSlider.mediaUrl
      ? updatedSlider.mediaUrl.replace('/upload/', '/upload/c_fill,g_auto,q_auto:best,f_auto,dpr_auto/')
      : null;

    res.json({
      success: true,
      message: 'Slider updated successfully',
      data: updatedSlider,
    });
  } catch (error) {
    console.error('Error updating slider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update slider',
      error: error.message,
    });
  }
};

// ===================================================
// ❌ Delete Slider
// ===================================================
export const deleteSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const slider = await prisma.slider.findUnique({ where: { id } });
    if (!slider) return res.status(404).json({ success: false, message: 'Slider not found' });

    const cleanup = [];

    const addCleanup = (url, folder, resource_type = 'image') => {
      const publicId = getPublicIdFromUrl(url);
      if (publicId) {
        cleanup.push(
          cloudinary.uploader.destroy(`${folder}/${publicId}`, { resource_type })
        );
      }
    };

    if (slider.mediaUrl)
      addCleanup(slider.mediaUrl, slider.type === 'VIDEO' ? 'slider/videos/desktop' : 'slider/images/desktop', slider.type === 'VIDEO' ? 'video' : 'image');

    if (slider.mobileMediaUrl)
      addCleanup(slider.mobileMediaUrl, slider.type === 'VIDEO' ? 'slider/videos/mobile' : 'slider/images/mobile', slider.type === 'VIDEO' ? 'video' : 'image');

    if (slider.posterUrl)
      addCleanup(slider.posterUrl, 'slider/posters');

    Promise.allSettled(cleanup).then(() => console.log('🧹 Cloudinary cleanup complete'));

    await prisma.slider.delete({ where: { id } });

    res.json({ success: true, message: 'Slider deleted successfully' });
  } catch (error) {
    console.error('Error deleting slider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete slider',
      error: error.message,
    });
  }
};

// ===================================================
// 🔁 Reorder Sliders
// ===================================================
export const reorderSliders = async (req, res) => {
  try {
    const { sliders } = req.body;
    if (!Array.isArray(sliders))
      return res.status(400).json({
        success: false,
        message: 'Sliders must be an array of {id, order}',
      });

    const schema = Joi.array().items(
      Joi.object({ id: Joi.string().required(), order: Joi.number().integer().min(0).required() })
    );
    const { error } = schema.validate(sliders);
    if (error)
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        errors: error.details.map((d) => d.message),
      });

    await Promise.all(sliders.map(({ id, order }) => prisma.slider.update({ where: { id }, data: { order } })));
    res.json({ success: true, message: 'Sliders reordered successfully' });
  } catch (error) {
    console.error('Error reordering sliders:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder sliders', error: error.message });
  }
};

// ===================================================
// 🔄 Toggle Slider Status
// ===================================================
export const toggleSliderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const slider = await prisma.slider.findUnique({ where: { id } });
    if (!slider) return res.status(404).json({ success: false, message: 'Slider not found' });

    const updated = await prisma.slider.update({
      where: { id },
      data: { isActive: !slider.isActive },
    });

    res.json({
      success: true,
      message: `Slider ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error('Error toggling slider status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle slider status',
      error: error.message,
    });
  }
};

// ===================================================
// 🧭 Get Sliders by Type
// ===================================================
export const getSlidersByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { isActive = 'true', page = 1, limit = 10 } = req.query;

    if (!['IMAGE', 'VIDEO'].includes(type))
      return res.status(400).json({ success: false, message: 'Invalid type. Must be IMAGE or VIDEO' });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { type, isActive: isActive === 'true' };

    const [sliders, total] = await Promise.all([
      prisma.slider.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: parseInt(limit),
      }),
      prisma.slider.count({ where }),
    ]);

    const enhanced = sliders.map((s) => ({
      ...s,
      optimizedUrl: s.mediaUrl
        ? s.mediaUrl.replace('/upload/', '/upload/c_fill,g_auto,q_auto:best,f_auto,dpr_auto/')
        : null,
    }));

    res.json({
      success: true,
      data: enhanced,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + sliders.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching sliders by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sliders by type',
      error: error.message,
    });
  }
};
