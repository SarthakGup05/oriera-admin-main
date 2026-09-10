import express from 'express';
import {
  createPackage,
  getAllPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} from '../controllers/Packges.controller.js';
import { authMiddleware } from '../middleware/authmiddleware.js';

const packagerouter = express.Router();

packagerouter.get('/get-packages', getAllPackages);
packagerouter.get('/packages/:id', getPackageById);
packagerouter.post('/packages/create', authMiddleware, createPackage);
packagerouter.put('/packages-update/:id', authMiddleware, updatePackage);
packagerouter.delete('/packages-delete/:id', authMiddleware, deletePackage);

export default packagerouter;
