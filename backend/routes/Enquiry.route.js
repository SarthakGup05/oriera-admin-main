import express from 'express';
import  { createEnquiry, deleteEnquiry, getAllEnquiries, updateEnquiryStatus } from '../controllers/Enquiry.controller.js';
import { authMiddleware } from '../middleware/authmiddleware.js';

const enquiryRouter = express.Router();

enquiryRouter.post('/create-enquiry', createEnquiry);
enquiryRouter.get('/get-all-enquiries', getAllEnquiries);
enquiryRouter.put('/update-enquiry/:id/status', authMiddleware, updateEnquiryStatus);
enquiryRouter.delete('/delete-enquiry/:id', authMiddleware, deleteEnquiry);

export default enquiryRouter;
