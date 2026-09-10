import express from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";

const DashboardRouter = express.Router();

DashboardRouter.get("/stats", dashboardController.getDashboardStats);
DashboardRouter.get("/enquiries/recent", dashboardController.getRecentEnquiries);
DashboardRouter.get("/testimonials/recent", dashboardController.getRecentTestimonials);
DashboardRouter.get("/services/popular", dashboardController.getPopularServices);
DashboardRouter.get("/packages/popular", dashboardController.getPopularPackages);
DashboardRouter.get("/gallery/stats", dashboardController.getGalleryStats);

export default DashboardRouter;
