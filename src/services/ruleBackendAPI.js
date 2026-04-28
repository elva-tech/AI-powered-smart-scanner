/**
 * Real Backend Rule Service
 * Uses Django REST API endpoints instead of mock data
 */

import { apiClient } from './apiClient';

const BASE_URL = '/sap/rules';

/**
 * Fetch all rules from backend with filtering/pagination
 */
export const ruleBackendAPI = {
  // Fetch all rules
  async fetchRules(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.module) params.append('module', filters.module);
      if (filters.risk) params.append('risk', filters.risk);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.pageSize) params.append('page_size', filters.pageSize);

      const response = await apiClient.get(`${BASE_URL}/?${params.toString()}`);
      
      if (response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination,
        };
      }
      return { success: false, error: 'Failed to fetch rules' };
    } catch (error) {
      console.error('Error fetching rules:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single rule
  async getRule(ruleId) {
    try {
      const response = await apiClient.get(`${BASE_URL}/${ruleId}/`);
      
      if (response.data.status === 'success') {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: 'Failed to fetch rule' };
    } catch (error) {
      console.error('Error fetching rule:', error);
      return { success: false, error: error.message };
    }
  },

  // Create rule
  async createRule(ruleData) {
    try {
      const response = await apiClient.post(BASE_URL + '/', ruleData);
      
      if (response.data.status === 'success') {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Error creating rule:', error);
      return { success: false, error: error.message };
    }
  },

  // Update rule
  async updateRule(ruleId, ruleData) {
    try {
      const response = await apiClient.put(`${BASE_URL}/${ruleId}/`, ruleData);
      
      if (response.data.status === 'success') {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Error updating rule:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete rule
  async deleteRule(ruleId) {
    try {
      const response = await apiClient.delete(`${BASE_URL}/${ruleId}/`);
      
      if (response.data.status === 'success') {
        return { success: true };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Error deleting rule:', error);
      return { success: false, error: error.message };
    }
  },

  // Run simulation
  async runSimulation(ruleId, config) {
    try {
      const response = await apiClient.post(`${BASE_URL}/${ruleId}/simulate/`, {
        environment: config.environment || 'QA',
        mode: config.mode || 'test',
        transactionsScanned: config.transactionCount || 10000,
        falsePositiveRate: config.falsePositiveRate || 1.5,
        performance: config.performance || '< 90ms',
        anomaliesDetected: config.anomaliesDetected || 30,
        dateFrom: config.fromDate || null,
        dateTo: config.toDate || null,
      });

      if (response.data.status === 'success') {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Error running simulation:', error);
      return { success: false, error: error.message };
    }
  },

  // Activate rule
  async activateRule(ruleId) {
    try {
      const response = await apiClient.post(`${BASE_URL}/${ruleId}/activate/`);
      
      if (response.data.status === 'success') {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Error activating rule:', error);
      return { success: false, error: error.message };
    }
  },

  // Deploy rule
  async deployRule(ruleId, environment) {
    try {
      const response = await apiClient.post(`${BASE_URL}/${ruleId}/deploy/`, {
        environment,
      });

      if (response.data.status === 'success') {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Error deploying rule:', error);
      return { success: false, error: error.message };
    }
  },

  // Get rule statistics
  async getRuleStatistics() {
    try {
      const response = await apiClient.get(`${BASE_URL}/statistics/`);
      
      if (response.data.status === 'success') {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: 'Failed to fetch statistics' };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return { success: false, error: error.message };
    }
  },
};

export default ruleBackendAPI;
