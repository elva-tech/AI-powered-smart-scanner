/**
 * securitySlice.js
 * FIX 1: toggleUserLock.fulfilled reads action.payload.newStatus (from fixed API)
 *         and updates BOTH sessions[] and users[] so UI reflects immediately.
 * FIX 2: deleteUser.fulfilled removes from BOTH sessions[] and users[].
 * FIX 3: updateUser.fulfilled syncs BOTH arrays.
 * Everything else identical to original.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchSecurityStatsAPI,
  fetchActiveSessionsAPI,
  fetchFailedLoginsAPI,
  fetchUsersAPI,
  createUserAPI,
  updateUserAPI,
  toggleUserLockAPI,
  deleteUserAPI,
} from "./securityAPI";

export { AVAILABLE_ROLES } from "./securityAPI";

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const fetchSecurityStats  = createAsyncThunk("security/fetchStats",    async (_, {rejectWithValue}) => { try { return await fetchSecurityStatsAPI();  } catch(e) { return rejectWithValue(e.message); } });
export const fetchActiveSessions = createAsyncThunk("security/fetchSessions", async (_, {rejectWithValue}) => { try { return await fetchActiveSessionsAPI(); } catch(e) { return rejectWithValue(e.message); } });
export const fetchFailedLogins   = createAsyncThunk("security/fetchFailed",   async (_, {rejectWithValue}) => { try { return await fetchFailedLoginsAPI();   } catch(e) { return rejectWithValue(e.message); } });
export const fetchUsers          = createAsyncThunk("security/fetchUsers",    async (_, {rejectWithValue}) => { try { return await fetchUsersAPI();           } catch(e) { return rejectWithValue(e.message); } });
export const createUser          = createAsyncThunk("security/createUser",    async (payload, {rejectWithValue}) => { try { return await createUserAPI(payload);       } catch(e) { return rejectWithValue(e.message); } });
export const updateUser          = createAsyncThunk("security/updateUser",    async ({id,payload},{rejectWithValue}) => { try { return await updateUserAPI(id,payload); } catch(e) { return rejectWithValue(e.message); } });
export const toggleUserLock      = createAsyncThunk("security/toggleLock",    async ({id},{rejectWithValue}) => { try { return await toggleUserLockAPI(id);            } catch(e) { return rejectWithValue(e.message); } });
export const deleteUser          = createAsyncThunk("security/deleteUser",    async (id,{rejectWithValue}) => { try { return await deleteUserAPI(id);                  } catch(e) { return rejectWithValue(e.message); } });

// ─── Slice ────────────────────────────────────────────────────────────────────
const securitySlice = createSlice({
  name: "security",
  initialState: {
    stats:               { activeSessions:0, failedLogins1h:0, wafBlocked:0, dlpAlerts:0 },
    statsLoading:        false,
    sessions:            [],
    sessionsLoading:     false,
    failedLogins:        [],
    failedLoginsLoading: false,
    users:               [],
    usersLoading:        false,
    usersError:          null,
    actionLoading:       false,
    actionError:         null,
    modalType:           null,
    activeUser:          null,
    search:              "",
    roleFilter:          "All",
    statusFilter:        "All",
  },

  reducers: {
    openModal:       (s,a) => { s.modalType=a.payload.type; s.activeUser=a.payload.user||null; s.actionError=null; },
    closeModal:      (s)   => { s.modalType=null; s.activeUser=null; s.actionError=null; },
    setSearch:       (s,a) => { s.search      =a.payload; },
    setRoleFilter:   (s,a) => { s.roleFilter  =a.payload; },
    setStatusFilter: (s,a) => { s.statusFilter=a.payload; },
  },

  extraReducers: (b) => {
    // fetchSecurityStats
    b.addCase(fetchSecurityStats.pending,   s     => { s.statsLoading=true; });
    b.addCase(fetchSecurityStats.fulfilled, (s,a) => { s.statsLoading=false; s.stats=a.payload; });
    b.addCase(fetchSecurityStats.rejected,  s     => { s.statsLoading=false; });

    // fetchActiveSessions
    b.addCase(fetchActiveSessions.pending,   s     => { s.sessionsLoading=true; });
    b.addCase(fetchActiveSessions.fulfilled, (s,a) => { s.sessionsLoading=false; s.sessions=a.payload; });
    b.addCase(fetchActiveSessions.rejected,  s     => { s.sessionsLoading=false; });

    // fetchFailedLogins
    b.addCase(fetchFailedLogins.pending,   s     => { s.failedLoginsLoading=true; });
    b.addCase(fetchFailedLogins.fulfilled, (s,a) => { s.failedLoginsLoading=false; s.failedLogins=a.payload; });
    b.addCase(fetchFailedLogins.rejected,  s     => { s.failedLoginsLoading=false; });

    // fetchUsers
    b.addCase(fetchUsers.pending,   s     => { s.usersLoading=true; s.usersError=null; });
    b.addCase(fetchUsers.fulfilled, (s,a) => { s.usersLoading=false; s.users=a.payload; });
    b.addCase(fetchUsers.rejected,  (s,a) => { s.usersLoading=false; s.usersError=a.payload; });

    // createUser
    b.addCase(createUser.pending,   s     => { s.actionLoading=true; s.actionError=null; });
    b.addCase(createUser.fulfilled, (s,a) => {
      s.actionLoading=false;
      s.users.unshift({ ...a.payload, name: a.payload.name || a.payload.email });
      s.sessions.unshift(a.payload);
      s.modalType=null; s.activeUser=null;
      s.stats.activeSessions = s.sessions.filter(x=>x.status==="Active").length;
    });
    b.addCase(createUser.rejected,  (s,a) => { s.actionLoading=false; s.actionError=a.payload; });

    // updateUser — sync both arrays
    b.addCase(updateUser.pending,   s     => { s.actionLoading=true; s.actionError=null; });
    b.addCase(updateUser.fulfilled, (s,a) => {
      s.actionLoading=false;
      const { id, ...changes } = a.payload;
      const ui = s.users.findIndex(u=>u.id===id);
      if (ui!==-1) s.users[ui] = { ...s.users[ui], ...changes };
      const si = s.sessions.findIndex(x=>x.id===id);
      if (si!==-1) s.sessions[si] = { ...s.sessions[si], ...changes };
      s.modalType=null; s.activeUser=null;
    });
    b.addCase(updateUser.rejected,  (s,a) => { s.actionLoading=false; s.actionError=a.payload; });

    // ── toggleUserLock: API now returns { id, newStatus } ────────────────────
    b.addCase(toggleUserLock.pending,   s     => { s.actionLoading=true; s.actionError=null; });
    b.addCase(toggleUserLock.fulfilled, (s,a) => {
      s.actionLoading=false;
      const { id, newStatus } = a.payload;
      // Update users[]
      const ui = s.users.findIndex(u=>u.id===id);
      if (ui!==-1) s.users[ui].status = newStatus;
      // Update sessions[]
      const si = s.sessions.findIndex(x=>x.id===id);
      if (si!==-1) s.sessions[si].status = newStatus;
      // Update stats count
      s.stats.activeSessions = s.sessions.filter(x=>x.status==="Active").length;
      s.modalType=null; s.activeUser=null;
    });
    b.addCase(toggleUserLock.rejected,  (s,a) => { s.actionLoading=false; s.actionError=a.payload; });

    // ── deleteUser: remove from both arrays ──────────────────────────────────
    b.addCase(deleteUser.pending,   s     => { s.actionLoading=true; s.actionError=null; });
    b.addCase(deleteUser.fulfilled, (s,a) => {
      s.actionLoading=false;
      const id = a.payload;
      s.users    = s.users.filter(u=>u.id!==id);
      s.sessions = s.sessions.filter(x=>x.id!==id);
      s.stats.activeSessions = s.sessions.filter(x=>x.status==="Active").length;
      s.modalType=null; s.activeUser=null;
    });
    b.addCase(deleteUser.rejected,  (s,a) => { s.actionLoading=false; s.actionError=a.payload; });
  },
});

export const { openModal, closeModal, setSearch, setRoleFilter, setStatusFilter } = securitySlice.actions;

export const selectFilteredUsers = (s) => {
  const { users, search, roleFilter, statusFilter } = s.security;
  const q = search.toLowerCase();
  return users.filter(u => {
    const ms = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const rs = roleFilter==="All"   || u.role===roleFilter;
    const ss = statusFilter==="All" || u.status===statusFilter;
    return ms && rs && ss;
  });
};

export default securitySlice.reducer;