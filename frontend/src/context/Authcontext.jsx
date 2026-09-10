import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from backend on page load
  useEffect(() => {
    axios
      .get("https://backend.jayaphotography.in/api/v1/auth/profile", {
        withCredentials: true,
      })
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(
      "https://backend.jayaphotography.in/api/v1/auth/login",
      { email, password },
      { withCredentials: true }
    );
    setUser(res.data.user);
    return res;
  };

  const logout = async () => {
    try {
      await axios.post(
        "https://backend.jayaphotography.in/api/v1/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
