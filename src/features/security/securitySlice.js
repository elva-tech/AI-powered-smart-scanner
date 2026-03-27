import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as mock from "./securityAPI";

/* ─────────────────────────────────────────────
   THUNKS (ALL DATA COMES FROM API LAYER)
   ───────────────────────────────────────────── */

// FETCH
export const fetchSecurityStats = createAsyncThunk(
  "security/stats",
  async () => await mock.getStats()
);

export const fetchActiveSessions = createAsyncThunk(
  "security/sessions",
  async () => await mock.getSessions()
);

export const fetchFailedLogins = createAsyncThunk(
  "security/failed",
  async () => await mock.getFailedLogins()
);

export const fetchUsers = createAsyncThunk(
  "security/users",
  async () => await mock.getUsers()
);

// CREATE
export const createUser = createAsyncThunk(
  "security/createUser",
  async (data) => {
    return {
      id: Date.now(),
      ...data,
      status: "Active",
      ip: "10.0.1." + Math.floor(Math.random() * 100),
      loginTime: "Now",
    };
  }
);

// UPDATE
export const updateUser = createAsyncThunk(
  "security/updateUser",
  async ({ id, payload }) => await mock.updateUserAPI(id, payload)
);

// DELETE
export const deleteUser = createAsyncThunk(
  "security/deleteUser",
  async (id) => await mock.deleteUserAPI(id)
);

// LOCK / UNLOCK
export const toggleUserLock = createAsyncThunk(
  "security/toggleLock",
  async ({ id }) => await mock.toggleUserLockAPI(id)
);

/* ─────────────────────────────────────────────
   SELECTOR (NO CHANGE — SAFE)
   ───────────────────────────────────────────── */

export const selectFilteredUsers = (state) => {
  const { users = [], search = "", roleFilter = "All", statusFilter = "All" } = state.security;

  return users.filter((u) => {
    const s = search.toLowerCase();

    const matchSearch =
      u?.name?.toLowerCase().includes(s) ||
      u?.email?.toLowerCase().includes(s);

    const matchRole = roleFilter === "All" || u.role === roleFilter;
    const matchStatus = statusFilter === "All" || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });
};

/* ─────────────────────────────────────────────
   SLICE
   ───────────────────────────────────────────── */

const securitySlice = createSlice({
  name: "security",
  initialState: {
    stats: {},
    sessions: [],
    failedLogins: [],
    users: [],
    statsLoading: false,
    sessionsLoading: false,
    failedLoginsLoading: false,
    usersLoading: false,
    modalType: null,
    activeUser: null,
    search: "",
    roleFilter: "All",
    statusFilter: "All",
  },

  reducers: {
    openModal: (s, a) => {
      s.modalType = a.payload.type;
      s.activeUser = a.payload.user || null;
    },
    closeModal: (s) => {
      s.modalType = null;
      s.activeUser = null;
    },
    setSearch: (s, a) => { s.search = a.payload; },
    setRoleFilter: (s, a) => { s.roleFilter = a.payload; },
    setStatusFilter: (s, a) => { s.statusFilter = a.payload; },
  },

  extraReducers: (b) => {
    b
      /* ───── FETCH ───── */
      .addCase(fetchSecurityStats.fulfilled, (s, a) => {
        s.stats = a.payload;
      })

      .addCase(fetchActiveSessions.fulfilled, (s, a) => {
        s.sessions = a.payload;
      })

      .addCase(fetchFailedLogins.fulfilled, (s, a) => {
        s.failedLogins = a.payload;
      })

      .addCase(fetchUsers.fulfilled, (s, a) => {
        s.users = a.payload;
      })

      /* ───── CREATE ───── */
      .addCase(createUser.fulfilled, (s, a) => {
        s.sessions.push(a.payload);
        s.users.push({
          ...a.payload,
          name: a.payload.name || "New User",
          lastLogin: a.payload.loginTime,
        });
        s.modalType = null;
      })

      /* ───── UPDATE ───── */
      .addCase(updateUser.fulfilled, (s, a) => {
        const { id } = a.payload;

        const i = s.sessions.findIndex(x => x.id === id);
        if (i !== -1) {
          s.sessions[i] = { ...s.sessions[i], ...a.payload };
        }

        const j = s.users.findIndex(x => x.id === id);
        if (j !== -1) {
          s.users[j] = { ...s.users[j], ...a.payload };
        }

        s.modalType = null;
      })

      /* ───── DELETE ───── */
      .addCase(deleteUser.fulfilled, (s, a) => {
        s.sessions = s.sessions.filter(x => x.id !== a.payload);
        s.users    = s.users.filter(x => x.id !== a.payload);
        s.modalType = null;

        // update stats
        s.stats.activeSessions = s.sessions.filter(x => x.status === "Active").length;
      })

      /* ───── LOCK / UNLOCK ───── */
      .addCase(toggleUserLock.fulfilled, (s, a) => {
        const id = a.payload;

        const sess = s.sessions.find(x => x.id === id);
        if (sess) {
          sess.status = sess.status === "Active" ? "Locked" : "Active";
        }

        const user = s.users.find(x => x.id === id);
        if (user) {
          user.status = user.status === "Active" ? "Locked" : "Active";
        }

        // update stats
        s.stats.activeSessions = s.sessions.filter(x => x.status === "Active").length;
      });
  },
});

export const {
  openModal,
  closeModal,
  setSearch,
  setRoleFilter,
  setStatusFilter,
} = securitySlice.actions;

export default securitySlice.reducer;