/**
 * dashboardSlice.js — stub to fix 404 import error.
 * Dashboard data is fetched directly in Dashboard.jsx component (no Redux needed).
 * If something in your app imports from this file, it gets an empty reducer.
 * Delete the import that references this file when you find it.
 */
import { createSlice } from "@reduxjs/toolkit";

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {},
  reducers: {},
});

export default dashboardSlice.reducer;