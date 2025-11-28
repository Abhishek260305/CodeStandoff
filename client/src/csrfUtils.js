import axios from "axios";
import { API_BASE_URL } from "./auth";

// CSRF token cache
let csrfToken = null;

// Function to get CSRF token from server
export const getCsrfToken = async () => {
  try {
    // CSRF token is set in cookie by server, but we need to get it from the response
    const response = await axios.get(`${API_BASE_URL}/csrf-token`, {
      withCredentials: true,
    });
    
    if (response.data && response.data.csrfToken) {
      csrfToken = response.data.csrfToken;
      return csrfToken;
    }
    
    // Fallback: try to get from cookie
    const cookies = document.cookie.split(';');
    const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
    if (xsrfCookie) {
      csrfToken = decodeURIComponent(xsrfCookie.split('=')[1]);
      return csrfToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

// Ensure CSRF token is available
export const ensureCsrfToken = async () => {
  if (!csrfToken) {
    await getCsrfToken();
  }
  return csrfToken;
};

// Refresh CSRF token (clear cache and fetch new one)
export const refreshCsrfToken = async () => {
  csrfToken = null;
  return await getCsrfToken();
};

// Get current CSRF token (without fetching if not available)
export const getCurrentCsrfToken = () => {
  return csrfToken;
};

