import { create } from "zustand";
import axiosInstance from "@/lib/axiosinstaance";
import { toast } from "react-hot-toast";

const useGalleryStore = create((set, get) => ({
  // 🔹 State
  images: [],
  services: [],
  categories: [],
  loading: false,
  saving: false,
  uploadingImage: false,
  deleting: null,
  error: null,

  // 🔹 Filter States
  searchTerm: "",
  selectedCategory: "all",
  selectedService: "all",

  // 🔹 Dialog Management States
  dialogOpen: false,
  dialogMode: "add", // 'add' | 'edit' | 'view'
  selectedImage: null,

  // 🔹 Form States
  formData: {
    title: "",
    alt: "",
    category: "",
    description: "",
    featured: false,
    isActive: true,
    sortOrder: 0,
    metaTitle: "",
    metaDescription: "",
    serviceId: null,
  },

  // 🔹 Image Upload States
  imagePreview: null,
  selectedFile: null,

  // 🔹 Cache Busting Helper Function
  addCacheBuster: (url) => {
    if (!url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${Date.now()}`;
  },

  // 🔹 Filter Actions
  setSearchTerm: (term) => {
    set({ searchTerm: term });
  },
  
  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },
  
  setSelectedService: (service) => {
    set({ selectedService: service });
  },

  // 🔹 Dialog Actions
  setDialogOpen: (open) => {
    set({ dialogOpen: open });
  },
  
  setDialogMode: (mode) => {
    set({ dialogMode: mode });
  },
  
  setSelectedImage: (image) => {
    set({ selectedImage: image });
  },

  // 🔹 Form Actions
  setFormData: (data) => {
    set({ formData: data });
  },
  
  updateFormField: (field, value) => {
    const prevState = get().formData;
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    }));
  },
  
  resetFormData: () => {
    const resetData = {
      title: "",
      alt: "",
      category: "",
      description: "",
      featured: false,
      isActive: true,
      sortOrder: 0,
      metaTitle: "",
      metaDescription: "",
      serviceId: null,
    };
    set({ formData: resetData });
  },

  // 🔹 Blob URL Validation Utility
  validateBlobUrl: async (url) => {
    if (!url || typeof url !== "string" || !url.startsWith("blob:")) {
      return false;
    }

    try {
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // 🔹 Enhanced Image Preview Setter with Validation
  setImagePreview: async (preview) => {
    if (preview && preview.startsWith("blob:")) {
      const isValid = await get().validateBlobUrl(preview);
      if (!isValid) {
        toast.error("Image preview expired, please re-select the image");
        set({ imagePreview: null, selectedFile: null });
        return;
      }
    }
    
    set({ imagePreview: preview });
  },

  setSelectedFile: (file) => {
    set({ selectedFile: file });
  },

  // 🔹 API Actions - Fetch gallery images
  fetchImages: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await axiosInstance.get("/gallery/images", {
        params: { isActive: "all", sortBy: "date", sortOrder: "desc" },
      });
      
      set({ images: response.data.images || response.data, loading: false });

      // Only show success toast on initial load if no images
      const { images } = get();
      if (images.length === 0) {
        toast.success("Gallery images loaded successfully");
      }
    } catch (err) {
      toast.error("Failed to load gallery images");
      set({
        error: err.response?.data?.message || "Failed to fetch images",
        loading: false,
      });
    }
  },

  // 🔹 Fetch services
  fetchServices: async () => {
    try {
      const response = await axiosInstance.get("/services/get-services");
      set({ services: response.data });
    } catch (err) {
      toast.error("Failed to load services");
    }
  },

  // 🔹 Fetch categories
  fetchCategories: async () => {
    try {
      const response = await axiosInstance.get("/gallery/categories");
      set({ categories: response.data });
    } catch (err) {
      toast.error("Failed to load categories");
    }
  },

  // 🔹 Image Upload Handler - Fixed version
  uploadImage: async (file) => {
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file", { icon: "❌" });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB", { icon: "⚠️" });
      return;
    }

    try {
      set({ uploadingImage: true });
      toast.loading("Processing image...", { id: "image-upload" });

      // Clean up previous object URL ONLY if it's different
      const { imagePreview, selectedFile } = get();
      if (imagePreview && imagePreview.startsWith("blob:") && selectedFile !== file) {
        try {
          URL.revokeObjectURL(imagePreview);
        } catch (error) {
          // Silent fail
        }
      }

      // Create preview object URL
      const previewUrl = URL.createObjectURL(file);
      
      set({
        imagePreview: previewUrl,
        selectedFile: file,
      });

      toast.success("Image selected successfully", {
        id: "image-upload",
        icon: "✅",
      });
    } catch (error) {
      toast.error("Failed to process image", {
        id: "image-upload",
        icon: "❌",
      });
      set({ imagePreview: null, selectedFile: null });
    } finally {
      set({ uploadingImage: false });
    }
  },

  // 🔹 Remove Image Preview - Enhanced version
  removeImage: () => {
    const { imagePreview } = get();
    
    if (imagePreview && imagePreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch (error) {
        // Silent fail
      }
    }
    
    set({ imagePreview: null, selectedFile: null });
    toast.success("Image removed", { icon: "🗑️" });
  },

  // 🔹 Dialog Management Actions - FIXED WITH CACHE BUSTING
  openAddDialog: () => {
    const { imagePreview } = get();
    
    // Clean up any existing object URLs when opening fresh add dialog
    if (imagePreview && imagePreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch (error) {
        // Silent fail
      }
    }

    const newState = {
      dialogMode: "add",
      selectedImage: null,
      formData: {
        title: "",
        alt: "",
        category: "",
        description: "",
        featured: false,
        isActive: true,
        sortOrder: 0,
        metaTitle: "",
        metaDescription: "",
        serviceId: null,
      },
      imagePreview: null,
      selectedFile: null,
      dialogOpen: true,
    };
    
    set(newState);
  },

  openViewDialog: (image) => {
    const newState = {
      dialogMode: "view",
      selectedImage: image,
      formData: {
        title: image.title || "",
        alt: image.alt || "",
        category: image.category || "",
        description: image.description || "",
        featured: image.featured || false,
        isActive: image.isActive !== undefined ? image.isActive : true,
        sortOrder: image.sortOrder || 0,
        metaTitle: image.metaTitle || "",
        metaDescription: image.metaDescription || "",
        serviceId: image.serviceId || null,
      },
      // CACHE BUSTING: Add version parameter to prevent caching
      imagePreview: get().addCacheBuster(image.src),
      selectedFile: null,
      dialogOpen: true,
    };
    
    set(newState);
  },

  openEditDialog: (image) => {
    const newState = {
      dialogMode: "edit",
      selectedImage: image,
      formData: {
        title: image.title || "",
        alt: image.alt || "",
        category: image.category || "",
        description: image.description || "",
        featured: image.featured || false,
        isActive: image.isActive !== undefined ? image.isActive : true,
        sortOrder: image.sortOrder || 0,
        metaTitle: image.metaTitle || "",
        metaDescription: image.metaDescription || "",
        serviceId: image.serviceId || null,
      },
      // CACHE BUSTING: Add version parameter to prevent caching
      imagePreview: get().addCacheBuster(image.src),
      selectedFile: null,
      dialogOpen: true,
    };
    
    set(newState);
  },

  closeDialog: () => {
    const { imagePreview, selectedFile } = get();
    
    // Only clean up blob URLs that were created from file uploads
    // Don't clean up regular image URLs (image.src)
    if (imagePreview && imagePreview.startsWith("blob:") && selectedFile) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch (error) {
        // Silent fail
      }
    }
    
    set({
      dialogOpen: false,
      imagePreview: null,
      selectedFile: null,
    });
  },

  // 🔹 Add new image - Fixed version
  addImage: async (formData) => {
    const { saving, selectedFile, imagePreview } = get();

    // Prevent double submission
    if (saving) {
      toast.error("Please wait, save in progress...", { icon: "⏳" });
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error("Image title is required", { icon: "⚠️" });
      return;
    }
    if (!formData.alt.trim()) {
      toast.error("Alt text is required for accessibility", { icon: "⚠️" });
      return;
    }
    if (!formData.category.trim()) {
      toast.error("Category is required", { icon: "⚠️" });
      return;
    }
    if (!selectedFile) {
      toast.error("Please select an image file", { icon: "📁" });
      return;
    }

    // Validate blob URL before proceeding
    if (imagePreview && imagePreview.startsWith("blob:")) {
      const isValid = await get().validateBlobUrl(imagePreview);
      if (!isValid) {
        toast.error("Image preview expired, please re-select the image");
        return;
      }
    }

    set({ saving: true });
    const saveToastId = `save-${Date.now()}`;
    toast.loading("Uploading image...", { id: saveToastId });

    try {
      const submitFormData = new FormData();

      // Add text fields
      submitFormData.append("title", formData.title);
      submitFormData.append("alt", formData.alt);
      submitFormData.append("category", formData.category);
      submitFormData.append("description", formData.description || "");
      submitFormData.append("featured", formData.featured.toString());
      submitFormData.append("isActive", formData.isActive.toString());
      submitFormData.append("sortOrder", formData.sortOrder.toString());
      submitFormData.append("metaTitle", formData.metaTitle || "");
      submitFormData.append("metaDescription", formData.metaDescription || "");

      if (formData.serviceId && formData.serviceId !== "none") {
        submitFormData.append("serviceId", formData.serviceId.toString());
      }

      // Add image file
      submitFormData.append("image", selectedFile);

      const res = await axiosInstance.post("/gallery/upload", submitFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Clean up object URLs ONLY after successful save
      if (imagePreview && imagePreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imagePreview);
        } catch (error) {
          // Silent fail
        }
      }

      set((state) => ({
        images: [res.data, ...state.images],
        saving: false,
        dialogOpen: false,
        imagePreview: null,
        selectedFile: null,
      }));

      toast.success("Image uploaded successfully! 🎉", { id: saveToastId });

      // Refresh categories in case new one was added
      get().fetchCategories();

      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to upload image";
      toast.error(`${errorMessage} ❌`, {
        id: saveToastId,
        duration: 6000,
      });
      set({ saving: false });
      throw err;
    }
  },

  // 🔹 Update image metadata - FIXED WITH CACHE BUSTING
  updateImage: async (id, updateData) => {
    const { saving, imagePreview } = get();

    // Prevent double submission
    if (saving) {
      toast.error("Please wait, save in progress...", { icon: "⏳" });
      return;
    }

    // Validation
    if (!updateData.title.trim()) {
      toast.error("Image title is required", { icon: "⚠️" });
      return;
    }
    if (!updateData.alt.trim()) {
      toast.error("Alt text is required for accessibility", { icon: "⚠️" });
      return;
    }
    if (!updateData.category.trim()) {
      toast.error("Category is required", { icon: "⚠️" });
      return;
    }

    set({ saving: true });
    const saveToastId = `save-${Date.now()}`;
    toast.loading("Updating image...", { id: saveToastId });

    try {
      const submitData = {
        title: updateData.title,
        alt: updateData.alt,
        category: updateData.category,
        description: updateData.description,
        featured: updateData.featured,
        isActive: updateData.isActive,
        sortOrder: updateData.sortOrder,
        metaTitle: updateData.metaTitle,
        metaDescription: updateData.metaDescription,
        serviceId: updateData.serviceId && updateData.serviceId !== "none" ? updateData.serviceId : null,
      };

      const res = await axiosInstance.put(`/gallery/image/${id}`, submitData);

      // Clean up object URLs ONLY if they're blob URLs from file uploads
      if (imagePreview && imagePreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imagePreview);
        } catch (error) {
          // Silent fail
        }
      }

      // CACHE BUSTING: Add version parameter to updated image URLs
      const updatedImageWithCache = {
        ...res.data,
        src: get().addCacheBuster(res.data.src),
        thumb: res.data.thumb ? get().addCacheBuster(res.data.thumb) : res.data.thumb
      };

      set((state) => ({
        images: state.images.map((img) => (img.id === id ? updatedImageWithCache : img)),
        saving: false,
        dialogOpen: false,
        imagePreview: null,
        selectedFile: null,
      }));

      toast.success("Image updated successfully! ✨", { id: saveToastId });

      // Refresh categories in case new one was added
      get().fetchCategories();

      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update image";
      toast.error(`${errorMessage} ❌`, {
        id: saveToastId,
        duration: 6000,
      });
      set({ saving: false });
      throw err;
    }
  },

  // 🔹 Delete image
  deleteImage: async (id) => {
    set({ deleting: id });
    toast.loading("Deleting image...", { id: `delete-${id}` });

    try {
      await axiosInstance.delete(`/gallery/image/${id}`);
      
      set((state) => ({
        images: state.images.filter((img) => img.id !== id),
        deleting: null,
      }));
      
      toast.success("Image deleted successfully! 🗑️", {
        id: `delete-${id}`,
      });
    } catch (err) {
      toast.error("Failed to delete image ❌", {
        id: `delete-${id}`,
      });
      set({ deleting: null });
      throw err;
    }
  },

  // 🔹 Save Image (handles both add and update)
  saveImage: async () => {
    const { dialogMode, formData, selectedImage } = get();

    if (dialogMode === "add") {
      return get().addImage(formData);
    } else if (dialogMode === "edit" && selectedImage) {
      return get().updateImage(selectedImage.id, formData);
    }
  },

  // 🔹 Computed Values / Selectors
  getFilteredImages: () => {
    const { images, searchTerm, selectedCategory, selectedService } = get();

    const filtered = images.filter((image) => {
      const matchesSearch =
        image.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (image.description && image.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === "all" || image.category === selectedCategory;
      const matchesService =
        selectedService === "all" ||
        (selectedService === "unlinked" && !image.serviceId) ||
        (image.serviceId && image.serviceId.toString() === selectedService);

      return matchesSearch && matchesCategory && matchesService;
    });

    return filtered;
  },

  getStats: () => {
    const { images } = get();
    const stats = {
      totalImages: images.length,
      activeImages: images.filter((img) => img.isActive).length,
      featuredImages: images.filter((img) => img.featured).length,
    };
    return stats;
  },

  // 🔹 Utility Actions
  refreshData: async () => {
    await Promise.all([
      get().fetchImages(),
      get().fetchServices(),
      get().fetchCategories(),
    ]);
  },

  // 🔹 Reset Filters
  resetFilters: () => {
    set({
      searchTerm: "",
      selectedCategory: "all",
      selectedService: "all",
    });
  },

  // 🔹 Enhanced cleanup function for object URLs
  cleanup: () => {
    const { imagePreview } = get();
    if (imagePreview && imagePreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch (error) {
        // Silent fail
      }
    }
    
    set({ imagePreview: null, selectedFile: null });
  },
}));

export default useGalleryStore;
