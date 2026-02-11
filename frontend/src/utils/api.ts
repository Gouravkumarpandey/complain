/**
 * Shared Axios Instance for API Communication
 * 
 * This file provides a centralized Axios instance configured for production deployment.
 * All API calls should use this instance instead of fetch or hardcoded URLs.
 * 
 * Environment Variables Required:
 * - VITE_API_BASE_URL: Backend API base URL (e.g., https://srv-d5kb4pili9vc73farna0.onrender.com
/api)
 * 
 * Features:
 * - Automatic token attachment to requests
 * - Credentials support for cookies/sessions
 * - Request/Response interceptors for error handling
 * - Automatic token expiry detection
 * - Base URL from environment variables (no hardcoded URLs)
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Get API base URL from environment variables
// In production, this should be: https://complai-y8tj.onrender.com/api

// In development: http://localhost:5001/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

if (import.meta.env.DEV) {
  console.log('✅ API configured with base URL:', API_BASE_URL);
}

// Create Axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // 20 seconds
  withCredentials: true, // Enable credentials (cookies, authorization headers)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically adds authentication token to all requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        // Check if token is expired
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const expiryTime = payload.exp * 1000;

          // If token expires in less than 10 seconds, trigger refresh
          if (Date.now() < expiryTime - 10000) {
            config.headers.Authorization = `Bearer ${token}`;
          } else {
            console.warn('⚠️ Token expired, not adding to request');
            localStorage.removeItem('token');
            window.dispatchEvent(new Event('tokenExpired'));
          }
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.debug('Failed to parse token, using it anyway', err);
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles common error scenarios and token expiration
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      console.error('❌ Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        networkError: true,
      });
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      console.warn('⚠️ Unauthorized request, clearing token');
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('tokenExpired'));
    }

    // Handle forbidden errors
    if (error.response.status === 403) {
      console.warn('⚠️ Forbidden request');
    }

    // Handle server errors
    if (error.response.status >= 500) {
      console.error('❌ Server error:', error.response.status);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to get error message from Axios error
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.response?.data?.error || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Helper function to check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && !error.response;
};

export default api;
