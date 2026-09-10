// src/store/useEnquiryStore.js
import { create } from "zustand"
import axiosInstance from "@/lib/axiosinstaance"
import { toast } from "react-hot-toast"

const useEnquiryStore = create((set, get) => ({
  // 🔹 State
  enquiries: [],
  services: [],
  serviceMap: {},
  loading: false,
  loadingServices: false,
  saving: false,
  deleting: null,
  refreshing: false,
  error: null,

  // 🔹 Dialog Management
  dialogOpen: false,
  dialogMode: 'view', // 'view' | 'edit'
  selectedEnquiry: null,

  // 🔹 Form Data
  formData: {
    name: '',
    email: '',
    phone: '',
    serviceType: '',
    message: '',
    status: 'NEW',
    notes: '',
  },

  // 🔹 Status Configuration
  statusConfig: {
    NEW: {
      label: "New",
      variant: "default",
      color: "text-blue-600",
    },
    PENDING: {
      label: "Pending",
      variant: "secondary",
      color: "text-yellow-600",
    },
    CONVERTED: {
      label: "Converted",
      variant: "default",
      color: "text-green-600",
      className: "bg-green-100 text-green-800",
    },
    REJECTED: {
      label: "Rejected",
      variant: "destructive",
      color: "text-red-600",
    },
  },

  // 🔹 Actions - Dialog Management
  setDialogOpen: (open) => set({ dialogOpen: open }),
  setDialogMode: (mode) => set({ dialogMode: mode }),
  setSelectedEnquiry: (enquiry) => set({ selectedEnquiry: enquiry }),

  // 🔹 Form Actions
  setFormData: (data) => set({ formData: data }),
  updateFormField: (field, value) => set((state) => ({
    formData: { ...state.formData, [field]: value }
  })),

  resetFormData: () => set({
    formData: {
      name: '',
      email: '',
      phone: '',
      serviceType: '',
      message: '',
      status: 'NEW',
      notes: '',
    }
  }),

  // 🔹 Helper Functions
  getServiceInfo: (serviceIdentifier) => {
    const { serviceMap, services } = get()
    if (!serviceIdentifier) return null

    // Try to find service by ID, slug, or generated key
    const service =
      serviceMap[serviceIdentifier] ||
      serviceMap[serviceIdentifier.toLowerCase()] ||
      services.find(
        (s) =>
          s.title.toLowerCase().replace(/\s+/g, "-") === serviceIdentifier ||
          s.slug === serviceIdentifier ||
          s.id.toString() === serviceIdentifier.toString()
      )

    return service
  },

  // 🔹 API Actions - Fetch enquiries
  fetchEnquiries: async () => {
    try {
      set({ loading: true, error: null })
      const response = await axiosInstance.get("/enquiries/get-all-enquiries", {
        params: {
          sortBy: "submittedAt",
          sortOrder: "desc",
        },
      })

      const enquiries = response.data.enquiries || response.data
      set({ enquiries, loading: false })

      // Only show success toast on manual refresh
      const { refreshing } = get()
      if (refreshing) {
        toast.success("Enquiries refreshed successfully")
      }
    } catch (error) {
      console.error("Error fetching enquiries:", error)
      toast.error("Failed to load enquiries")
      set({ 
        error: error.response?.data?.message || "Failed to fetch enquiries", 
        loading: false 
      })
    } finally {
      set({ refreshing: false })
    }
  },

  // 🔹 Fetch services
  fetchServices: async () => {
    try {
      set({ loadingServices: true })
      const response = await axiosInstance.get("/services/get-services")
      const servicesData = response.data
      
      // Create a map for quick lookup
      const serviceMap = {}
      servicesData.forEach((service) => {
        serviceMap[service.id] = service
        serviceMap[service.slug] = service
        serviceMap[service.title.toLowerCase().replace(/\s+/g, "-")] = service
      })

      set({ 
        services: servicesData, 
        serviceMap, 
        loadingServices: false 
      })
    } catch (error) {
      console.error("Error fetching services:", error)
      toast.error("Failed to load services")
      set({ loadingServices: false })
    }
  },

  // 🔹 Update enquiry status
  updateEnquiryStatus: async (id, updateData) => {
    const { saving } = get()
    
    if (saving) {
      toast.error("Please wait, save in progress...", { icon: "⏳" })
      return
    }

    try {
      set({ saving: true })
      toast.loading("Updating enquiry...", { id: `update-${id}` })

      const response = await axiosInstance.put(
        `/enquiries/update-enquiry/${id}/status`,
        updateData
      )

      // Update local state
      set((state) => ({
        enquiries: state.enquiries.map((enquiry) =>
          enquiry.id === id ? { ...enquiry, ...response.data } : enquiry
        ),
        saving: false
      }))

      toast.success("Enquiry updated successfully", {
        id: `update-${id}`,
        icon: "✅",
      })

      return response.data
    } catch (error) {
      console.error("Error updating enquiry:", error)
      const errorMessage =
        error.response?.data?.message || "Failed to update enquiry"
      toast.error(errorMessage, {
        id: `update-${id}`,
        icon: "❌",
      })
      set({ saving: false })
      throw error
    }
  },

  // 🔹 Delete enquiry
  deleteEnquiry: async (id) => {
    try {
      set({ deleting: id })
      toast.loading("Deleting enquiry...", { id: `delete-${id}` })

      await axiosInstance.delete(`/enquiries/delete-enquiry/${id}`)

      // Update local state
      set((state) => ({
        enquiries: state.enquiries.filter((enquiry) => enquiry.id !== id),
        deleting: null
      }))

      toast.success("Enquiry deleted successfully", {
        id: `delete-${id}`,
        icon: "🗑️",
      })
    } catch (error) {
      console.error("Error deleting enquiry:", error)
      const errorMessage =
        error.response?.data?.message || "Failed to delete enquiry"
      toast.error(errorMessage, {
        id: `delete-${id}`,
        icon: "❌",
      })
      set({ deleting: null })
    }
  },

  // 🔹 Mark as read
  markAsRead: async (id) => {
    try {
      await axiosInstance.patch(`/enquiries/${id}/mark-read`)

      // Update local state
      set((state) => ({
        enquiries: state.enquiries.map((enquiry) =>
          enquiry.id === id ? { ...enquiry, isRead: true } : enquiry
        )
      }))
    } catch (error) {
      console.error("Error marking enquiry as read:", error)
    }
  },

  // 🔹 Dialog Actions
  openViewDialog: async (enquiry) => {
    set({
      dialogMode: 'view',
      selectedEnquiry: enquiry,
      formData: enquiry,
      dialogOpen: true
    })

    // Mark as read if not already read
    if (!enquiry.isRead) {
      await get().markAsRead(enquiry.id)
    }
  },

  openEditDialog: async (enquiry) => {
    set({
      dialogMode: 'edit',
      selectedEnquiry: enquiry,
      formData: enquiry,
      dialogOpen: true
    })

    // Mark as read if not already read
    if (!enquiry.isRead) {
      await get().markAsRead(enquiry.id)
    }
  },

  closeDialog: () => {
    set({ dialogOpen: false })
  },

  // 🔹 Save enquiry (for edit mode)
  saveEnquiry: async () => {
    const { formData, selectedEnquiry, dialogMode } = get()
    
    if (dialogMode === "edit" && selectedEnquiry) {
      // Only send the fields that can be updated
      const updateData = {
        status: formData.status,
        notes: formData.notes,
      }

      try {
        await get().updateEnquiryStatus(selectedEnquiry.id, updateData)
        set({ dialogOpen: false })
      } catch (error) {
        // Error is already handled in updateEnquiryStatus
        console.error("Save failed:", error)
      }
    }
  },

  // 🔹 Refresh data
  refreshData: async () => {
    set({ refreshing: true })
    await Promise.all([
      get().fetchEnquiries(),
      get().fetchServices()
    ])
  },

  // 🔹 Computed Values
  getStats: () => {
    const { enquiries } = get()
    
    const totalEnquiries = enquiries.length
    const newEnquiries = enquiries.filter((e) => e.status === "NEW").length
    const convertedEnquiries = enquiries.filter(
      (e) => e.status === "CONVERTED"
    ).length
    const pendingEnquiries = enquiries.filter((e) => e.status === "PENDING").length
    const rejectedEnquiries = enquiries.filter((e) => e.status === "REJECTED").length
    
    const conversionRate = totalEnquiries > 0
      ? ((convertedEnquiries / totalEnquiries) * 100).toFixed(1)
      : 0

    return {
      totalEnquiries,
      newEnquiries,
      convertedEnquiries,
      pendingEnquiries,
      rejectedEnquiries,
      conversionRate: parseFloat(conversionRate)
    }
  },

  getStatusCounts: () => {
    const { enquiries, statusConfig } = get()
    const counts = {}
    
    Object.keys(statusConfig).forEach(status => {
      counts[status] = enquiries.filter((e) => e.status === status).length
    })
    
    return counts
  },

  getFilteredEnquiries: (filters = {}) => {
    const { enquiries } = get()
    let filtered = [...enquiries]

    if (filters.status) {
      filtered = filtered.filter(e => e.status === filters.status)
    }

    if (filters.isRead !== undefined) {
      filtered = filtered.filter(e => e.isRead === filters.isRead)
    }

    if (filters.serviceType) {
      filtered = filtered.filter(e => 
        e.serviceType?.toLowerCase().includes(filters.serviceType.toLowerCase())
      )
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(e => 
        e.name?.toLowerCase().includes(term) ||
        e.email?.toLowerCase().includes(term) ||
        e.phone?.toLowerCase().includes(term) ||
        e.message?.toLowerCase().includes(term)
      )
    }

    return filtered
  },

  // 🔹 Initialize store
  initialize: async () => {
    await Promise.all([
      get().fetchEnquiries(),
      get().fetchServices()
    ])
  }
}))

export default useEnquiryStore
