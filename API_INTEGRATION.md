# Backend API Integration Guide

## Overview
This document outlines the backend API integration for the AI-powered Smart Scanner frontend.

## Backend Endpoints

### 1. SAP Connection & Real-time Monitoring
- **Test Connection**: `GET /sap/test-sap/`
  - Response: `{ status, message, connection_status }`
  
- **Get Real-time Data**: `GET /sap/realtime/data/`
  - Response: `{ status, data, connection_status }`
  
- **Stream Real-time Updates**: `GET /sap/realtime/stream/` (Server-Sent Events)
  - Returns continuous data stream
  
- **Start Monitoring**: `POST /sap/realtime/start/`
  - Payload: `{ poll_interval: 5 }`
  
- **Stop Monitoring**: `POST /sap/realtime/stop/`

### 2. Generic SAP API
- **Call SAP API**: `GET/POST /sap/api/`
  - GET: `params: { endpoint, ...params }`
  - POST: `body: { endpoint, params }`
  - Response: `{ status, sap_response }`

### 3. Rule Agent (AI Architect)
- **Process Rule Request**: `POST /sap/rule-agent/`
  - Payload: `{ user_input }`
  - Response: `{ status, intent, collected_fields, missing_fields, cds_code, approved, messages }`
  
- **Apply Rule to SAP**: `POST /sap/rule-agent/apply/`
  - Payload: `{ cds_code, rule_name }`
  - Response: `{ status, message, rule_id, sap_response }`
  
- **Execute Rule**: `POST /sap/rule-agent/execute/`
  - Payload: `{ rule_id, filters }`
  - Response: `{ status, ...execution_results }`
  
- **Complete Fraud Detection Flow**: `POST /sap/rule-agent/complete-flow/`
  - Payload: `{ user_input }`
  - Response: Complete fraud detection flow result

## API Client Setup

### Environment Variables
Create a `.env` file in the frontend root:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

### API Client Usage

#### Option 1: Using Service Modules
```javascript
import { sapService } from '../services/sapService';
import { ruleService } from '../services/ruleService';
import { dashboardService } from '../services/dashboardService';

// Test SAP connection
const result = await sapService.testConnection();

// Process rule through AI Agent
const ruleResult = await ruleService.processRuleRequest('Create a fraud detection rule...');

// Get real-time dashboard data
const dashData = await dashboardService.getDashboardData();
```

#### Option 2: Using apiClient Directly
```javascript
import apiClient from '../services/apiClient';

// GET request
const response = await apiClient.get('/sap/test-sap/');

// POST request
const response = await apiClient.post('/sap/rule-agent/', {
  user_input: 'Create a rule...'
});
```

#### Option 3: Server-Sent Events (Real-time Streaming)
```javascript
import { dashboardService } from '../services/dashboardService';

// Subscribe to real-time updates
const unsubscribe = dashboardService.streamRealtimeUpdates(
  (data) => {
    console.log('New data:', data);
    // Update UI
  },
  (error) => {
    console.error('SSE error:', error);
  }
);

// Unsubscribe when component unmounts
return () => unsubscribe();
```

## Feature-Specific Integration

### Dashboard
**Source**: Real-time SAP data via WebSocket/SSE
**Features**:
- Real-time transaction metrics
- Active sessions count
- Alert badge notifications
- Connection status indicator

**Implementation**:
```javascript
useEffect(() => {
  const unsubscribe = dashboardService.streamRealtimeUpdates(setDashboardData);
  return () => unsubscribe();
}, []);
```

### Rule Library (AI Architect)
**Source**: AI Rule Agent API
**Features**:
- Create rules via natural language
- Deploy rules to SAP
- Test rules on SAP data
- Track rule lifecycle (DRAFT → SIMULATION → ACTIVE → DEPLOYED)

**Implementation**:
```javascript
// User inputs natural language requirement
const result = await ruleService.processRuleRequest(userInput);

// System generates CDS code
const cdsCode = result.cds_code;

// Apply to SAP
const deployResult = await ruleService.applyRule(cdsCode, ruleName);

// Execute on data
const execResult = await ruleService.executeRule(deployResult.rule_id, filters);
```

### Detections
**Source**: Rule execution results + Real-time monitoring
**Features**:
- Show real-time fraud detections
- Filter by rule, severity, date range
- Review and mark violations

### Cases Management
**Source**: Aggregated detection + investigation tracking
**Features**:
- Create case from detection
- Track investigation status
- Link related detections

### Security
**Source**: System security audit logs
**Features**:
- User activity monitoring
- Access control audit
- System health status

## Authentication

Currently implemented as mock auth for development.

To integrate with real backend auth:
1. Update `authService.js` to call backend login endpoint
2. Store JWT token returned from backend
3. API client automatically includes token in Authorization header
4. Token invalidation (401 response) redirects to login

```javascript
// Example backend integration:
export const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
      email,
      password,
    });
    const token = response.data.token;
    localStorage.setItem('authToken', token);
    return response.data;
  },
};
```

## CORS Configuration

Backend already has CORS middleware enabled in Django settings.
Frontend requests should work without additional configuration.

## Development Setup

### Backend (Django)
```bash
cd Backend
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000
```

### Frontend (Vite)
```bash
cd AI-powered-smart-scanner
npm install
npm run dev
```

The Vite dev server is configured to proxy `/sap/*` requests to `http://localhost:8000`.

## Error Handling

All API responses follow this structure:
```javascript
{
  status: 'success' | 'error',
  message?: string,
  data?: any,
  error_type?: string,
  ...other_fields
}
```

API Client interceptor handles:
- 401 Unauthorized → Redirect to login
- Network errors → Exception passed to caller
- Timeout → After 30 seconds

## Rate Limiting & Performance

Recommendations:
- Dashboard data: Poll every 5-10 seconds or use SSE
- Rule processing: No limit (async operation)
- Real-time monitoring: Subscribe via SSE, poll fallback every 2-5 seconds
- Cache static rule definitions locally

## Testing Endpoints

### Using curl
```bash
# Test connection
curl http://localhost:8000/sap/test-sap/

# Get real-time data
curl http://localhost:8000/sap/realtime/data/

# Process rule (requires .env with GOOGLE_API_KEY)
curl -X POST http://localhost:8000/sap/rule-agent/ \
  -H "Content-Type: application/json" \
  -d '{"user_input": "Detect duplicate invoices"}'
```

### Using Frontend Services
```javascript
// In browser console or component
import { sapService } from './src/services/sapService';

// Test connection
sapService.testConnection().then(console.log);

// Get real-time data
sapService.getRealtimeData().then(console.log);
```

## Troubleshooting

### 401 Unauthorized
- Check auth token in localStorage
- Verify backend auth endpoint is working
- Check if token is expired

### CORS Errors
- Ensure backend has corsheaders middleware
- Check ALLOWED_HOSTS in Django settings
- Verify frontend URL is not blocked

### Connection Refused
- Verify backend is running: `http://localhost:8000/sap/test-sap/`
- Check firewall rules
- Verify VITE_API_BASE_URL is correct

### No Real-time Data
- Ensure SAP connection is established
- Check if monitoring is started: POST to `/sap/realtime/start/`
- Verify SSE connection is open (check Network tab in DevTools)

## Next Steps

1. Configure environment variables (.env)
2. Start backend Django server
3. Start frontend Vite development server
4. Test each endpoint using provided examples
5. Replace mock auth with backend auth when ready
6. Implement caching layer for frequently accessed data
7. Add request/response logging for debugging
