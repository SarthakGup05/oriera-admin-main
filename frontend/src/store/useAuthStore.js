// src/store/useAuthStore.js
import { create } from "zustand"
import { persist } from "zustand/middleware"
import axiosInstance from "@/lib/axiosinstaance"
import { toast } from "react-hot-toast"

const useAuthStore = create(
  persist(
    (set, get) => ({
      // 🔹 State
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      
      // 🔹 Enhanced Login
      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const res = await axiosInstance.post("/auth/login", { email, password })
          const { user, token } = res.data

          // Update axios default headers for future requests
          if (token) {
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
          }

          set({ 
            user, 
            token, 
            loading: false, 
            isAuthenticated: true,
            error: null 
          })
          
          toast.success(`Welcome back, ${user?.name || 'User'}!`)
          return { success: true, user, token }
        } catch (err) {
          const msg = err.response?.data?.message || "Login failed"
          set({ 
            error: msg, 
            loading: false, 
            isAuthenticated: false 
          })
          toast.error(msg)
          return { success: false, error: msg }
        }
      },

      // 🔹 Enhanced Logout
      logout: async () => {
        const { token } = get()
        
        try {
          // Call logout endpoint if we have a token
          if (token) {
            await axiosInstance.post("/auth/logout")
          }
        } catch (err) {
          console.error("Logout API call failed:", err)
          // Continue with logout even if API fails
        } finally {
          // Clear axios headers
          delete axiosInstance.defaults.headers.common['Authorization']
          
          // Reset store state
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            error: null 
          })
          
          toast.success("Logged out successfully")
          
          // Redirect to login (optional - handle in component)
          // window.location.href = "/login"
        }
      },

      // 🔹 Enhanced Profile Fetch
      fetchProfile: async () => {
        const { token } = get()
        
        if (!token) {
          set({ isAuthenticated: false })
          return { success: false, error: "No token found" }
        }

        set({ loading: true, error: null })
        
        try {
          // Set authorization header for this request
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const res = await axiosInstance.get("/auth/profile")
          const userData = res.data?.user || res.data
          
          set({ 
            user: userData, 
            loading: false, 
            isAuthenticated: true,
            error: null 
          })
          
          return { success: true, user: userData }
        } catch (err) {
          console.error("Failed to fetch profile:", err)
          
          // Handle authentication errors
          if (err.response?.status === 401 || err.response?.status === 403) {
            // Token is invalid, logout user
            set({ 
              user: null, 
              token: null, 
              isAuthenticated: false, 
              loading: false,
              error: "Session expired" 
            })
            
            delete axiosInstance.defaults.headers.common['Authorization']
            toast.error("Session expired. Please login again.")
            return { success: false, error: "Session expired", needsLogin: true }
          }
          
          const errorMsg = err.response?.data?.message || "Failed to fetch profile"
          set({ 
            error: errorMsg, 
            loading: false 
          })
          
          return { success: false, error: errorMsg }
        }
      },

      // 🔹 Initialize Authentication
      initializeAuth: async () => {
        const { token, fetchProfile } = get()
        
        if (token) {
          // Set axios header for subsequent requests
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Verify token is still valid
          const result = await fetchProfile()
          
          if (result.needsLogin) {
            // Token was invalid, store has been reset
            return false
          }
          
          return result.success
        }
        
        set({ isAuthenticated: false })
        return false
      },

      // 🔹 Update User Data
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }))
      },

      // 🔹 Check Authentication Status
      checkAuth: () => {
        const { token, user } = get()
        const isAuth = !!(token && user)
        set({ isAuthenticated: isAuth })
        return isAuth
      },

      // 🔹 Clear Error
      clearError: () => set({ error: null }),

      // 🔹 Set Loading State
      setLoading: (loading) => set({ loading }),

      // 🔹 Register (optional)
      register: async (userData) => {
        set({ loading: true, error: null })
        try {
          const res = await axiosInstance.post("/auth/register", userData)
          const { user, token } = res.data

          if (token) {
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
          }

          set({ 
            user, 
            token, 
            loading: false, 
            isAuthenticated: true,
            error: null 
          })
          
          toast.success(`Welcome, ${user?.name || 'User'}!`)
          return { success: true, user, token }
        } catch (err) {
          const msg = err.response?.data?.message || "Registration failed"
          set({ 
            error: msg, 
            loading: false, 
            isAuthenticated: false 
          })
          toast.error(msg)
          return { success: false, error: msg }
        }
      },

      // 🔹 Refresh Token (if your API supports it)
      refreshToken: async () => {
        try {
          const res = await axiosInstance.post("/auth/refresh")
          const { token } = res.data
          
          if (token) {
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
            set({ token })
            return { success: true, token }
          }
          
          return { success: false, error: "No token received" }
        } catch (err) {
          console.error("Token refresh failed:", err)
          // If refresh fails, logout user
          get().logout()
          return { success: false, error: "Token refresh failed" }
        }
      },
    }),
    {
      name: "auth-storage",
      // 🔹 Only persist essential data
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // 🔹 Custom merge function to handle state rehydration
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        loading: false, // Always start with loading false
        error: null, // Clear any previous errors
      }),
    }
  )
)

export default useAuthStore
