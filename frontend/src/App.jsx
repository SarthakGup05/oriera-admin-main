// src/App.jsx
import React from "react";
import "./App.css";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { LoginForm } from "./components/login-form";
import Layout from "./Layout/Layout";
import Dashboard from "./app/dashboard/Dashboard";
import TestimonialsPage from "./Pages/Testimonials";
import PackagesPage from "./Pages/packagesPage";
import EnquiryPage from "./Pages/EnquiryPage";
import ServicesPage from "./Pages/ServicePage";
import GalleryPage from "./Pages/GalleryPage";
import SliderPage from "./Pages/SliderPage";
import BlogsPage from "./Pages/BlogsPage";
import BlogEditorPage from "./Pages/BlogEditorPage";
import ProtectedRoute from "./components/protectedRoute";
import { Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";
import useAuthStore from "./store/useAuthStore";

// Custom Toast Component that adapts to theme
const CustomToaster = () => {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        className: "",
        duration: 4000,
        style: {
          background: isDark ? "hsl(224 71% 4%)" : "hsl(0 0% 100%)",
          color: isDark ? "hsl(213 31% 91%)" : "hsl(224 71% 4%)",
          border: `1px solid ${
            isDark ? "hsl(216 34% 17%)" : "hsl(220 13% 91%)"
          }`,
          borderRadius: "8px",
          fontSize: "14px",
          padding: "12px 16px",
          boxShadow: isDark
            ? "0 4px 12px rgba(0, 0, 0, 0.5)"
            : "0 4px 12px rgba(0, 0, 0, 0.15)",
          maxWidth: "400px",
        },

        success: {
          duration: 3000,
          style: {
            background: isDark ? "hsl(224 71% 4%)" : "hsl(0 0% 100%)",
            color: isDark ? "hsl(213 31% 91%)" : "hsl(224 71% 4%)",
            border: "1px solid hsl(142 76% 36%)",
            borderLeft: "4px solid hsl(142 76% 36%)",
          },
          iconTheme: {
            primary: "hsl(142 76% 36%)",
            secondary: isDark ? "hsl(224 71% 4%)" : "hsl(0 0% 100%)",
          },
        },

        error: {
          duration: 5000,
          style: {
            background: isDark ? "hsl(224 71% 4%)" : "hsl(0 0% 100%)",
            color: isDark ? "hsl(213 31% 91%)" : "hsl(224 71% 4%)",
            border: "1px solid hsl(0 84% 60%)",
            borderLeft: "4px solid hsl(0 84% 60%)",
          },
          iconTheme: {
            primary: "hsl(0 84% 60%)",
            secondary: isDark ? "hsl(224 71% 4%)" : "hsl(0 0% 100%)",
          },
        },

        loading: {
          style: {
            background: isDark ? "hsl(224 71% 4%)" : "hsl(0 0% 100%)",
            color: isDark ? "hsl(213 31% 91%)" : "hsl(224 71% 4%)",
            border: `1px solid ${
              isDark ? "hsl(216 34% 17%)" : "hsl(220 13% 91%)"
            }`,
            borderLeft: "4px solid hsl(217 91% 60%)",
          },
        },
      }}
    />
  );
};

// 🔹 Authentication Initializer Component
const AuthInitializer = ({ children }) => {
  const { initializeAuth, token, loading } = useAuthStore();
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    const initialize = async () => {
      // Only initialize if we have a token but haven't initialized yet
      if (token && !initialized) {
        await initializeAuth();
      }
      setInitialized(true);
    };

    initialize();
  }, [initializeAuth, token, initialized]);

  // Show loading only if we have a token but haven't initialized
  if (token && !initialized && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">
            Initializing authentication...
          </p>
        </div>
      </div>
    );
  }

  return children;
};

// 🔹 Login Redirect Component
const LoginRedirect = () => {
  const { isAuthenticated, token } = useAuthStore();

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated && token) {
    return <Navigate to="/" replace />;
  }

  return <LoginForm />;
};

// 🔹 Enhanced Unauthorized Page Component
const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">
          Access Denied
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          You don't have the required permissions to access this resource.
          {user?.email && (
            <span className="block mt-2 text-sm">
              Logged in as: <span className="font-medium">{user.email}</span>
            </span>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthInitializer>
      <Routes>
        {/* 🔹 Public Routes */}
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* 🔹 Protected Routes with Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard - Accessible to all authenticated users */}
          <Route index element={<Dashboard />} />

          {/* Content Management Routes */}
          <Route path="testimonials" element={<TestimonialsPage />} />
          <Route path="packages" element={<PackagesPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="slider" element={<SliderPage />} />
          <Route path="blogs" element={<BlogsPage />} />
          <Route path="blogs/new" element={<BlogEditorPage />} />
          <Route path="blogs/edit/:id" element={<BlogEditorPage />} />

          {/* Gallery Routes */}
          <Route path="capture/gallery" element={<GalleryPage />} />

          {/* Enquiry Management */}
          <Route path="enquiries" element={<EnquiryPage />} />
        </Route>

        {/* 🔹 Catch-All Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Custom Toast Component */}
      <CustomToaster />
    </AuthInitializer>
  );
}

export default App;
