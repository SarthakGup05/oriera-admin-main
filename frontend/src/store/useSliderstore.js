// src/store/useSliderStore.js
import { create } from "zustand"
import axiosInstance from "@/lib/axiosinstaance"
import { toast } from "react-hot-toast"

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const useSliderStore = create((set, get) => ({
  // 🔹 State
  items: [],
  loading: false,
  saving: false,
  deleting: {},
  error: null,

  // 🔹 Dialog Management
  dialogOpen: false,
  mode: 'add', // 'add' | 'edit' | 'view'
  selected: null,

  // 🔹 Form Data
  form: {
    title: '',
    subtitle: '',
    description: '',
    type: 'IMAGE', // 'IMAGE' | 'VIDEO'
    order: 0,
    isActive: true,
  },

  // 🔹 File Management
  mediaPreview: null,
  mediaFile: null,
  posterPreview: null,
  posterFile: null,

  // 🔹 Actions - Dialog Management
  setDialogOpen: (open) => set({ dialogOpen: open }),
  setMode: (mode) => set({ mode }),
  setSelected: (item) => set({ selected: item }),

  // 🔹 Form Actions
  updateForm: (field, value) => set((state) => ({
    form: { ...state.form, [field]: value }
  })),

  setForm: (formData) => set({ form: formData }),

  resetForm: () => set({
    form: {
      title: '',
      subtitle: '',
      description: '',
      type: 'IMAGE',
      order: 0,
      isActive: true,
    }
  }),

  // 🔹 File Actions
  setMediaPreview: (preview) => set({ mediaPreview: preview }),
  setMediaFile: (file) => set({ mediaFile: file }),
  setPosterPreview: (preview) => set({ posterPreview: preview }),
  setPosterFile: (file) => set({ posterFile: file }),

  resetFiles: () => {
    const { mediaPreview, posterPreview } = get()
    if (mediaPreview?.startsWith("blob:")) URL.revokeObjectURL(mediaPreview)
    if (posterPreview?.startsWith("blob:")) URL.revokeObjectURL(posterPreview)
    
    set({
      mediaPreview: null,
      mediaFile: null,
      posterPreview: null,
      posterFile: null,
    })
  },

  resetDialog: () => {
    get().resetForm()
    get().resetFiles()
  },

  // 🔹 API Actions - Fetch sliders
  fetchSliders: async () => {
    try {
      set({ loading: true, error: null })
      const { data } = await axiosInstance.get("/slider/get-sliders")

      // Handle different response structures
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.slides)
        ? data.slides
        : Array.isArray(data.slider)
        ? data.slider
        : Array.isArray(data.items)
        ? data.items
        : []

      set({ items: list, loading: false })
    } catch (error) {
      console.error("Failed to load sliders", error)
      toast.error("Failed to load sliders")
      set({ 
        error: error.response?.data?.message || "Failed to fetch sliders", 
        loading: false 
      })
    }
  },

  // 🔹 Dialog Helpers
  openAdd: () => {
    get().resetDialog()
    set({ 
      mode: 'add',
      selected: null,
      dialogOpen: true 
    })
  },

  openView: (item) => {
    get().fillDialog(item, 'view')
  },

  openEdit: (item) => {
    get().fillDialog(item, 'edit')
  },

  fillDialog: (item, mode) => {
    get().resetDialog()
    set({
      mode,
      selected: item,
      form: {
        title: item.title || '',
        subtitle: item.subtitle || '',
        description: item.description || '',
        type: item.type || 'IMAGE',
        order: item.order || 0,
        isActive: item.isActive !== false,
      },
      mediaPreview: item.type === "IMAGE" ? item.mediaUrl : item.posterUrl,
      dialogOpen: true
    })

    if (item.type === "VIDEO") {
      set({ posterPreview: item.posterUrl || null })
    }
  },

  closeDialog: () => {
    get().resetFiles()
    set({ dialogOpen: false })
  },
handleMedia: (file) => {
  if (!file || !file.type) {
    toast.error("Invalid file selected")
    return
  }

  const { form } = get()
  const isImage = form.type === "IMAGE"

  if (!(isImage ? file.type.startsWith("image/") : file.type.startsWith("video/"))) {
    toast.error(isImage ? "Select an image" : "Select a video")
    return
  }

  if (file.size > MAX_SIZE) {
    toast.error("File size must be < 10 MB")
    return
  }

  const { mediaPreview } = get()
  if (mediaPreview?.startsWith("blob:")) {
    URL.revokeObjectURL(mediaPreview)
  }

  set({
    mediaPreview: URL.createObjectURL(file),
    mediaFile: file
  })

  toast.success(`${isImage ? "Image" : "Video"} selected successfully`)
},

  handleTypeChange: (newType) => {
    const { mode } = get()
    if (mode === 'view') return
    
    set((state) => ({ form: { ...state.form, type: newType } }))
    get().resetFiles()
  },

  // 🔹 Save Slider
  saveSlider: async () => {
    const { 
      form, 
      mode, 
      selected, 
      mediaFile, 
      posterFile, 
      saving 
    } = get()

    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    
    if (mode === "add" && !mediaFile) {
      toast.error("Select media file")
      return
    }

    if (saving) {
      toast.error("Save operation already in progress...")
      return
    }

    try {
      set({ saving: true })
      const saveToastId = `save-${Date.now()}`
      toast.loading(mode === "add" ? "Adding slide..." : "Updating slide...", { 
        id: saveToastId 
      })

      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value.toString())
      })

      if (mediaFile) formData.append("media", mediaFile)
      if (posterFile) formData.append("poster", posterFile)

      const request = mode === "add"
        ? axiosInstance.post("/slider/create-slider", formData)
        : axiosInstance.put(`/slider/update-slider/${selected.id}`, formData)

      await request
      
      // Refresh data after successful save
      await get().fetchSliders()
      
      toast.success(mode === "add" ? "Slide added successfully! 🎉" : "Slide updated successfully! ✨", { 
        id: saveToastId 
      })
      
      set({ 
        dialogOpen: false,
        saving: false
      })
      
      get().resetFiles()
      
    } catch (error) {
      console.error("Save error:", error)
      const errorMessage = error.response?.data?.message || "Save failed"
      toast.error(`${errorMessage} ❌`, { 
        duration: 6000 
      })
      set({ saving: false })
    }
  },

  // 🔹 Delete Slider
  deleteSlider: async (id) => {
    try {
      set((state) => ({ 
        deleting: { ...state.deleting, [id]: true } 
      }))
      
      const deleteToastId = `delete-${id}`
      toast.loading("Deleting slide...", { id: deleteToastId })
      
      await axiosInstance.delete(`/slider/delete-slider/${id}`)
      
      // Refresh data after successful delete
      await get().fetchSliders()
      
      toast.success("Slide deleted successfully! 🗑️", { 
        id: deleteToastId 
      })
      
    } catch (error) {
      console.error("Delete error:", error)
      const errorMessage = error.response?.data?.message || "Delete failed"
      toast.error(`${errorMessage} ❌`)
      
    } finally {
      set((state) => ({ 
        deleting: { ...state.deleting, [id]: false } 
      }))
    }
  },

  // 🔹 Computed Values
  getStats: () => {
    const { items } = get()
    return {
      total: items.length,
      active: items.filter(item => item.isActive).length,
      inactive: items.filter(item => !item.isActive).length,
      images: items.filter(item => item.type === 'IMAGE').length,
      videos: items.filter(item => item.type === 'VIDEO').length
    }
  },

  getSortedItems: () => {
    const { items } = get()
    return [...items].sort((a, b) => (a.order || 0) - (b.order || 0))
  },

  // 🔹 Utility Actions
  refreshData: async () => {
    await get().fetchSliders()
  },

  // 🔹 Cleanup function for object URLs
  cleanup: () => {
    const { mediaPreview, posterPreview } = get()
    if (mediaPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreview)
    }
    if (posterPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(posterPreview)
    }
  }
}))

export default useSliderStore
