import express from "express";
import {
  createPortfolioItem,
  deletePortfolioItem,
  getPortfolioItems,
  updatePortfolioItem,
} from "../controllers/portfolio.controller.js";

import { authMiddleware } from "../middleware/authmiddleware.js";

const portfolioRouter = express.Router();

portfolioRouter.get("/get-portfolio", getPortfolioItems);
portfolioRouter.post("/create", authMiddleware, createPortfolioItem);
portfolioRouter.put("/update/:id", authMiddleware, updatePortfolioItem);
portfolioRouter.delete("/delete/:id", authMiddleware, deletePortfolioItem);

export default portfolioRouter;
