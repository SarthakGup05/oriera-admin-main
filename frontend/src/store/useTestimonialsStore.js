// src/store/useTestimonialsStore.js
import { create } from "zustand"
import axiosInstance from "@/lib/axiosinstaance"
import { toast } from "react-hot-toast"

const useTestimonialsStore = create((set, get) => ({
  // 🔹 State
  testimonials: [],
  loading: false,
  error: null,
  
  // 🔹 Modal Management
  isViewModalOpen: false,
  selectedTestimonial: null,
  
  // 🔹 Toggle Loading States
  toggleLoading: {},
  
  // 🔹 Pagination State
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },

  // 🔹 Actions - Modal Management
  setViewModalOpen: (open) => set({ isViewModalOpen: open }),
  setSelectedTestimonial: (testimonial) => set({ selectedTestimonial: testimonial }),

  // 🔹 Pagination Actions
  setPagination: (pagination) => set({ pagination }),
  updatePagination: (updates) => set((state) => ({
    pagination: { ...state.pagination, ...updates }
  })),

  // 🔹 Toggle Loading Actions
  setToggleLoading: (id, loading) => set((state) => ({
    toggleLoading: { ...state.toggleLoading, [id]: loading }
  })),

  clearToggleLoading: (id) => set((state) => {
    const newLoading = { ...state.toggleLoading }
    delete newLoading[id]
    return { toggleLoading: newLoading }
  }),

  // 🔹 Utility Functions
  truncateText: (text, maxLength = 60) => {
    if (!text) return 'No text content'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  },

  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  },

  // 🔹 API Actions - Fetch testimonials
  fetchTestimonials: async (page = 1, limit = 10) => {
    try {
      set({ loading: true, error: null })
      
      const response = await axiosInstance.get('/testimonials/get-testimonials', {
        params: {
          page,
          limit,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          type: 'text'
        }
      })

      let testimonialsList = []
      let paginationData = {
        page,
        limit,
        total: 0,
        pages: 1
      }

      if (response.data.testimonials) {
        const textTestimonials = response.data.testimonials.filter(
          testimonial => testimonial.type === 'text' || !testimonial.type
        )
        testimonialsList = textTestimonials
        paginationData = response.data.pagination || {
          page,
          limit,
          total: textTestimonials.length,
          pages: Math.ceil(textTestimonials.length / limit)
        }
      } else {
        const filteredData = (response.data || []).filter(
          testimonial => testimonial.type === 'text' || !testimonial.type
        )
        testimonialsList = filteredData
        paginationData.total = filteredData.length
        paginationData.pages = Math.ceil(filteredData.length / limit)
      }

      set({ 
        testimonials: testimonialsList,
        pagination: paginationData,
        loading: false 
      })

    } catch (error) {
      console.error('Error fetching testimonials:', error)
      toast.error('Failed to load testimonials')
      set({ 
        testimonials: [],
        error: error.response?.data?.message || 'Failed to fetch testimonials',
        loading: false 
      })
    }
  },

  // 🔹 Toggle testimonial status
  toggleTestimonialStatus: async (testimonialId, currentStatus) => {
    try {
      // Set loading state for this specific toggle
      get().setToggleLoading(testimonialId, true)
      
      const newStatus = !currentStatus
      
      // API call to update status
      await axiosInstance.put(`/testimonials/update-testimonial/${testimonialId}`, {
        isActive: newStatus
      })

      // Update the testimonial in the local state
      set((state) => ({
        testimonials: state.testimonials.map(testimonial => 
          testimonial.id === testimonialId 
            ? { ...testimonial, isActive: newStatus }
            : testimonial
        )
      }))

      // Update selected testimonial if it's the one being toggled
      const { selectedTestimonial } = get()
      if (selectedTestimonial && selectedTestimonial.id === testimonialId) {
        set({ selectedTestimonial: { ...selectedTestimonial, isActive: newStatus } })
      }

      toast.success(`Testimonial ${newStatus ? 'activated' : 'deactivated'} successfully`)
      
    } catch (error) {
      console.error('Error toggling testimonial status:', error)
      toast.error('Failed to update testimonial status')
    } finally {
      // Remove loading state for this toggle
      get().clearToggleLoading(testimonialId)
    }
  },

  // 🔹 Delete testimonial
  deleteTestimonial: async (id) => {
    try {
      const deleteToastId = `delete-${id}`
      toast.loading("Deleting testimonial...", { id: deleteToastId })

      await axiosInstance.delete(`/testimonials/delete-testimonial/${id}`)
      
      // Remove from local state
      set((state) => ({
        testimonials: state.testimonials.filter(t => t.id !== id)
      }))

      // Refresh testimonials to update pagination
      const { pagination } = get()
      await get().fetchTestimonials(pagination.page, pagination.limit)

      toast.success('Testimonial deleted successfully! 🗑️', { id: deleteToastId })
      
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      const errorMessage = error.response?.data?.message || 'Failed to delete testimonial'
      toast.error(`${errorMessage} ❌`)
    }
  },

  // 🔹 Modal Actions
  openViewModal: (testimonial) => {
    set({
      selectedTestimonial: testimonial,
      isViewModalOpen: true
    })
  },

  closeViewModal: () => {
    set({
      isViewModalOpen: false,
      selectedTestimonial: null
    })
  },

  // 🔹 Computed Values
  getStats: () => {
    const { testimonials } = get()
    
    const activeTestimonials = testimonials.filter(t => t.isActive).length
    const fiveStarReviews = testimonials.filter(t => t.rating === 5).length
    const longTestimonials = testimonials.filter(t => t.text && t.text.length > 200).length
    
    const averageRating = testimonials.length > 0
      ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)
      : 0

    return {
      totalTestimonials: testimonials.length,
      activeTestimonials,
      fiveStarReviews,
      longTestimonials,
      averageRating: parseFloat(averageRating),
      inactiveTestimonials: testimonials.length - activeTestimonials,
      ratingDistribution: {
        5: testimonials.filter(t => t.rating === 5).length,
        4: testimonials.filter(t => t.rating === 4).length,
        3: testimonials.filter(t => t.rating === 3).length,
        2: testimonials.filter(t => t.rating === 2).length,
        1: testimonials.filter(t => t.rating === 1).length,
      }
    }
  },

  getFilteredTestimonials: (filters = {}) => {
    const { testimonials } = get()
    let filtered = [...testimonials]

    if (filters.rating) {
      filtered = filtered.filter(t => t.rating >= filters.rating)
    }

    if (filters.isActive !== undefined) {
      filtered = filtered.filter(t => t.isActive === filters.isActive)
    }

    if (filters.service) {
      filtered = filtered.filter(t => 
        t.service?.toLowerCase().includes(filters.service.toLowerCase())
      )
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.name?.toLowerCase().includes(term) ||
        t.text?.toLowerCase().includes(term) ||
        t.location?.toLowerCase().includes(term)
      )
    }

    return filtered
  },

  getTestimonialsByRating: (rating) => {
    const { testimonials } = get()
    return testimonials.filter(t => t.rating === rating)
  },

  // 🔹 Utility Actions
  refreshTestimonials: async () => {
    const { pagination } = get()
    await get().fetchTestimonials(pagination.page, pagination.limit)
  },

  // 🔹 Bulk Actions (for future features)
  bulkToggleStatus: async (testimonialIds, newStatus) => {
    try {
      const updatePromises = testimonialIds.map(id => 
        axiosInstance.put(`/testimonials/update-testimonial/${id}`, {
          isActive: newStatus
        })
      )

      await Promise.all(updatePromises)

      // Update local state
      set((state) => ({
        testimonials: state.testimonials.map(testimonial => 
          testimonialIds.includes(testimonial.id)
            ? { ...testimonial, isActive: newStatus }
            : testimonial
        )
      }))

      toast.success(
        `${testimonialIds.length} testimonials ${newStatus ? 'activated' : 'deactivated'} successfully`
      )
    } catch (error) {
      console.error('Error in bulk toggle:', error)
      toast.error('Failed to update testimonials')
    }
  },

  // 🔹 Initialize store
  initialize: async () => {
    await get().fetchTestimonials()
  }
}))

export default useTestimonialsStore
