// Authentication utility functions

// Export API base URL for use in other components
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Check if user is authenticated
export const checkAuth = async () => {
  try {
    // Get token from localStorage as fallback (for localhost cross-origin issues)
    const token = localStorage.getItem('authToken');
    
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists in localStorage
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      credentials: 'include', // Important: include cookies in request
      headers: headers,
    });
    
    if (response.ok) {
      const data = await response.json();
      return { authenticated: true, user: data.user };
    }
    return { authenticated: false, user: null };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false, user: null };
  }
};

// Logout function
export const logout = async () => {
  try {
    // Clear token from localStorage
    localStorage.removeItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include', // Important: include cookies in request
    });
    
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

// Get current user info
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

