import apiClient from './apiClient';

export const dashboardService = {
  // Get dashboard data with real-time monitoring
  getDashboardData: async () => {
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

  // Stream real-time dashboard updates using Server-Sent Events
  streamRealtimeUpdates: (onData, onError) => {
    // Use relative path for SSE (Vite proxy will handle it)
    const eventSource = new EventSource('/sap/realtime/stream/');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onData(data);
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      if (onError) onError(error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  },

  // Get connection status
  getConnectionStatus: async () => {
    try {
      const response = await apiClient.get('/sap/test-sap/');
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        connection_status: 'disconnected',
      };
    }
  },
};
