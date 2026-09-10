import axios from "axios"
import useAuthStore from "@/store/useAuthStore"

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:3000/api/v1";
  }
  return "https://oriera-admin-main-1.onrender.com/api/v1";
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
})

// ✅ Request interceptor → attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ✅ Response interceptor → handle 401/403
axiosInstance.interceptors.response.use(
  (response) => response, // if success, just return response
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // Handle Unauthorized
    if (status === 401 || status === 403) {
      const { logout } = useAuthStore.getState()

      // Optional: if backend supports refresh tokens, handle refresh here
      // Example:
      // if (!originalRequest._retry) {
      //   originalRequest._retry = true
      //   try {
      //     const refreshResponse = await axios.post("/auth/refresh", {}, { withCredentials: true })
      //     const newToken = refreshResponse.data.token
      //     useAuthStore.setState({ token: newToken })
      //     originalRequest.headers.Authorization = `Bearer ${newToken}`
      //     return axiosInstance(originalRequest)
      //   } catch (refreshError) {
      //     logout()
      //     window.location.href = "/login"
      //   }
      // }

      // ❌ If no refresh token flow → just logout
      logout()
      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
