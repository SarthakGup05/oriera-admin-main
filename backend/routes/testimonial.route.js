import express from 'express';
import { createTestimonial, deleteTestimonial, getTestimonials, updateTestimonial, uploadTestimonialFiles } from '../controllers/testimonial.controller.js';
import { authMiddleware } from '../middleware/authmiddleware.js';

const testimonialrouter = express.Router();

testimonialrouter.get('/get-testimonials', getTestimonials);
testimonialrouter.put('/update-testimonial/:id', authMiddleware, updateTestimonial); // Reusing createTestimonial for update
testimonialrouter.post('/create-testimonial', uploadTestimonialFiles, createTestimonial);
testimonialrouter.delete('/delete-testimonial/:id', authMiddleware, deleteTestimonial);

export default testimonialrouter;
