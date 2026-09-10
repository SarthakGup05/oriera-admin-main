// src/routes/sliderRoutes.js
import express from 'express';
import multer from 'multer';
import {
  getAllSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
  reorderSliders,
  toggleSliderStatus,
  getSlidersByType,
} from '../controllers/slider.controller.js';
import {
  uploadDesktopImage,
  uploadMobileImage,
  uploadPoster,
  uploadDesktopVideo,
  uploadMobileVideo,
} from '../utils/cloudinary.js';
import { authMiddleware } from '../middleware/authmiddleware.js';

const sliderRouter = express.Router();

// ======================================================
// 📸 File Upload Middleware Setup
// ======================================================

// ✅ Combine all supported upload fields into one unified handler
const upload = multer().fields([
  { name: 'media', maxCount: 1 },        // desktop image/video
  { name: 'mobileMedia', maxCount: 1 },  // mobile version (optional)
  { name: 'poster', maxCount: 1 },       // video poster (optional)
]);

// ======================================================
// 🟢 PUBLIC ROUTES
// ======================================================
sliderRouter.get('/get-sliders', getAllSliders);
sliderRouter.get('/get-slider/:id', getSliderById);
sliderRouter.get('/by-type/:type', getSlidersByType);

// ======================================================
// 🔒 PROTECTED ROUTES
// ======================================================

// ✅ Create new slider (uploads handled by unified multer middleware)
sliderRouter.post('/create-slider', authMiddleware, upload, createSlider);

// ✅ Update existing slider
sliderRouter.put('/update-slider/:id', authMiddleware, upload, updateSlider);

// ✅ Toggle active/inactive
sliderRouter.patch('/toggle-status/:id', authMiddleware, toggleSliderStatus);

// ✅ Reorder sliders
sliderRouter.patch('/reorder', authMiddleware, reorderSliders);

// ✅ Delete slider
sliderRouter.delete('/delete-slider/:id', authMiddleware, deleteSlider);

export default sliderRouter;
