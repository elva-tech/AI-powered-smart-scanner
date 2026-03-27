export const AVAILABLE_ROLES = [
  "Admin",
  "Analyst",
  "Investigator",
  "Manager",
  "Task Processor",
];

let sessions = [
  { id: 1, email: "admin@corp.com", role: "Admin", ip: "10.0.1.45", loginTime: "14:23", status: "Active" },
  { id: 2, email: "m.johnson@corp.com", role: "Investigator", ip: "10.0.1.89", loginTime: "09:30", status: "Active" },
  { id: 3, email: "r.chen@corp.com", role: "Investigator", ip: "10.0.1.92", loginTime: "08:45", status: "Active" },
  { id: 4, email: "s.williams@corp.com", role: "Investigator", ip: "10.0.1.93", loginTime: "09:00", status: "Active" },
  { id: 5, email: "task.processor@corp.com", role: "Task Processor", ip: "10.0.1.91", loginTime: "07:00", status: "Active" },
];

let failedLogins = [
  { id: 1, email: "unknown@test.com", ip: "192.168.1.1", attempts: 5, lastAttempt: "14:20", blocked: true },
  { id: 2, email: "admin@test.com", ip: "192.168.1.2", attempts: 3, lastAttempt: "13:45", blocked: false },
];

const delay = (data) => new Promise((res) => setTimeout(() => res(data), 200));

// ✅ NAME FORMATTER
const formatName = (email) =>
  email
    .split("@")[0]
    .split(".")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

// STATS
export const getStats = () =>
  delay({
    activeSessions: sessions.filter(s => s.status === "Active").length,
    failedLogins1h: failedLogins.length,
    wafBlocked: 12,
    dlpAlerts: 0,
  });

export const getSessions = () => delay([...sessions]);
export const getFailedLogins = () => delay([...failedLogins]);

// ✅ NORMALIZED USERS
export const getUsers = () =>
  delay(
    sessions.map((s) => ({
      ...s,
      name: formatName(s.email),
      lastLogin: s.loginTime,
    }))
  );

// ✅ LOCK / UNLOCK
export const toggleUserLockAPI = (id) => {
  sessions = sessions.map(s =>
    s.id === id
      ? { ...s, status: s.status === "Active" ? "Locked" : "Active" }
      : s
  );
  return delay(id);
};

// ✅ DELETE
export const deleteUserAPI = (id) => {
  sessions = sessions.filter(s => s.id !== id);
  return delay(id);
};

// ✅ UPDATE
export const updateUserAPI = (id, payload) => {
  sessions = sessions.map(s =>
    s.id === id ? { ...s, ...payload } : s
  );
  return delay({ id, ...payload });
};