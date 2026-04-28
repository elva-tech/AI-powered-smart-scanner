# Backend API Integration - Complete Setup

## 📌 Overview

Your **frontend is now fully configured to integrate with the Django backend**. All API infrastructure, services, documentation, and examples have been created and are ready to use.

### What's Been Done ✅

- ✅ **API Client** - Axios configuration with interceptors, error handling
- ✅ **Service Layer** - 6 service modules for different features
- ✅ **Environment Config** - .env support for API configuration
- ✅ **Vite Proxy** - Dev server API proxy to backend
- ✅ **Documentation** - 3 comprehensive guides (API_INTEGRATION.md, QUICK_START.md, INTEGRATION_SUMMARY.md)
- ✅ **Code Examples** - 7 practical examples in APIIntegrationExamples.jsx
- ✅ **Redux Patterns** - Complete guide for Redux integration in ReduxPatterns.jsx
- ✅ **Backend API File** - Alternative rulesBackendAPI.js for gradual migration

---

## 🚀 Quick Start (Do This First!)

### 1️⃣ Create .env File

In `AI-powered-smart-scanner/` folder, create `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

### 2️⃣ Start Backend

```bash
cd Backend
python manage.py runserver 0.0.0.0:8000
```

✓ You should see: `Starting development server at http://127.0.0.1:8000/`

### 3️⃣ Start Frontend

```bash
cd AI-powered-smart-scanner
npm install  # if not done
npm run dev
```

✓ You should see: `Local: http://localhost:5173/`

### 4️⃣ Test Connection

In browser console at `http://localhost:5173/`:

```javascript
import { sapService } from './src/services/sapService.js'
sapService.testConnection().then(console.log)
```

✓ Should return: `{ status: 'connected', badge: 5, notifications: 3 }`

---

## 📂 File Structure

```
AI-powered-smart-scanner/
├── src/
│   ├── services/              ← API Service Layer (NEW)
│   │   ├── apiClient.js              ← Core HTTP client
│   │   ├── authService.js            ← Auth handling
│   │   ├── sapService.js             ← SAP connections
│   │   ├── ruleService.js            ← Rule Agent API
│   │   ├── dashboardService.js       ← Dashboard & streaming
│   │   └── detectionService.js       ← Detections
│   │
│   ├── components/examples/   ← Examples (NEW)
│   │   ├── APIIntegrationExamples.jsx  ← 7 code examples
│   │   └── ReduxPatterns.jsx           ← Redux integration guide
│   │
│   ├── features/
│   │   ├── auth/authAPI.js (UPDATED)   ← Now uses authService
│   │   ├── rules/
│   │   │   ├── rulesAPI.js             ← Mock data (unchanged)
│   │   │   └── rulesBackendAPI.js (NEW) ← Backend integration
│   │   └── ...
│   │
│   └── ... (rest of frontend)
│
├── .env (CREATE THIS)
├── .env.example (NEW)
│
├── vite.config.js (UPDATED) ← Added API proxy
│
├── API_INTEGRATION.md (NEW) ← Full API reference
├── QUICK_START.md (NEW) ← 5-step setup guide
├── INTEGRATION_SUMMARY.md (NEW) ← Summary of changes
└── README.md (this file)
```

---

## 🔗 Available Services

### sapService
```javascript
import { sapService } from '../services/sapService';

// Test connection
sapService.testConnection()

// Get real-time data
sapService.getRealtimeData()

// Start/stop monitoring
sapService.startMonitoring(pollInterval)
sapService.stopMonitoring()

// Generic API call
sapService.callAPI(endpoint, params, 'GET/POST')
```

### ruleService
```javascript
import { ruleService } from '../services/ruleService';

// AI rule generation
ruleService.processRuleRequest(userInput)

// Deploy to SAP
ruleService.applyRule(cdsCode, ruleName)

// Execute on data
ruleService.executeRule(ruleId, filters)

// End-to-end flow
ruleService.completeFraudFlow(userInput)
```

### dashboardService
```javascript
import { dashboardService } from '../services/dashboardService';

// One-time fetch
dashboardService.getDashboardData()

// Real-time streaming (SSE)
const unsubscribe = dashboardService.streamRealtimeUpdates(
  (data) => console.log(data),
  (error) => console.error(error)
);

// Connection status
dashboardService.getConnectionStatus()
```

