import useAuthStore from "@/store/useAuthStore";
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "./Loader";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  
  // 🔹 Zustand Auth Store
  const { 
    user, 
    loading, 
    isAuthenticated, 
    initializeAuth,
    token 
  } = useAuthStore();

  // 🔹 Initialize authentication on mount
  useEffect(() => {
    const initialize = async () => {
      // Only initialize if we have a token but no user data
      if (token && !user) {
        await initializeAuth();
      }
    };

    initialize();
  }, [token, user, initializeAuth]);

  // 🔹 Show loader while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  // 🔹 Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // 🔹 Check role-based access (if roles are specified)
  if (allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 🔹 Render children or outlet
  return children || <Outlet />;
};

export default ProtectedRoute;
