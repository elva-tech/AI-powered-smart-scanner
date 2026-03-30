/**
 * securityAPI.js
 * FIX: toggleUserLockAPI now returns { id, newStatus } — slice needs newStatus to update state.
 * FIX: deleteUserAPI returns id directly (was already correct).
 * All mutations applied to module-level `sessions` array so they persist across calls.
 */

/**
 * securityAPI.js
 * UPDATED: Added localStorage persistence for sessions
 */

export const AVAILABLE_ROLES = [
  "Admin",
  "Analyst",
  "Investigator",
  "Manager",
  "Task Processor",
];

// ✅ LOAD FROM LOCAL STORAGE (fallback to default)
let sessions = JSON.parse(localStorage.getItem("sessions")) || [
  { id:1, email:"admin@corp.com",          role:"Admin",          ip:"10.0.1.45", loginTime:"14:23", status:"Active" },
  { id:2, email:"m.johnson@corp.com",      role:"Investigator",   ip:"10.0.1.89", loginTime:"09:30", status:"Active" },
  { id:3, email:"r.chen@corp.com",         role:"Investigator",   ip:"10.0.1.92", loginTime:"08:45", status:"Active" },
  { id:4, email:"s.williams@corp.com",     role:"Investigator",   ip:"10.0.1.93", loginTime:"09:00", status:"Active" },
  { id:5, email:"task.processor@corp.com", role:"Task Processor", ip:"10.0.1.91", loginTime:"07:00", status:"Active" },
];

let failedLogins = [
  { id:1, email:"unknown@test.com", ip:"192.168.1.1", attempts:5, lastAttempt:"14:20", blocked:true  },
  { id:2, email:"admin@test.com",   ip:"192.168.1.2", attempts:3, lastAttempt:"13:45", blocked:false },
];

const delay = (data) => new Promise(res => setTimeout(() => res(data), 200));

const formatName = (email) =>
  email.split("@")[0].split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

export const fetchSecurityStatsAPI = () =>
  delay({
    activeSessions: sessions.filter(s => s.status === "Active").length,
    failedLogins1h: failedLogins.length,
    wafBlocked:     127,
    dlpAlerts:      0,
  });

export const fetchActiveSessionsAPI = () => delay([...sessions]);

export const fetchFailedLoginsAPI = () => delay([...failedLogins]);

export const fetchUsersAPI = () =>
  delay(sessions.map(s => ({ ...s, name: formatName(s.email), lastLogin: s.loginTime })));

// ── toggle lock ──
export const toggleUserLockAPI = (id) => {
  const session = sessions.find(s => s.id === id);
  if (!session) return delay({ id, newStatus: "Active" });

  const newStatus = session.status === "Active" ? "Locked" : "Active";

  sessions = sessions.map(s =>
    s.id === id ? { ...s, status: newStatus } : s
  );

  // ✅ SAVE
  localStorage.setItem("sessions", JSON.stringify(sessions));

  return delay({ id, newStatus });
};

// ── delete ──
export const deleteUserAPI = (id) => {
  sessions = sessions.filter(s => s.id !== id);

  // ✅ SAVE
  localStorage.setItem("sessions", JSON.stringify(sessions));

  return delay(id);
};

// ── update ──
export const updateUserAPI = (id, payload) => {
  sessions = sessions.map(s =>
    s.id === id ? { ...s, ...payload } : s
  );

  // ✅ SAVE
  localStorage.setItem("sessions", JSON.stringify(sessions));

  return delay({ id, ...payload });
};

// ── create ──
export const createUserAPI = (payload) => {
  const newUser = {
    id:        Date.now(),
    email:     payload.email,
    role:      payload.role,
    ip:        "10.0.0.0",
    loginTime: "--:--",
    status:    "Active",
    name:      payload.name,
    lastLogin: "--:--",
  };

  sessions = [newUser, ...sessions];

  // ✅ SAVE
  localStorage.setItem("sessions", JSON.stringify(sessions));

  return delay(newUser);
};