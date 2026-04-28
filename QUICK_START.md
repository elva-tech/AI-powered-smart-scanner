# SAP Integration Backend API - Quick Start Guide

## 📋 Prerequisites

- Backend running on `http://localhost:8000`
- Frontend in `AI-powered-smart-scanner/`
- Node.js and npm installed
- Python backend with Django running

## 🚀 Quick Start (5 steps)

### Step 1: Configure Environment Variables

Create `.env` file in the frontend root directory:

```bash
cd AI-powered-smart-scanner
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
EOF
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

(axios should already be in package.json)

### Step 3: Start Backend

```bash
cd Backend
python manage.py runserver 0.0.0.0:8000
```

Expected output:
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

### Step 4: Verify Backend Connection

Test in browser console:

```javascript
fetch('http://localhost:8000/sap/test-sap/')
  .then(r => r.json())
  .then(console.log)
```

Or use curl:
```bash
curl http://localhost:8000/sap/test-sap/
```

### Step 5: Start Frontend Dev Server

```bash
cd AI-powered-smart-scanner
npm run dev
```

Expected output:
```
VITE v8.0.1  ready in 456 ms

➜  Local:   http://localhost:5173/
```

---

## 📡 API Service Usage

### Option A: Using Pre-built Service Methods (Recommended)

#### In Component:
```javascript
import { sapService } from '../services/sapService';
import { ruleService } from '../services/ruleService';
import { dashboardService } from '../services/dashboardService';

export function MyComponent() {
  useEffect(() => {
    // Test SAP connection
    sapService.testConnection().then(data => {
      console.log('Connection:', data);
    });

    // Get real-time data
    dashboardService.getDashboardData().then(data => {
      setDashboard(data);
    });
  }, []);
}
```

### Option B: Using apiClient Directly

```javascript
import apiClient from '../services/apiClient';

async function processRule(userInput) {
  const response = await apiClient.post('/sap/rule-agent/', {
    user_input: userInput
  });
  return response.data;
}
```

### Option C: Real-time Streaming

```javascript
import { dashboardService } from '../services/dashboardService';

useEffect(() => {
  // Subscribe to real-time updates (Server-Sent Events)
  const unsubscribe = dashboardService.streamRealtimeUpdates(
    (data) => {
      console.log('New real-time data:', data);
      setRealtimeData(data);
    },
    (error) => {
      console.error('Connection error:', error);
    }
  );

  // Cleanup on unmount
  return () => unsubscribe();
}, []);
```

---

## ✅ Testing the Integration

### Test 1: SAP Connection Status

**Using curl:**
```bash
curl http://localhost:8000/sap/test-sap/
```

**Expected response:**
```json
{
  "status": "connected",
  "message": "Connected to SAP successfully",
  "badge": 5,
  "notifications": 3
}
```

### Test 2: Real-time Dashboard Data

**Using fetch (browser console):**
```javascript
fetch('http://localhost:8000/sap/realtime/data/')
  .then(r => r.json())
  .then(console.log)
```

**Expected response:**
```json
{
  "status": "success",
  "data": {
    "status": "connected",
    "badge": 5,
    "notifications": 3
  },
  "connection_status": "connected"
}
```

### Test 3: Process Rule through AI Agent

**Using fetch (browser console):**
```javascript
fetch('http://localhost:8000/sap/rule-agent/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_input: 'Create a rule to detect duplicate invoices'
  })
})
  .then(r => r.json())
  .then(console.log)
```

**Expected response:**
```json
{
  "status": "success",
  "intent": "create_rule",
  "collected_fields": { "fraud_type": "duplicate_invoice" },
  "cds_code": "DEFINE VIEW ...",
  "approved": true,
  "messages": [...]
}
```

### Test 4: Start Real-time Monitoring

```bash
curl -X POST http://localhost:8000/sap/realtime/start/ \
  -H "Content-Type: application/json" \
  -d '{"poll_interval": 5}'
