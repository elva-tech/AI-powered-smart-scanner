import apiClient from './apiClient';

export const ruleService = {
  // Process rule request through AI Agent
  processRuleRequest: async (userInput) => {
    try {
      const response = await apiClient.post('/sap/rule-agent/', {
        user_input: userInput,
      });
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        error_type: error.response?.data?.error_type || 'UnknownError',
      };
    }
  },

  // Apply rule to SAP system
  applyRule: async (cdsCode, ruleName = 'FraudDetectionRule') => {
    try {
      const response = await apiClient.post('/sap/rule-agent/apply/', {
        cds_code: cdsCode,
        rule_name: ruleName,
      });
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  },

  // Execute rule on SAP data
  executeRule: async (ruleId, filters = {}) => {
    try {
      const response = await apiClient.post('/sap/rule-agent/execute/', {
        rule_id: ruleId,
        filters,
      });
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  },

  // Complete fraud detection flow
  completeFraudFlow: async (userInput) => {
    try {
      const response = await apiClient.post('/sap/rule-agent/complete-flow/', {
        user_input: userInput,
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
