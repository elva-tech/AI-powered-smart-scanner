import apiClient from './apiClient';

export const sapService = {
  // Test SAP connection
  testConnection: async () => {
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

  // Get real-time SAP data
  getRealtimeData: async () => {
    try {
      const response = await apiClient.get('/sap/realtime/data/');
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  },

  // Start real-time monitoring
  startMonitoring: async (pollInterval = 5) => {
    try {
      const response = await apiClient.post('/sap/realtime/start/', {
        poll_interval: pollInterval,
      });
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  },

  // Stop real-time monitoring
  stopMonitoring: async () => {
    try {
      const response = await apiClient.post('/sap/realtime/stop/');
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  },

  // Generic SAP API call
  callAPI: async (endpoint, params = {}, method = 'GET') => {
    try {
      const config = {
        params: method === 'GET' ? { endpoint, ...params } : undefined,
      };

      const response =
        method === 'GET'
          ? await apiClient.get('/sap/api/', config)
          : await apiClient.post('/sap/api/', {
              endpoint,
              params,
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
