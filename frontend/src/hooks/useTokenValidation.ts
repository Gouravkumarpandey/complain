import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Token payload interface to properly type the JWT payload
 */
interface TokenPayload {
  exp: number;
  iat: number;
  id: string;
  email: string;
  role: string;
  name?: string;
  permissions?: string[];
  teams?: string[];
  department?: string;
  [key: string]: number | string | boolean | string[] | undefined;
}

/**
 * Custom hook for token validation and management
 * Use this to validate tokens, handle refreshes, and track token status
 */
export function useTokenValidation() {
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null);
  const { logout } = useAuth();

  /**
   * Validate and decode JWT token
   */
  const validateToken = useCallback((token: string | null): boolean => {
    if (!token) return false;

    try {
      // Basic structure check
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Decode payload
      const payload = JSON.parse(atob(parts[1])) as TokenPayload;
      setTokenPayload(payload);

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Refresh token from backend
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      // Check if token exists first - if not, return early
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        return false;
      }

      // Prevent multiple simultaneous refresh attempts
      const lastRefreshTime = parseInt(localStorage.getItem('lastTokenRefresh') || '0');
      const now = Date.now();
      
      if (now - lastRefreshTime < 5000) { // 5 seconds
        return false;
      }
      
      // Record this attempt
      localStorage.setItem('lastTokenRefresh', now.toString());

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          refreshToken: localStorage.getItem('refreshToken'),
        }),
        credentials: 'include', // include cookies if your refresh uses them
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return false;
        }
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const data = await response.json();

      // Save the new tokens
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Validate the new token
      const isValid = validateToken(data.token);
      setIsTokenValid(isValid);

      // Notify the app that the token was refreshed
      window.dispatchEvent(
        new CustomEvent('tokenRefreshed', {
          detail: { success: isValid },
        })
      );

      return isValid;
    } catch {
      setIsTokenValid(false);
      logout();
      return false;
    }
  }, [logout, validateToken]);

  // Track last check time to prevent repeated validation
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);

  /**
   * Check if token is about to expire (within 5 minutes) and refresh if needed
   */
  const checkTokenExpiration = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    // Throttle checks to prevent too many API calls
    const now = Date.now();
    const MIN_CHECK_INTERVAL = 10000; // 10 seconds minimum between checks
    
    if (now - lastCheckTime < MIN_CHECK_INTERVAL) {
      // Return true for successful validation to prevent cascading failures
      return true;
    }
    
    // Update last check time
    setLastCheckTime(now);

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      let payload: TokenPayload;
      try {
        payload = JSON.parse(atob(parts[1])) as TokenPayload;
      } catch {
        return false;
      }
      
      if (!payload.exp) {
        return false;
      }

      const expiresIn = payload.exp * 1000 - Date.now();
      const refreshThreshold = 5 * 60 * 1000; // 5 minutes
      
      // If token is already expired
      if (expiresIn <= 0) {
        return await refreshToken();
      }
      
      // If token is about to expire
      if (expiresIn < refreshThreshold) {
        return await refreshToken();
      }

      return true;
    } catch {
      return false;
    }
  }, [refreshToken, lastCheckTime]);

  /**
   * On mount: validate token and attempt refresh if invalid
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isValid = validateToken(token);
    setIsTokenValid(isValid);

    if (!isValid && token) {
      refreshToken().catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        logout();
      });
    }
  // Only run this effect once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isTokenValid,
    tokenPayload,
    validateToken,
    refreshToken,
    checkTokenExpiration,
  };
}
