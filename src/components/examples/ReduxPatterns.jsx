/**
 * HOW TO: Integrate Backend API with Redux Slices
 *
 * This file demonstrates the pattern for updating Redux slices
 * to use the backend API services instead of mock data.
 */

// ─────────────────────────────────────────────────────────────────────────────
// BEFORE: Using mock API
// ─────────────────────────────────────────────────────────────────────────────

// OLD PATTERN (DON'T USE):
/*
import { fetchRulesAPI } from './rulesAPI';

export const fetchRules = createAsyncThunk(
  'rules/fetch',
  async () => {
    const r = await fetchRulesAPI();
    return r.data;
  }
);
*/

// ─────────────────────────────────────────────────────────────────────────────
// AFTER: Using backend API services
// ─────────────────────────────────────────────────────────────────────────────

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ruleService } from '../../services/ruleService';
import { sapService } from '../../services/sapService';

// ─── PATTERN 1: Simple Service Call ───────────────────────────────────────

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const result = await sapService.getRealtimeData();

      if (result.status === 'error') {
        return rejectWithValue(result.message);
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Usage in slice:
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ─── PATTERN 2: Async Action with Parameters ───────────────────────────────

export const processRuleRequest = createAsyncThunk(
  'rules/processRequest',
  async (userInput, { rejectWithValue }) => {
    try {
      const result = await ruleService.processRuleRequest(userInput);

      if (result.status === 'error') {
        return rejectWithValue(result.message);
      }

      // Return the full result with all fields
      return {
        intent: result.intent,
        collectedFields: result.collected_fields,
        missingFields: result.missing_fields,
        cdsCode: result.cds_code,
        approved: result.approved,
        messages: result.messages,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ─── PATTERN 3: Multi-step Async Action ───────────────────────────────────

export const deployAndExecuteRule = createAsyncThunk(
  'rules/deployAndExecute',
  async (
    { cdsCode, ruleName, environment, filters },
    { rejectWithValue }
  ) => {
    try {
      // Step 1: Apply rule
      const applyResult = await ruleService.applyRule(cdsCode, ruleName);

      if (applyResult.status === 'error') {
        return rejectWithValue(applyResult.message);
      }

      const ruleId = applyResult.rule_id;

      // Step 2: Execute rule
      const execResult = await ruleService.executeRule(ruleId, filters);

      if (execResult.status === 'error') {
        return rejectWithValue(execResult.message);
      }

      return {
        ruleId,
        ruleName,
        status: 'DEPLOYED',
        executionResult: execResult,
        deployedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Usage in slice:
const ruleSlice = createSlice({
  name: 'rules',
  initialState: {
    currentRule: null,
    deploymentStatus: 'idle', // idle | pending | fulfilled | rejected
    error: null,
    lastDeployedRule: null,
  },
  extraReducers: (builder) => {
    builder
      // Process request
      .addCase(processRuleRequest.pending, (state) => {
        state.deploymentStatus = 'pending';
        state.error = null;
      })
      .addCase(processRuleRequest.fulfilled, (state, action) => {
        state.currentRule = action.payload;
        state.deploymentStatus = 'fulfilled';
      })
      .addCase(processRuleRequest.rejected, (state, action) => {
        state.deploymentStatus = 'rejected';
        state.error = action.payload;
      })
      // Deploy and Execute
      .addCase(deployAndExecuteRule.pending, (state) => {
        state.deploymentStatus = 'pending';
        state.error = null;
      })
      .addCase(deployAndExecuteRule.fulfilled, (state, action) => {
        state.lastDeployedRule = action.payload;
        state.deploymentStatus = 'fulfilled';
        state.error = null;
      })
      .addCase(deployAndExecuteRule.rejected, (state, action) => {
        state.deploymentStatus = 'rejected';
        state.error = action.payload;
      });
  },
});

// ─── PATTERN 4: Handling Array Updates ───────────────────────────────────

export const fetchDetections = createAsyncThunk(
  'detections/fetch',
  async ({ filters, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const result = await sapService.callAPI('/detections', {
        filters,
        page,
        limit,
      });

      if (result.status === 'error') {
        return rejectWithValue(result.message);
      }

      return {
        items: result.data,
        total: result.total,
        page,
        hasMore: result.has_more,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Usage in slice:
const detectionSlice = createSlice({
  name: 'detections',
  initialState: {
    items: [],
    total: 0,
    currentPage: 1,
    hasMore: false,
    loading: false,
    error: null,
  },
  reducers: {
    // Manual action to add/update a detection
    updateDetection: (state, action) => {
      const index = state.items.findIndex((d) => d.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    // Clear all detections
    clearDetections: (state) => {
      state.items = [];
      state.total = 0;
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDetections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDetections.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.currentPage = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchDetections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ─── PATTERN 5: Real-time Updates via Subscription ──────────────────────────

// This pattern is better handled in components, but you can dispatch actions
// from a custom hook that subscribes to real-time updates

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { dashboardService } from '../../services/dashboardService';

// Create action to update real-time data
const updateRealtimeData = createSlice({
  name: 'realtime',
  initialState: { data: null },
  reducers: {
    setRealtimeData: (state, action) => {
      state.data = action.payload;
    },
  },
});

// Custom hook to subscribe
export function useRealtimeData() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = dashboardService.streamRealtimeUpdates(
      (data) => {
        // Dispatch Redux action with new data
        dispatch(updateRealtimeData.actions.setRealtimeData(data));
      },
      (error) => {
        console.error('Real-time subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [dispatch]);
}

// ─── PATTERN 6: Handling Side Effects ───────────────────────────────────

import { createAsyncThunk } from '@reduxjs/toolkit';

// When you need to call backend AFTER Redux state is updated
export const applyRuleAndNotify = createAsyncThunk(
  'rules/applyRuleAndNotify',
  async ({ ruleId, cdsCode, ruleName }, { dispatch, rejectWithValue }) => {
    try {
      const result = await ruleService.applyRule(cdsCode, ruleName);

      if (result.status === 'error') {
        return rejectWithValue(result.message);
      }

      // Can dispatch additional actions
      // dispatch(someAction());

      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ─── USAGE EXAMPLES ────────────────────────────────────────────────────────

// In a component:
import { useAppDispatch, useAppSelector } from '../../app/hooks';

export function RuleLibraryComponent() {
  const dispatch = useAppDispatch();
  const { currentRule, deploymentStatus, error } = useAppSelector(
    (state) => state.rules
  );

  const handleCreateRule = (userInput) => {
    dispatch(processRuleRequest(userInput));
  };

  const handleDeployRule = (cdsCode, ruleName) => {
    dispatch(
      deployAndExecuteRule({
        cdsCode,
        ruleName,
        environment: 'QA',
        filters: {},
      })
    );
  };

  return (
    <div>
      {deploymentStatus === 'pending' && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {currentRule && <p>Rule: {currentRule.intent}</p>}
    </div>
  );
}

// ─── SELECTOR PATTERNS ────────────────────────────────────────────────────

// Create reusable selectors:
export const selectCurrentRule = (state) => state.rules.currentRule;
export const selectDeploymentStatus = (state) => state.rules.deploymentStatus;
export const selectDeploymentError = (state) => state.rules.error;

export const selectIsDeploying = (state) =>
  state.rules.deploymentStatus === 'pending';

export const selectCanDeploy = (state) =>
  state.rules.currentRule && state.rules.deploymentStatus !== 'pending';

// ─── COMMON PATTERNS SUMMARY ───────────────────────────────────────────────

/**
 * Error Handling Pattern:
 * Always use rejectWithValue() to pass error to rejected handler
 * Check response.status === 'error' first
 * Then check for network/connection errors
 *
 * Loading State Pattern:
 * Use .pending for loading = true
 * Use .fulfilled or .rejected for loading = false
 * Track deploymentStatus: 'idle' | 'pending' | 'fulfilled' | 'rejected'
 *
 * Data Shape Pattern:
 * API response → Extract relevant fields → Store normalized in state
 * Example: result.data → { items, total, hasMore }
 *
 * Side Effects Pattern:
 * Use configWithActions to get dispatch in thunk
 * No side effects in reducers (pure functions)
 * Handle async logic in thunks
 */

export default {
  fetchDashboardData,
  processRuleRequest,
  deployAndExecuteRule,
  fetchDetections,
  applyRuleAndNotify,
  useRealtimeData,
};
