import { authService } from '../../services/authService';

export const loginAPI = async (email, password) => {
  try {
    // Use the auth service which handles backend integration
    return await authService.login(email, password);
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const logoutAPI = async () => {
  try {
    return await authService.logout();
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getCurrentUserAPI = async () => {
  try {
    return await authService.getCurrentUser();
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};