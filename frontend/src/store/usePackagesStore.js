// src/store/usePackagesStore.js
import { create } from "zustand"
import axiosInstance from "@/lib/axiosinstaance"
import { toast } from "react-hot-toast"

const usePackagesStore = create((set, get) => ({
  // 🔹 State
  packages: [],
  services: [],
  loading: false,
  saving: false,
  error: null,

  // 🔹 Dialog Management
  dialogOpen: false,
  dialogLoading: false,
  dialogMode: 'add', // 'add' | 'edit' | 'view'
  selectedPackage: null,

  // 🔹 Form Data
  formData: {
    title: '',
    price: '',
    description: '',
    inclusions: [''],
    serviceId: '',
  },

  // 🔹 Actions - Dialog Management
  setDialogOpen: (open) => set({ dialogOpen: open }),
  setDialogMode: (mode) => set({ dialogMode: mode }),
  setSelectedPackage: (pkg) => set({ selectedPackage: pkg }),
  setDialogLoading: (loading) => set({ dialogLoading: loading }),

  // 🔹 Form Actions
  setFormData: (data) => set({ formData: data }),
  updateFormField: (field, value) => set((state) => ({
    formData: { ...state.formData, [field]: value }
  })),

  resetFormData: () => set({
    formData: {
      title: '',
      price: '',
      description: '',
      inclusions: [''],
      serviceId: '',
    }
  }),

  // 🔹 Inclusion Management
  updateInclusion: (index, value) => set((state) => {
    const newInclusions = [...state.formData.inclusions]
    newInclusions[index] = value
    return {
      formData: {
        ...state.formData,
        inclusions: newInclusions
      }
    }
  }),

  addInclusion: () => set((state) => ({
    formData: {
      ...state.formData,
      inclusions: [...state.formData.inclusions, '']
    }
  })),

  removeInclusion: (index) => set((state) => ({
    formData: {
      ...state.formData,
      inclusions: state.formData.inclusions.filter((_, i) => i !== index)
    }
  })),

  // 🔹 Helper Functions
  extractPriceNumber: (priceString) => {
    if (typeof priceString === "number") return priceString
    return parseInt(priceString.replace(/[₹,]/g, "")) || 0
  },

  formatPrice: (price) => {
    const { extractPriceNumber } = get()
    const numPrice = typeof price === "string" ? extractPriceNumber(price) : price
    return `₹${numPrice.toLocaleString("en-IN")}`
  },

  getServiceName: (serviceId) => {
    const { services } = get()
    const service = services.find((s) => s.id === serviceId)
    return service ? service.name : "Unknown Service"
  },

  // 🔹 API Actions - Fetch packages
  fetchPackages: async () => {
    try {
      set({ loading: true, error: null })
      const response = await axiosInstance.get("/packages/get-packages")
      set({ packages: response.data, loading: false })
    } catch (error) {
      console.error("Error fetching packages:", error)
      toast.error(error.response?.data?.message || "Failed to load packages")
      set({ 
        error: error.response?.data?.message || "Failed to fetch packages", 
        loading: false 
      })
    }
  },

  // 🔹 Fetch services
  fetchServices: async () => {
    try {
      const response = await axiosInstance.get("/services/get-services")
      set({ services: response.data })
    } catch (error) {
      console.error("Error fetching services:", error)
      toast.error(error.response?.data?.message || "Failed to load services")
    }
  },

  // 🔹 Dialog Helpers
  openAddDialog: () => {
    set({
      dialogMode: 'add',
      selectedPackage: null,
      formData: {
        title: '',
        price: '',
        description: '',
        inclusions: [''],
        serviceId: '',
      },
      dialogOpen: true
    })
  },

  openViewDialog: (packageData) => {
    const { extractPriceNumber } = get()
    set({
      dialogMode: 'view',
      selectedPackage: packageData,
      formData: {
        ...packageData,
        price: extractPriceNumber(packageData.price).toString(),
      },
      dialogOpen: true
    })
  },

  openEditDialog: (packageData) => {
    const { extractPriceNumber } = get()
    set({
      dialogMode: 'edit',
      selectedPackage: packageData,
      formData: {
        ...packageData,
        price: extractPriceNumber(packageData.price).toString(),
      },
      dialogOpen: true
    })
  },

  closeDialog: () => {
    set({ dialogOpen: false })
  },

  // 🔹 Create Package
  createPackage: async (packageData) => {
    try {
      set({ saving: true })
      const saveToastId = `save-${Date.now()}`
      toast.loading("Creating package...", { id: saveToastId })

      const response = await axiosInstance.post("/packages/packages/create", packageData)
      
      set((state) => ({ 
        packages: [...state.packages, response.data],
        saving: false,
        dialogOpen: false
      }))

      toast.success("Package created successfully! 🎉", { id: saveToastId })
      return response.data
    } catch (error) {
      console.error("Error creating package:", error)
      const errorMessage = error.response?.data?.message || "Failed to create package"
      toast.error(`${errorMessage} ❌`)
      set({ saving: false })
      throw error
    }
  },

  // 🔹 Update Package
  updatePackage: async (id, packageData) => {
    try {
      set({ saving: true })
      const saveToastId = `save-${Date.now()}`
      toast.loading("Updating package...", { id: saveToastId })

      const response = await axiosInstance.put(`/packages/packages-update/${id}`, packageData)
      
      set((state) => ({
        packages: state.packages.map((p) => (p.id === id ? response.data : p)),
        saving: false,
        dialogOpen: false
      }))

      toast.success("Package updated successfully! ✨", { id: saveToastId })
      return response.data
    } catch (error) {
      console.error("Error updating package:", error)
      const errorMessage = error.response?.data?.message || "Failed to update package"
      toast.error(`${errorMessage} ❌`)
      set({ saving: false })
      throw error
    }
  },

  // 🔹 Delete Package
  deletePackage: async (id) => {
    try {
      const deleteToastId = `delete-${id}`
      toast.loading("Deleting package...", { id: deleteToastId })

      await axiosInstance.delete(`/packages/packages-delete/${id}`)
      
      set((state) => ({
        packages: state.packages.filter((p) => p.id !== id)
      }))

      toast.success("Package deleted successfully! 🗑️", { id: deleteToastId })
    } catch (error) {
      console.error("Error deleting package:", error)
      const errorMessage = error.response?.data?.message || "Failed to delete package"
      toast.error(`${errorMessage} ❌`)
      throw error
    }
  },

  // 🔹 Save Package (handles both create and update)
  savePackage: async () => {
    const { 
      formData, 
      dialogMode, 
      selectedPackage, 
      saving,
      formatPrice 
    } = get()

    if (saving) {
      toast.error("Save operation already in progress...", { icon: '⏳' })
      return
    }

    // Validation
    if (!formData.title || !formData.price || !formData.description || !formData.serviceId) {
      toast.error("Please fill in all required fields", { icon: '⚠️' })
      return
    }

    // Filter out empty inclusions
    const validInclusions = formData.inclusions.filter((inc) => inc.trim() !== "")
    if (validInclusions.length === 0) {
      toast.error("Please add at least one inclusion", { icon: '⚠️' })
      return
    }

    try {
      const packageData = {
        title: formData.title,
        price: formatPrice(formData.price),
        description: formData.description,
        inclusions: validInclusions,
        serviceId: parseInt(formData.serviceId),
      }

      if (dialogMode === "add") {
        await get().createPackage(packageData)
      } else if (dialogMode === "edit") {
        await get().updatePackage(selectedPackage.id, packageData)
      }
    } catch (error) {
      // Error handling is done in individual create/update methods
    }
  },

  // 🔹 Computed Values
  getStats: () => {
    const { packages, extractPriceNumber } = get()
    
    const totalPackages = packages.length
    const averagePrice = packages.length > 0
      ? Math.round(
          packages.reduce((acc, p) => acc + extractPriceNumber(p.price), 0) / packages.length
        )
      : 0

    return {
      totalPackages,
      activePackages: totalPackages, // Assuming all packages are active
      averagePrice,
      priceRange: packages.length > 0 ? {
        min: Math.min(...packages.map(p => extractPriceNumber(p.price))),
        max: Math.max(...packages.map(p => extractPriceNumber(p.price)))
      } : { min: 0, max: 0 }
    }
  },

  getSortedPackages: () => {
    const { packages } = get()
    return [...packages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  getPackagesByService: (serviceId) => {
    const { packages } = get()
    return packages.filter(pkg => pkg.serviceId === serviceId)
  },

  // 🔹 Utility Actions
  refreshData: async () => {
    await Promise.all([
      get().fetchPackages(),
      get().fetchServices()
    ])
  },

  // 🔹 Initialize store
  initialize: async () => {
    await get().refreshData()
  }
}))

export default usePackagesStore
