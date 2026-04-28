/**
 * EXAMPLE: Complete integration example showing how to use backend APIs
 * This file demonstrates best practices for API integration
 * 
 * Copy/paste patterns from this file into your components
 */

import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import { sapService } from '../services/sapService';
import { ruleService } from '../services/ruleService';
import { dashboardService } from '../services/dashboardService';
import { detectionService } from '../services/detectionService';

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 1: Testing SAP Connection
// ─────────────────────────────────────────────────────────────────────────────

export function ConnectionTest() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await sapService.testConnection();

      if (result.status === 'connected') {
        setStatus({
          connected: true,
          badge: result.badge,
          notifications: result.notifications,
        });
      } else {
        setError('SAP not connected');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleTest} disabled={loading}>
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      {status && <p>✓ Connected! Badge: {status.badge}</p>}
      {error && <p>✗ Error: {error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 2: Real-time Dashboard with SSE Streaming
// ─────────────────────────────────────────────────────────────────────────────

export function RealtimeDashboard() {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = null;
    let pollInterval = null;

    const startStreaming = () => {
      // Try SSE first (preferred)
      try {
        unsubscribe = dashboardService.streamRealtimeUpdates(
          (newData) => {
            setData(newData);
            setIsConnected(true);
            setError(null);
          },
          (err) => {
            console.warn('SSE connection failed, falling back to polling');
            startPolling();
          }
        );
      } catch (err) {
        startPolling();
      }
    };

    const startPolling = () => {
      // Fallback: poll every 5 seconds
      pollInterval = setInterval(async () => {
        try {
          const result = await dashboardService.getDashboardData();
          setData(result.data);
          setIsConnected(true);
          setError(null);
        } catch (err) {
          console.error('Polling error:', err);
          setError(err.message);
          setIsConnected(false);
        }
      }, 5000);
    };

    startStreaming();

    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  return (
    <div>
      <div className="status-indicator">
        {isConnected ? (
          <span className="text-green-500">● Connected</span>
        ) : (
          <span className="text-red-500">● Disconnected</span>
        )}
      </div>

      {data && (
        <div className="dashboard-data">
          <p>Status: {data.status}</p>
          <p>Badge: {data.badge}</p>
          <p>Notifications: {data.notifications}</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 3: Processing Rule with AI Agent (Multi-step)
// ─────────────────────────────────────────────────────────────────────────────

export function RuleGenerator() {
  const [userInput, setUserInput] = useState('');
  const [step, setStep] = useState('input'); // input -> processing -> review -> deployed
  const [ruleData, setRuleData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateRule = async () => {
    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      // Step 1: Process through AI Agent
      const result = await ruleService.processRuleRequest(userInput);

      if (result.status === 'error') {
        throw new Error(result.message);
      }

      setRuleData(result);
      setStep('review');
    } catch (err) {
      setError(err.message);
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRule = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 2: Apply the generated CDS code to SAP
      const result = await ruleService.applyRule(
        ruleData.cds_code,
        ruleData.collected_fields.rule_name || 'New Rule'
      );

      if (result.status === 'error') {
        throw new Error(result.message);
      }

      // Step 3: Store rule_id for execution
      setRuleData((prev) => ({
        ...prev,
        rule_id: result.rule_id,
        sap_response: result.sap_response,
      }));

      setStep('deployed');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {step === 'input' && (
        <div>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe the fraud pattern you want to detect..."
          />
          <button onClick={handleGenerateRule} disabled={loading || !userInput}>
            {loading ? 'Generating...' : 'Generate Rule'}
          </button>
        </div>
      )}

      {step === 'processing' && <p>Processing your request...</p>}

      {step === 'review' && ruleData && (
        <div>
          <h3>Generated Rule</h3>
          <p>Intent: {ruleData.intent}</p>
          <p>Fields: {JSON.stringify(ruleData.collected_fields)}</p>
          <pre>{ruleData.cds_code}</pre>
          <button onClick={handleApplyRule} disabled={loading}>
            {loading ? 'Applying...' : 'Apply to SAP'}
          </button>
        </div>
      )}

      {step === 'deployed' && (
        <div className="success">
          <p>✓ Rule deployed successfully!</p>
          <p>Rule ID: {ruleData.rule_id}</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 4: Executing Rule on SAP Data
// ─────────────────────────────────────────────────────────────────────────────

export function RuleExecution({ ruleId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    module: '',
  });

  const handleExecute = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await ruleService.executeRule(ruleId, filters);

      if (result.status === 'error') {
        throw new Error(result.message);
      }

      setResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Execute Rule</h3>

      <div>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          placeholder="Start Date"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          placeholder="End Date"
        />
        <select
          value={filters.module}
          onChange={(e) => setFilters({ ...filters, module: e.target.value })}
        >
          <option value="">Select Module</option>
          <option value="FI">FI (Finance)</option>
          <option value="CO">CO (Controlling)</option>
          <option value="MM">MM (Materials)</option>
        </select>
      </div>

      <button onClick={handleExecute} disabled={loading}>
        {loading ? 'Executing...' : 'Run Rule'}
      </button>

      {results && (
        <div className="results">
          <h4>Execution Results</h4>
          <p>Violations Found: {results.violations_count}</p>
          <p>Scan Time: {results.scan_duration}ms</p>
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Amount</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {results.violations?.map((v) => (
                <tr key={v.id}>
                  <td>{v.document_id}</td>
                  <td>${v.amount}</td>
                  <td>{v.risk_score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 5: Monitoring Detections
// ─────────────────────────────────────────────────────────────────────────────

export function DetectionMonitor() {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    severity: 'all',
    dateRange: '7days',
  });

  useEffect(() => {
    const loadDetections = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await detectionService.getDetections(filters);
        setDetections(result.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDetections();
    const interval = setInterval(loadDetections, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, [filters]);

  const handleReview = async (detectionId) => {
    try {
      await detectionService.reviewDetection(detectionId, 'reviewed');
      // Refresh detections
      const result = await detectionService.getDetections(filters);
      setDetections(result.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="filters">
        <select
          value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
        >
          <option value="all">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}

      {detections.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {detections.map((d) => (
              <tr key={d.id}>
                <td>{d.document_id}</td>
                <td>{d.type}</td>
                <td>{d.severity}</td>
                <td>{d.date}</td>
                <td>
                  <button onClick={() => handleReview(d.id)}>Mark Reviewed</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 6: Error Handling Best Practices
// ─────────────────────────────────────────────────────────────────────────────

export function BestPractices() {
  // ALWAYS handle errors
  const [error, setError] = useState(null);

  const safeApiCall = async () => {
    try {
      const result = await sapService.testConnection();

      // Check response status
      if (result.status === 'error') {
        setError(result.message);
        return;
      }

      // Process success response
      console.log('Success:', result);
    } catch (err) {
      // Handle network errors
      console.error('Network error:', err);
      setError('Failed to reach backend. Check your connection.');
    }
  };

  // ALWAYS show loading state
  const handleWithLoading = async () => {
    setError(null);
    // setLoading(true); // Set before call
    try {
      // ... API call ...
    } catch (err) {
      setError(err.message);
    }
    // finally { setLoading(false); } // Clear after call
  };

  // ALWAYS cleanup subscriptions
  useEffect(() => {
    let unsubscribe = null;

    const subscribe = async () => {
      unsubscribe = dashboardService.streamRealtimeUpdates(
        (data) => console.log(data),
        (err) => console.error(err)
      );
    };

    subscribe();

    return () => {
      // Cleanup: unsubscribe from stream
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return <div>{error && <p className="error">{error}</p>}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 7: Using apiClient Directly for Custom Requests
// ─────────────────────────────────────────────────────────────────────────────

export function CustomApiCall() {
  const handleCustomCall = async () => {
    try {
      // GET request
      const getResponse = await apiClient.get('/sap/test-sap/');
      console.log('GET response:', getResponse.data);

      // POST request
      const postResponse = await apiClient.post('/sap/rule-agent/', {
        user_input: 'Your request here',
      });
      console.log('POST response:', postResponse.data);

      // Request with params
      const paramsResponse = await apiClient.get('/sap/api/', {
        params: {
          endpoint: '/your/endpoint',
          customParam: 'value',
        },
      });
      console.log('Params response:', paramsResponse.data);

      // Request with headers
      const headersResponse = await apiClient.post(
        '/sap/api/',
        { endpoint: '/endpoint', params: {} },
        {
          headers: {
            'X-Custom-Header': 'value',
          },
        }
      );
      console.log('Headers response:', headersResponse.data);
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
    }
  };

  return <button onClick={handleCustomCall}>Custom API Call</button>;
}

export default {
  ConnectionTest,
  RealtimeDashboard,
  RuleGenerator,
  RuleExecution,
  DetectionMonitor,
  BestPractices,
  CustomApiCall,
};
