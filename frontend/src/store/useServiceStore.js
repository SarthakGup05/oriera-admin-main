// src/store/useServiceStore.js
import { create } from "zustand"
import { devtools } from "zustand/middleware"
import axiosInstance from "@/lib/axiosinstaance"
import { toast } from "react-hot-toast"

const useServiceStore = create(
  devtools(
    (set, get) => ({
      // 🔹 API State
      services: [],
      loading: false,
      error: null,

      // 🔹 UI State
      dialogOpen: false,
      dialogMode: 'add', // 'add', 'edit', 'view'
      selectedService: null,
      
      // 🔹 Form State - Updated for single image
      formData: {
        name: '',
        slug: '',
        title: '',
        subtitle: '',
        description: '',
        serviceImage: '', // Single image field
        features: [''],
        duration: '',
        metaTitle: '',
        metaDescription: '',
        isActive: true,
        featured: false,
        sortOrder: 0,
      },

      // 🔹 Image State - Updated for single image
      imagePreview: {
        serviceImage: null,
      },
      selectedFiles: {
        serviceImage: null,
      },
      uploadingImages: {
        serviceImage: false,
      },

      // 🔹 UI Actions
      setDialogOpen: (open) => set({ dialogOpen: open }),
      
      setDialogMode: (mode) => set({ dialogMode: mode }),
      
      setSelectedService: (service) => set({ selectedService: service }),
      
      setFormData: (formData) => set({ formData }),
      
      updateFormData: (updates) => 
        set((state) => ({ 
          formData: { ...state.formData, ...updates } 
        })),
      
      setImagePreview: (previews) => 
        set((state) => ({ 
          imagePreview: { ...state.imagePreview, ...previews } 
        })),
      
      setSelectedFiles: (files) => 
        set((state) => ({ 
          selectedFiles: { ...state.selectedFiles, ...files } 
        })),
      
      setUploadingImages: (uploading) => 
        set((state) => ({ 
          uploadingImages: { ...state.uploadingImages, ...uploading } 
        })),

      // 🔹 Fetch all services
      fetchServices: async () => {
        set({ loading: true, error: null })
        try {
          const res = await axiosInstance.get("/services/get-services")
          set({ services: res.data, loading: false })
        } catch (err) {
          console.error("Error fetching services:", err)
          toast.error("Failed to load services")
          set({ error: err.response?.data?.message || "Failed to fetch", loading: false })
        }
      },

      // 🔹 Add new service
      addService: async (formData) => {
        set({ loading: true })
        try {
          const res = await axiosInstance.post("/services/create", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          set((state) => ({ 
            services: [...state.services, res.data],
            loading: false 
          }))
          toast.success("Service added successfully")
          get().resetForm()
          set({ dialogOpen: false })
          get().fetchServices()
          return res.data
        } catch (err) {
          console.error("Error adding service:", err)
          toast.error(err.response?.data?.error || "Failed to add service")
          set({ loading: false })
          throw err
        }
      },

      // 🔹 Update existing service
      updateService: async (id, formData) => {
        set({ loading: true })
        try {
          const res = await axiosInstance.put(`/services/update-service/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          set((state) => ({
            services: state.services.map((s) => (s.id === id ? res.data : s)),
            loading: false
          }))
          toast.success("Service updated successfully")
          get().resetForm()
          set({ dialogOpen: false })
          get().fetchServices()
          return res.data
        } catch (err) {
          console.error("Error updating service:", err)
          toast.error(err.response?.data?.error || "Failed to update service")
          set({ loading: false })
          throw err
        }
      },

      // 🔹 Delete service
      deleteService: async (id) => {
        try {
          await axiosInstance.delete(`/services/delete-service/${id}`)
          set((state) => ({
            services: state.services.filter((s) => s.id !== id),
          }))
          toast.success("Service deleted successfully")
        } catch (err) {
          console.error("Error deleting service:", err)
          toast.error("Failed to delete service")
          throw err
        }
      },

      // 🔹 Utility Functions
      generateSlug: (name) => {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      },

      handleNameChange: (name) => {
        const slug = get().generateSlug(name)
        get().updateFormData({ name, slug })
      },

      // 🔹 Reset form - Updated for single image
      resetForm: () => {
        const { imagePreview } = get()
        
        // Clean up object URLs
        Object.values(imagePreview).forEach(url => {
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url)
          }
        })

        set({
          formData: {
            name: '',
            slug: '',
            title: '',
            subtitle: '',
            description: '',
            serviceImage: '',
            features: [''],
            duration: '',
            metaTitle: '',
            metaDescription: '',
            isActive: true,
            featured: false,
            sortOrder: 0,
          },
          imagePreview: { serviceImage: null },
          selectedFiles: { serviceImage: null },
          selectedService: null,
        })
      },

      // 🔹 Dialog Actions - Updated for single image
      openAddDialog: () => {
        get().resetForm()
        set({ 
          dialogMode: 'add',
          dialogOpen: true 
        })
      },

      openViewDialog: (service) => {
        set({
          dialogMode: 'view',
          selectedService: service,
          formData: {
            ...service,
            serviceImage: service.coverImage || service.mainImage || service.serviceImage || '',
            features: service.features || [''],
          },
          imagePreview: {
            serviceImage: service.coverImage || service.mainImage || service.serviceImage || null,
          },
          selectedFiles: { serviceImage: null },
          dialogOpen: true,
        })
      },

      openEditDialog: (service) => {
        set({
          dialogMode: 'edit',
          selectedService: service,
          formData: {
            ...service,
            serviceImage: service.coverImage || service.mainImage || service.serviceImage || '',
            features: service.features || [''],
          },
          imagePreview: {
            serviceImage: service.coverImage || service.mainImage || service.serviceImage || null,
          },
          selectedFiles: { serviceImage: null },
          dialogOpen: true,
        })
      },

      // 🔹 Features Management
      addFeature: () => {
        set((state) => ({
          formData: {
            ...state.formData,
            features: [...state.formData.features, ''],
          },
        }))
      },

      removeFeature: (index) => {
        set((state) => ({
          formData: {
            ...state.formData,
            features: state.formData.features.filter((_, i) => i !== index),
          },
        }))
      },

      updateFeature: (index, value) => {
        set((state) => ({
          formData: {
            ...state.formData,
            features: state.formData.features.map((item, i) => 
              i === index ? value : item
            ),
          },
        }))
      },

      // 🔹 Image Handling - Updated for single image
      handleImageUpload: async (file, imageType) => {
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file')
          return
        }

        // Validate file size (10MB max for Cloudinary)
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Image size must be less than 10MB')
          return
        }

        try {
          get().setUploadingImages({ [imageType]: true })

          const { imagePreview } = get()
          
          // Clean up previous object URL
          if (imagePreview[imageType] && imagePreview[imageType].startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview[imageType])
          }

          // Create preview object URL
          const previewUrl = URL.createObjectURL(file)
          get().setImagePreview({ [imageType]: previewUrl })
          get().setSelectedFiles({ [imageType]: file })

          toast.success('Service image selected successfully')
        } catch (error) {
          console.error('Error processing image:', error)
          toast.error('Failed to process image')

          // Clean up preview on error
          get().setImagePreview({ [imageType]: null })
          get().setSelectedFiles({ [imageType]: null })
        } finally {
          get().setUploadingImages({ [imageType]: false })
        }
      },

      removeImage: (imageType) => {
        const { imagePreview } = get()
        
        // Clean up object URL
        if (imagePreview[imageType] && imagePreview[imageType].startsWith('blob:')) {
          URL.revokeObjectURL(imagePreview[imageType])
        }

        get().updateFormData({ [imageType]: '' })
        get().setImagePreview({ [imageType]: null })
        get().setSelectedFiles({ [imageType]: null })
      },

      // 🔹 Save Handler - FIXED: Only send serviceImage field
      handleSave: async () => {
        const { formData, selectedFiles, dialogMode, selectedService } = get()

        if (!formData.name.trim()) {
          toast.error('Service name is required')
          return
        }
        if (!formData.title.trim()) {
          toast.error('Service title is required')
          return
        }
        if (!formData.subtitle.trim()) {
          toast.error('Service subtitle is required')
          return
        }
        if (!formData.description.trim()) {
          toast.error('Service description is required')
          return
        }

        // Create FormData for Cloudinary file uploads
        const submitFormData = new FormData()

        // Add text fields
        submitFormData.append('name', formData.name)
        submitFormData.append('slug', formData.slug)
        submitFormData.append('title', formData.title)
        submitFormData.append('subtitle', formData.subtitle)
        submitFormData.append('description', formData.description)
        submitFormData.append('duration', formData.duration || '')
        submitFormData.append('metaTitle', formData.metaTitle || '')
        submitFormData.append('metaDescription', formData.metaDescription || '')
        submitFormData.append('isActive', formData.isActive.toString())
        submitFormData.append('featured', formData.featured.toString())
        submitFormData.append('sortOrder', formData.sortOrder.toString())

        // Add features array as JSON
        const cleanedFeatures = formData.features.filter((f) => f.trim() !== '')
        submitFormData.append('features', JSON.stringify(cleanedFeatures))

        // 🔹 CRITICAL FIX: Only send serviceImage field (not coverImage/mainImage)
        if (selectedFiles.serviceImage) {
          submitFormData.append('serviceImage', selectedFiles.serviceImage)
        }

        // Debug: Log what we're sending
        console.log('FormData contents:')
        for (let pair of submitFormData.entries()) {
          console.log(pair[0] + ':', pair[1])
        }

        try {
          if (dialogMode === 'add') {
            await get().addService(submitFormData)
          } else if (dialogMode === 'edit') {
            await get().updateService(selectedService.id, submitFormData)
          }
        } catch (error) {
          console.error('Save error:', error)
        }
      },

      // 🔹 Computed Values
      getStats: () => {
        const { services } = get()
        return {
          totalServices: services.length,
          activeServices: services.filter((s) => s.isActive).length,
          featuredServices: services.filter((s) => s.featured).length,
        }
      },
    }),
    {
      name: 'service-store',
    }
  )
)

export default useServiceStore