```

### Test 5: Stream Real-time Updates (SSE)

```bash
curl http://localhost:8000/sap/realtime/stream/
```

(Should show continuous data stream - press Ctrl-C to stop)

---

## 🔄 Integration Checklist

- [ ] Backend running at `http://localhost:8000`
- [ ] `.env` file configured in frontend root
- [ ] `npm install` completed
- [ ] SAP connection test passes
- [ ] Real-time data endpoint responds
- [ ] Rule Agent API working (needs GOOGLE_API_KEY)
- [ ] Frontend dev server running at `http://localhost:5173`
- [ ] Can see Dashboard with real-time updates
- [ ] Can access Rule Library and create rules
- [ ] Can view detections and cases

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'services/apiClient'"

**Solution:**
```bash
# Make sure you're importing from correct path
import apiClient from '../services/apiClient';  // ✓ Correct
import apiClient from './apiClient';             // ✗ Wrong
```

### Issue: "Network error: Cannot reach backend"

**Check:**
1. Backend running? `curl http://localhost:8000/sap/test-sap/`
2. Correct URL in .env? (should be `http://localhost:8000`)
3. CORS enabled? (should be in Django settings)
4. Firewall blocking? Open port 8000

### Issue: "401 Unauthorized"

**Solution:**
1. Check if auth token is in localStorage
2. Token might be expired - log out and log back in
3. Backend might have changed auth pattern

### Issue: "Real-time data not updating"

**Check:**
1. Is monitoring started? `POST /sap/realtime/start/`
2. Is SSE connection open? Check browser Network tab
3. Try manually calling `/sap/realtime/data/`

### Issue: "Rule Agent returns error"

**Make sure:**
1. `GOOGLE_API_KEY` is set in backend .env
2. Backend can access Google APIs (check firewall)
3. User input is not empty

---

## 📊 Feature-by-Feature Integration Status

| Feature | Backend API | Frontend | Status |
|---------|-----------|----------|--------|
| Dashboard (Real-time Data) | ✅ Ready | ✅ Ready | 🟢 Connected |
| SAP Connection Test | ✅ Ready | ✅ Ready | 🟢 Connected |
| Real-time Monitoring | ✅ Ready | ✅ Ready | 🟢 Connected |
| Rule Agent (AI Architect) | ✅ Ready | ✅ Ready | 🟢 Connected |
| Apply Rule to SAP | ✅ Ready | ⏳ Ready | 🟡 Needs Testing |
| Execute Rule | ✅ Ready | ⏳ Ready | 🟡 Needs Testing |
| Case Management | ⏳ Backend | ⏳ Frontend | 🟡 In Progress |
| Detections Listing | ⏳ Backend | ⏳ Frontend | 🟡 In Progress |
| Security Audit | ⏳ Backend | ⏳ Frontend | 🟡 In Progress |

---

## 🔧 Next Steps

1. **Test all endpoints** using the curl/fetch examples above
2. **Integrate Dashboard** - use `dashboardService.streamRealtimeUpdates()`
3. **Integrate Rule Library** - use `ruleService.processRuleRequest()`
4. **Add error handling** - catch and display API errors to user
5. **Implement caching** - cache static data to reduce API calls
6. **Add loading states** - show spinners during API calls
7. **Implement pagination** - for large data sets
8. **Add logging** - log all API calls for debugging

---

## 📚 Additional Resources

- [API Integration Documentation](./API_INTEGRATION.md)
- [Example API Services](./src/services/)
- [Backend Django Settings](../Backend/sap_integration/settings.py)
- [Backend URLs Configuration](../Backend/sap/urls.py)

---

## 💡 Tips

- Use browser DevTools Network tab to see all API calls
- Check browser Console for JavaScript errors
- Use backend logs: `django-admin showmigrations` for DB issues
- Test with mock data first, then switch to backend

---

## 🆘 Need Help?

1. Check logs in both frontend (DevTools Console) and backend (terminal)
2. Verify environment variables are correct
3. Test endpoints with curl/Postman before integrating to frontend
4. Check API response format matches expectations in code
