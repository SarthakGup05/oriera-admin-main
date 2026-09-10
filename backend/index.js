import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from 'path';
import authRoutes from "./routes/auth.route.js";
import packagerouter from "./routes/Packges.routes.js";
import testimonialrouter from "./routes/testimonial.route.js";
import portfolioRouter from "./routes/porfolio.route.js";
import storyRouter from "./routes/story.route.js";
import enquiryRouter from "./routes/Enquiry.route.js";
import ServiceRouter from "./routes/service.route.js";
import GalleryRouter from "./routes/gallery.route.js";
import sliderRouter from "./routes/slider.routes.js";
import DashboardRouter from "./routes/Dashboard.route.js";
import healthRouter from "./routes/health.route.js";
import blogRouter from "./routes/blog.route.js";



dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://oriera-admin.vercel.app", "https://jaya-photography-next.vercel.app", "https://jayaphotography.vercel.app", "https://jayaphotography.in", "https://www.jayaphotography.in", "http://localhost:3000", "https://admin.jayaphotography.in"], // frontend URLs
    credentials: true, // if you use cookies
    allowedHeaders: ["Content-Type", "Authorization"], // ✅ allow Authorization
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // optional, but safe
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Welcome to the backend server!");
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/services", ServiceRouter);
app.use("/api/v1/gallery", GalleryRouter);
app.use("/api/v1/packages", packagerouter);
app.use("/api/v1/testimonials", testimonialrouter);
app.use("/api/v1/portfolio", portfolioRouter);
app.use("/api/v1/featured", storyRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/enquiries", enquiryRouter);
app.use("/api/v1/slider", sliderRouter);
app.use("/api/v1/dashboard", DashboardRouter);
app.use("/api/v1/health", healthRouter);



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