### detectionService
```javascript
import { detectionService } from '../services/detectionService';

// Get detections
detectionService.getDetections(filters)

// Get stats
detectionService.getDetectionStats()

// Mark reviewed
detectionService.reviewDetection(detectionId, status)
```

### authService
```javascript
import { authService } from '../services/authService';

// Login
authService.login(email, password)

// Logout
authService.logout()

// Get current user
authService.getCurrentUser()
```

---

## 📖 Documentation

### For Complete API Reference
👉 Read: **[API_INTEGRATION.md](./API_INTEGRATION.md)**
- All endpoint details
- Response formats
- Error handling
- CORS configuration
- Testing examples

### For Quick Setup & Troubleshooting
👉 Read: **[QUICK_START.md](./QUICK_START.md)**
- 5-step quick start
- Testing commands (curl/fetch)
- Feature integration status
- Common issues & solutions

### For Integration Details
👉 Read: **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)**
- Files created/modified
- Architecture overview
- How to use in components & Redux
- Configuration details
- Performance tips

---

## 💡 Usage Examples

### Example 1: Using Services in Component

```javascript
import { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = dashboardService.streamRealtimeUpdates(
      (newData) => setData(newData),
      (err) => setError(err.message)
    );

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {data && <div>Badge: {data.badge}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### Example 2: Using in Redux Slice

```javascript
import { createAsyncThunk } from '@reduxjs/toolkit';
import { ruleService } from '../services/ruleService';

