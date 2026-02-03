import { createContext } from "react";

// User interface
export interface User {
  id: string;
  _id?: string; // MongoDB ObjectId (alternative to id)
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: "user" | "agent" | "admin" | "analytics";
  planType?: "Free" | "Pro" | "Premium";
  planExpiresAt?: string | null;
  photoURL?: string; // User profile photo URL
}

// OTP verification pending interface
export interface PendingVerification {
  email: string;
  userId: string | null;
}

// Auth context interface
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (
    name: string,
    email: string,
    password: string,
    role?: "user" | "agent" | "admin" | "analytics",
    phoneNumber?: string
  ) => Promise<boolean>;
  googleLogin: (token: string) => Promise<boolean>;
  googleSignupWithRole: (
    token: string,
    role: "user" | "agent" | "admin" | "analytics",
    organization?: string,
    phoneNumber?: string
  ) => Promise<boolean>;
  decodeGoogleToken: (token: string) => Promise<{ name: string; email: string } | null>;
  loginWithFacebook: (code: string, isSignup?: boolean) => Promise<boolean>;
  facebookSignupWithRole: (
    code: string,
    role: "user" | "agent" | "admin" | "analytics"
  ) => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  // OTP verification related props
  pendingVerification: PendingVerification | null;
  isVerificationPending: boolean;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  resendOTP: (email: string) => Promise<boolean>;
  cancelVerification: () => void;
}

// Create Auth Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);