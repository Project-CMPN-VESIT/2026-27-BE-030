import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export interface UserProfile {
  user_id: string;
  user_name: string;
  email: string;
  picture?: string;
}

interface DecodedToken {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loginWithGoogleToken: (credential: string) => Promise<UserProfile>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load persisted user from localStorage on startup
    const storedUser = localStorage.getItem("psychtriage_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user profile", e);
        localStorage.removeItem("psychtriage_user");
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogleToken = async (credential: string): Promise<UserProfile> => {
    // Decode the Google JWT ID token
    const decoded: DecodedToken = jwtDecode(credential);

    const userProfile: UserProfile = {
      user_id: decoded.sub, // Unique Google User ID
      user_name: decoded.name || "User",
      email: decoded.email,
      picture: decoded.picture,
    };

    // Register / Sync user profile with FastAPI & MongoDB backend
    try {
      await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userProfile),
      });
    } catch (error) {
      console.warn("Could not sync user with backend server:", error);
    }

    // Persist locally
    setUser(userProfile);
    localStorage.setItem("psychtriage_user", JSON.stringify(userProfile));
    return userProfile;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("psychtriage_user");
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogleToken, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