export const processRule = createAsyncThunk(
  'rules/process',
  async (userInput, { rejectWithValue }) => {
    try {
      const result = await ruleService.processRuleRequest(userInput);
      if (result.status === 'error') return rejectWithValue(result.message);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### Example 3: Error Handling

```javascript
import apiClient from '../services/apiClient';

try {
  const response = await apiClient.post('/sap/rule-agent/', {
    user_input: userInput
  });
  console.log('Success:', response.data);
} catch (error) {
  if (error.response?.status === 401) {
    console.log('Unauthorized - redirect to login');
  } else if (error.response?.status === 500) {
    console.log('Server error:', error.response.data.message);
  } else {
    console.log('Network error:', error.message);
  }
}
```

### Example 4: Real-time Monitoring

```javascript
import { sapService } from '../services/sapService';

useEffect(() => {
  // Start monitoring
  sapService.startMonitoring(5); // 5 second poll interval

  // Schedule a cleanup
  return async () => {
    await sapService.stopMonitoring();
  };
}, []);
```

---

## ✅ Testing Checklist

### Before Integration:
- [ ] Backend running: `http://localhost:8000/sap/test-sap/` returns 200
- [ ] .env file created with API_BASE_URL
- [ ] Frontend running: `http://localhost:5173/`
- [ ] No CORS errors in browser console

### Test Each Endpoint:
- [ ] SAP Connection: `sapService.testConnection()`
- [ ] Real-time Data: `dashboard.getDashboardData()`
- [ ] Monitoring: `sapService.startMonitoring()`
- [ ] Rule Processing: `ruleService.processRuleRequest('test')`
- [ ] Real-time Streaming: Subscribe and check updates

### Component Integration:
- [ ] Dashboard shows real-time data
- [ ] Rule creation modal works
- [ ] Detections list updates
- [ ] Error messages display properly

---

## 🐛 Troubleshooting

### Problem: Cannot connect to backend
```
Error: Cannot reach http://localhost:8000
```
**Solution:**
1. Check backend is running: `python manage.py runserver 0.0.0.0:8000`
2. Check port 8000 is open: `netstat -an | grep 8000`
3. Verify VITE_API_BASE_URL in .env

### Problem: CORS errors
```
Error: No 'Access-Control-Allow-Origin' header
```
**Solution:**
- CORS should already be enabled in Django
- Check if `corsheaders` is in INSTALLED_APPS
- Check CorsMiddleware is in MIDDLEWARE

### Problem: 401 Unauthorized
```
401 Unauthorized error when calling API
```
**Solution:**
1. Check localStorage has authToken: `localStorage.getItem('authToken')`
2. Try logging in again
3. Check if token is expired

### Problem: Real-time data not updating
```
Dashboard shows data once but doesn't update
```
**Solution:**
1. Ensure monitoring is started: `sapService.startMonitoring()`
2. Check browser console for SSE errors
3. Check Network tab for continuous stream connection

See full troubleshooting in **QUICK_START.md**

---

## 🎯 Next Steps

### Phase 2: Integrate Components (DO THIS)
1. Update `Dashboard.jsx` to use `dashboardService.streamRealtimeUpdates()`
2. Update `RuleLibrary.jsx` to use `ruleService.processRuleRequest()`
3. Update Redux slices to dispatch thunks using services
4. Add loading spinners and error boundaries

### Phase 3: Test End-to-End
1. Test rule creation through AI Agent
2. Test rule deployment to SAP
3. Test real-time detections
4. Test case management workflow

### Phase 4: Optimize Performance
1. Implement request caching
2. Add pagination for large lists
3. Optimize SSE reconnection
4. Monitor API response times

---

## 📊 Backend Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/sap/test-sap/` | GET | Test SAP connection |
| `/sap/realtime/data/` | GET | Get current real-time data |
| `/sap/realtime/stream/` | GET | SSE stream of updates |
| `/sap/realtime/start/` | POST | Start monitoring |
| `/sap/realtime/stop/` | POST | Stop monitoring |
| `/sap/api/` | GET/POST | Generic SAP API |
| `/sap/rule-agent/` | POST | Process rule request |
| `/sap/rule-agent/apply/` | POST | Apply rule to SAP |
| `/sap/rule-agent/execute/` | POST | Execute rule on data |
| `/sap/rule-agent/complete-flow/` | POST | Full fraud detection flow |

---

## 🔒 Security Notes

1. **Token Storage**: Currently using localStorage (not ideal for production)
2. **CORS**: Already enabled for localhost development
3. **HTTPS**: Use in production (requires SSL certificate)
4. **Token Refresh**: Not yet implemented (add refresh token rotation)
5. **Rate Limiting**: Not yet implemented (add backend rate limits)

---

## 📞 Support

### Check These First:
1. **API Connection**: `curl http://localhost:8000/sap/test-sap/`
2. **Browser Console**: Open DevTools → Console for JavaScript errors
3. **Network Tab**: Check actual API requests and responses
4. **Backend Logs**: Watch terminal where Django is running
5. **Documentation**: Read the provided guides above

### Debug Commands:
```javascript
// In browser console:
import { sapService } from './src/services/sapService.js'
sapService.testConnection().then(r => console.log(r))

// Check stored token:
localStorage.getItem('authToken')

// Check environment:
console.log(import.meta.env.VITE_API_BASE_URL)
```

---

## 📚 Learning Resources

- [API_INTEGRATION.md](./API_INTEGRATION.md) - Full API documentation
- [QUICK_START.md](./QUICK_START.md) - Setup & testing guide
- [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) - Architecture & patterns
- [APIIntegrationExamples.jsx](./src/components/examples/APIIntegrationExamples.jsx) - 7 code examples
- [ReduxPatterns.jsx](./src/components/examples/ReduxPatterns.jsx) - Redux integration guide

---

## ✨ Key Features Integrated

### ✅ Available Now
- Real-time SAP monitoring (SSE streaming)
- SAP connection testing
- Rule Agent (AI Architect) API
- Generic SAP API calls
- Real-time dashboard data
- Detection monitoring

### ⏳ Ready to Integrate
- Dashboard with live metrics
- Rule Library with AI generation
- Case Management
- Detection Review
- Security Audit Logs

### 📋 Future Enhancements
- Request caching
- Offline mode
- Request retry logic
- Performance optimization
- Advanced error recovery

---

## 🎓 Architecture

```
┌─────────────────────────────────────────┐
│         React Frontend                   │
│       (Components & Redux)               │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│     API Service Layer (6 modules)       │
│  ├─ apiClient.js (Axios config)         │
│  ├─ authService.js                      │
│  ├─ sapService.js                       │
│  ├─ ruleService.js                      │
│  ├─ dashboardService.js                 │
│  └─ detectionService.js                 │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│    Django Backend (port 8000)            │
│  ├─ /sap/test-sap/                       │
│  ├─ /sap/realtime/*                      │
│  ├─ /sap/api/                            │
│  ├─ /sap/rule-agent/                     │
│  └─ ... more endpoints                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
            SAP System
```

---

## 📝 Summary

✅ **All infrastructure is in place and ready to use!**

1. Create `.env` file
2. Start backend on port 8000
3. Start frontend dev server
4. Test connection with example commands
5. Review examples and integrate into components

**Next: Follow the integration examples and update your components to use the services!**

---

**Created:** April 21, 2026  
**Status:** ✅ Ready for integration  
**Last Updated:** April 21, 2026
