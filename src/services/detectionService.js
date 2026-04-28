import apiClient from './apiClient';

export const detectionService = {
  // Get detections based on applied rules
  getDetections: async (filters = {}) => {
    try {
      const response = await apiClient.get('/sap/realtime/data/', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  },

  // Get detection statistics
  getDetectionStats: async () => {
    try {
      const response = await apiClient.get('/sap/test-sap/');
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  },

  // Mark detection as reviewed
  reviewDetection: async (detectionId, status = 'reviewed') => {
    try {
      const response = await apiClient.post('/sap/api/', {
        endpoint: `/detections/${detectionId}/review`,
        params: { status },
      });
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  },
};
