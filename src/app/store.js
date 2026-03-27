import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import rulesReducer from "../features/rules/rulesSlice";
import securityReducer from "../features/security/securitySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    rules: rulesReducer,
    security: securityReducer,
  },
});

