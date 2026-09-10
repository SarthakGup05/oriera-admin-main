import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// ✅ Cloudinary Environment Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===================================================
// 🖼 Universal Image Configuration (Max Quality)
// ===================================================

/*
 💡 WHY THIS CONFIG:
 - Uses `q_auto:best` → visually lossless
 - Uses `f_auto` → serves WebP/AVIF for modern browsers
 - Uses `dpr_auto` → auto-scales for retina / high-DPR screens
 - Removes fixed width/height so Cloudinary can dynamically adapt
 - Works perfectly with responsive <img srcset> or Next.js <Image>
*/

const desktopImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "slider/images/desktop",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
    transformation: [
      { crop: "fill", gravity: "auto" },
      { quality: "auto:best" },
      { fetch_format: "auto" },
      { dpr: "auto" },
      { flags: "progressive" },
    ],
  },
});

const mobileImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "slider/images/mobile",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
    transformation: [
      { crop: "fill", gravity: "auto" },
      { quality: "auto:best" },
      { fetch_format: "auto" },
      { dpr: "auto" },
      { flags: "progressive" },
    ],
  },
});

// ===================================================
// 🎥 Video Configuration (High Bitrate, Full Quality)
// ===================================================

const desktopVideoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "slider/videos/desktop",
    resource_type: "video",
    allowed_formats: ["mp4", "webm", "mov"],
    transformation: [
      {
        crop: "fill",
        quality: "auto:best",
        bit_rate: "8000k",
        video_codec: "h264",
        audio_codec: "aac",
        fps: "30",
      },
    ],
  },
});

const mobileVideoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "slider/videos/mobile",
    resource_type: "video",
    allowed_formats: ["mp4", "webm"],
    transformation: [
      {
        crop: "fill",
        quality: "auto:best",
        bit_rate: "4000k",
        video_codec: "h264",
        audio_codec: "aac",
        fps: "30",
      },
    ],
  },
});

// ===================================================
// 🖼 Poster Image Configuration (Used for videos)
// ===================================================

const posterStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "slider/posters",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { crop: "fill", gravity: "auto" },
      { quality: "auto:best" },
      { fetch_format: "auto" },
      { dpr: "auto" },
    ],
  },
});

// ===================================================
// 🧱 Multer Middleware Definitions
// ===================================================

export const uploadDesktopImage = multer({
  storage: desktopImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadMobileImage = multer({
  storage: mobileImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadDesktopVideo = multer({
  storage: desktopVideoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

export const uploadMobileVideo = multer({
  storage: mobileVideoStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadPoster = multer({
  storage: posterStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ===================================================
// 🧠 Utility: Smart Upload Stream Helper
// ===================================================

export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      folder = "slider",
      resource_type = "image",
      transformation = [
        { crop: "fill", gravity: "auto" },
        { quality: "auto:best" },
        { fetch_format: "auto" },
        { dpr: "auto" },
      ],
      public_id,
      ...rest
    } = options;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
        transformation,
        public_id,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...rest,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

// ===================================================
// 🌍 Utility: Dynamic Responsive URLs
// ===================================================

export const getResponsiveImageUrl = (publicId) => {
  // Creates URL with auto format, auto DPR, best quality
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        crop: "fill",
        gravity: "auto",
        fetch_format: "auto",
        quality: "auto:best",
        dpr: "auto",
        flags: "progressive",
      },
    ],
  });
};

// Generate multiple quality variants for srcset if needed
export const generateImageSrcSet = (publicId) => {
  return [
    `${cloudinary.url(publicId, {
      transformation: [
        { width: 640, crop: "fill", gravity: "auto", q_auto: "best", f_auto: "auto", dpr: "auto" },
      ],
    })} 640w`,
    `${cloudinary.url(publicId, {
      transformation: [
        { width: 1280, crop: "fill", gravity: "auto", q_auto: "best", f_auto: "auto", dpr: "auto" },
      ],
    })} 1280w`,
    `${cloudinary.url(publicId, {
      transformation: [
        { width: 1920, crop: "fill", gravity: "auto", q_auto: "best", f_auto: "auto", dpr: "auto" },
      ],
    })} 1920w`,
    `${cloudinary.url(publicId, {
      transformation: [
        { width: 2560, crop: "fill", gravity: "auto", q_auto: "best", f_auto: "auto", dpr: "auto" },
      ],
    })} 2560w`,
  ].join(", ");
};

// ===================================================
// 📊 Debug Utility
// ===================================================
export const getCloudinaryStats = () => ({
  config: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    optimization: "Maximum Quality Responsive Images",
  },
  best_practices: [
    "q_auto:best → visually lossless optimization",
    "f_auto → automatic format (WebP/AVIF)",
    "dpr_auto → retina/high-DPI support",
    "progressive JPEG/WebP → smooth loading",
  ],
  recommended_delivery: "/upload/c_fill,g_auto,q_auto:best,f_auto,dpr_auto/",
});

export { cloudinary };
