import axios from "axios";
import { API_BASE_URL } from "./auth";
import { ensureCsrfToken as getCsrfToken, refreshCsrfToken } from "./csrfUtils";

// Create axios instance with credentials for cookies
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: include cookies (JWT token) in requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token cache (shared with csrfUtils)
let csrfToken = null;

// Function to get CSRF token (uses shared utility)
const ensureCsrfToken = async () => {
  csrfToken = await getCsrfToken();
  return csrfToken;
};

// Function to execute user code via secure server endpoint
export const executeCode = async (language, sourceCode) => {
  try {
    // Ensure we have CSRF token
    const token = await ensureCsrfToken();
    
    if (!token) {
      throw new Error('CSRF token not available. Please refresh the page.');
    }

    // Prepare request with CSRF token
    // Server expects: { language, code, version? }
    const response = await apiClient.post("/api/execute", {
      language: language,
      code: sourceCode, // Server expects 'code' directly, not 'files[0].content'
    }, {
      headers: {
        'X-CSRF-TOKEN': token, // CSRF token in header
      },
    });

    // Return the response data in the same format as before
    // Server returns: { language, version, run: { stdout, stderr, output, code }, compile?, executionTime }
    return response.data;
  } catch (error) {
    // Handle CSRF token errors
    if (error.response && error.response.status === 403) {
      // CSRF token expired or invalid, try to refresh
      csrfToken = null;
      const newToken = await refreshCsrfToken();
      
      if (newToken) {
        // Retry the request with new token
        try {
          const retryResponse = await apiClient.post("/api/execute", {
            language: language,
            code: sourceCode, // Use 'code' field, not 'files' array
          }, {
            headers: {
              'X-CSRF-TOKEN': newToken,
            },
          });
          return retryResponse.data;
        } catch (retryError) {
          throw new Error('Authentication failed. Please log in again.');
        }
      } else {
        throw new Error('Authentication failed. Please log in again.');
      }
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      throw new Error('You must be logged in to execute code.');
    }
    
    // Handle timeout errors
    if (error.response && error.response.status === 408) {
      throw new Error('Code execution timed out. Please check your code for infinite loops.');
    }
    
    // Handle validation errors
    if (error.response && error.response.status === 400) {
      const errorMessage = error.response.data?.message || 'Invalid code or language.';
      throw new Error(errorMessage);
    }
    
    // Handle other errors
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Code execution failed.');
    }
    
    // Network or other errors
    throw new Error(error.message || 'Unable to execute code. Please check your connection.');
  }
};

// Export function to refresh CSRF token (re-export from csrfUtils)
export { refreshCsrfToken };
