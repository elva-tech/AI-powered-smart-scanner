import apiClient from './apiClient';

// Mock auth service - replace with real backend when ready
export const authService = {
  login: async (email, password) => {
    // Simulate API call
    await new Promise((res) => setTimeout(res, 800));

    let role = 'User';
    let name = 'User';

    if (email === 'admin@corp.com') {
      role = 'Administrator';
      name = 'Admin';
    } else if (email === 'analyst@corp.com') {
      role = 'Analyst';
      name = 'Analyst';
    }

    const userData = {
      email,
      name,
      role,
    };

    // Store auth token
    const token = btoa(JSON.stringify(userData));
    localStorage.setItem('authToken', token);

    return {
      success: true,
      data: userData,
    };
  },

  logout: async () => {
    localStorage.removeItem('authToken');
    return { success: true };
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return { success: false, data: null };
    }

    try {
      const userData = JSON.parse(atob(token));
      return { success: true, data: userData };
    } catch (e) {
      return { success: false, data: null };
    }
  },
};
