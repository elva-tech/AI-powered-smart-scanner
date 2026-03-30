/**
 * Security.jsx — Security & Access Console.
 * Route: /security
 *
 * Pixel-perfect match to Figma screenshots:
 *  • Header: "Security & Access Console" + subtitle + "Create New User" button (top right)
 *  • 4 stats cards: Active Sessions, Failed Logins (1H), WAF Blocked, DLP Alerts — each with icon + color
 *  • "Active Sessions" table: USER | ROLE | IP ADDRESS | LOGIN TIME | STATUS | ACTIONS (lock + trash)
 *  • "Failed Login Attempts" table: USER | IP ADDRESS | ATTEMPTS ↑↓ | LAST ATTEMPT | BLOCKED
 *  • "Create New User" modal: Full Name, Email Address, Role (dropdown), Password (hidden, linked to email)
 *  • Full Redux — securitySlice + securityAPI
 */

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/layout/Sidebar";
import Topbar  from "../components/layout/Topbar";
import {
  fetchSecurityStats,
  fetchActiveSessions,
  fetchFailedLogins,
  fetchUsers,
  createUser,
  updateUser,
  toggleUserLock,
  deleteUser,
  setSearch, setRoleFilter, setStatusFilter,
  openModal, closeModal,
  selectFilteredUsers,
} from "../features/security/securitySlice";
import { AVAILABLE_ROLES } from "../features/security/securityAPI";
import {
  ShieldCheck, LockSimple, Warning, Bell,
  UserPlus, PencilSimple, LockSimpleOpen, Trash,
  X, Eye, EyeSlash, CircleNotch, CaretUp, CaretDown,
  MagnifyingGlass, CheckCircle,
} from "@phosphor-icons/react";

// ─── Role badge config ─────────────────────────────────────────────────────────
const ROLE_STYLE = {
  Admin:          "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  Analyst:        "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  Investigator:   "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  Manager:        "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  "Task Processor":"bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
};

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium ${ROLE_STYLE[role] || "bg-gray-500/20 text-gray-400"}`}>
      {role}
    </span>
  );
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────
function StatsCards() {
  const { stats, statsLoading } = useSelector((s) => s.security);

  const cards = [
    {
      key:   "activeSessions",
      label: "ACTIVE SESSIONS",
      value: stats.activeSessions,
      icon:  <ShieldCheck size={15} weight="fill" className="text-emerald-400" />,
      iconBg:"bg-emerald-500/15 border border-emerald-500/25",
      valueColor: "text-[var(--text)]",
    },
    {
      key:   "failedLogins1h",
      label: "FAILED LOGINS (1H)",
      value: stats.failedLogins1h,
      icon:  <LockSimple size={15} weight="fill" className="text-red-400" />,
      iconBg:"bg-red-500/15 border border-red-500/25",
      valueColor: "text-red-400",
    },
    {
      key:   "wafBlocked",
      label: "WAF BLOCKED",
      value: stats.wafBlocked,
      icon:  <Warning size={15} weight="fill" className="text-amber-400" />,
      iconBg:"bg-amber-500/15 border border-amber-500/25",
      valueColor: "text-[var(--text)]",
    },
    {
      key:   "dlpAlerts",
      label: "DLP ALERTS",
      value: stats.dlpAlerts,
      icon:  <Bell size={15} weight="fill" className="text-red-400" />,
      iconBg:"bg-red-500/15 border border-red-500/25",
      valueColor: "text-[var(--text)]",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.key} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${c.iconBg}`}>
              {c.icon}
            </div>
            <p className="text-[10px] font-semibold text-[var(--muted)] tracking-widest uppercase">{c.label}</p>
          </div>
          <p className={`text-[2rem] font-bold leading-none ${c.valueColor}`}>
            {statsLoading ? "—" : c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Active Sessions Table ────────────────────────────────────────────────────
function ActiveSessionsTable() {
  const { sessions, sessionsLoading } = useSelector((s) => s.security);
  const dispatch = useDispatch();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text)]">Active Sessions</h2>
      </div>

      {sessionsLoading ? (
        <div className="p-10 flex items-center justify-center gap-3 text-[var(--muted)]">
          <CircleNotch size={18} className="animate-spin text-blue-400" />
          <span className="text-sm">Loading sessions...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)]">
              <tr>
                {["USER","ROLE","IP ADDRESS","LOGIN TIME","STATUS","ACTIONS"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-[var(--muted)] tracking-widest uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sessions.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-[var(--muted)]">No active sessions.</td></tr>
              )}
              {sessions.map((sess) => (
                <tr
  key={sess.id}
  onClick={() => dispatch(openModal({ type: "EDIT", user: sess }))} 
  className="hover:bg-white/[0.02] transition-colors cursor-pointer"
>
                  <td className="px-5 py-3.5 text-sm text-[var(--text)]">{sess.email}</td>
                  <td className="px-5 py-3.5"><RoleBadge role={sess.role} /></td>
                  <td className="px-5 py-3.5 text-sm font-mono text-[var(--muted)]">{sess.ip}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--muted)]">{sess.loginTime}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium ${
  sess.status === "Active"
    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
    : "bg-red-500/20 text-red-400 border border-red-500/30"
}`}>
  {sess.status}
</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {/* Lock icon — matches screenshot (outline lock icon) */}
                      <button
                        className="text-[var(--muted)] hover:text-amber-400 hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                        title="Lock session"
                        onClick={(e) => {
  e.stopPropagation();
  dispatch(toggleUserLock({ id: sess.id }));
}}
                      >
                        <LockSimple size={16} />
                      </button>
                     <button
  className="text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
  title="Terminate session"
  onClick={(e) => {
    e.stopPropagation();
    dispatch(deleteUser(sess.id));
  }}
>
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Failed Login Attempts Table ──────────────────────────────────────────────
function FailedLoginsTable() {
  const { failedLogins, failedLoginsLoading } = useSelector((s) => s.security);
  const [sortDir, setSortDir] = useState("desc");

  const sorted = [...failedLogins].sort((a, b) =>
    sortDir === "desc" ? b.attempts - a.attempts : a.attempts - b.attempts
  );

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text)]">Failed Login Attempts</h2>
      </div>

      {failedLoginsLoading ? (
        <div className="p-10 flex items-center justify-center gap-3 text-[var(--muted)]">
          <CircleNotch size={18} className="animate-spin text-blue-400" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)]">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[var(--muted)] tracking-widest uppercase">USER</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[var(--muted)] tracking-widest uppercase">IP ADDRESS</th>
                {/* Sortable ATTEMPTS column — matches screenshot ↑↓ icon */}
                <th className="px-5 py-3 text-left cursor-pointer select-none" onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-[var(--muted)] tracking-widest uppercase">ATTEMPTS</span>
                    <div className="flex flex-col">
                      <CaretUp   size={9} className={`${sortDir === "asc"  ? "text-[var(--text)]" : "text-[var(--muted)]"}`} />
                      <CaretDown size={9} className={`${sortDir === "desc" ? "text-[var(--text)]" : "text-[var(--muted)]"} -mt-0.5`} />
                    </div>
                  </div>
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[var(--muted)] tracking-widest uppercase">LAST ATTEMPT</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[var(--muted)] tracking-widest uppercase">BLOCKED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sorted.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-[var(--muted)]">No failed login attempts.</td></tr>
              )}
              {sorted.map((fl) => (
                <tr key={fl.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-sm text-[var(--text)]">{fl.email}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-[var(--muted)]">{fl.ip}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--text)]">{fl.attempts}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--muted)]">{fl.lastAttempt}</td>
                  <td className="px-5 py-3.5">
                    {fl.blocked ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">Yes</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-[var(--border)] text-[var(--muted)]">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Create New User Modal ────────────────────────────────────────────────────
// Matches image 2 exactly: Full Name, Email Address, Role dropdown (5 options), Password (linked to email)
function CreateUserModal() {
  const dispatch      = useDispatch();
  const { actionLoading, actionError } = useSelector((s) => s.security);

  const [form, setForm]       = useState({ name: "", email: "", role: "", password: "" });
  const [showPass, setShowPass]= useState(false);
  const [errors, setErrors]   = useState({});
  const [roleOpen, setRoleOpen]= useState(false);

  const set = (key, val) => { setForm((p) => ({ ...p, [key]: val })); setErrors((p) => ({ ...p, [key]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Full name is required";
    if (!form.email.trim())    e.email    = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.role)            e.role     = "Please select a role";
    if (!form.password.trim()) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    dispatch(createUser({ name: form.name, email: form.email, role: form.role, password: form.password }));
  };

  const inputCls = (key) =>
    `w-full px-3.5 py-2.5 rounded-lg bg-[#0d1117] border ${errors[key] ? "border-red-500" : "border-[var(--border)]"} text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) dispatch(closeModal()); }}
    >
      <div className="relative w-full max-w-md bg-[#111827] border border-[var(--border)] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--text)]">Create New User</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Add a new user to the system and assign a role.</p>
          </div>
          <button onClick={() => dispatch(closeModal())} className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-white/5 transition-colors mt-0.5">
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[13px] font-semibold text-[var(--text)] mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="John Smith"
              className={inputCls("name")}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-semibold text-[var(--text)] mb-1.5">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="john.smith@corp.com"
              className={inputCls("email")}
            />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
          </div>

          {/* Role — custom dropdown matching image 2 */}
          <div>
            <label className="block text-[13px] font-semibold text-[var(--text)] mb-1.5">Role</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleOpen((o) => !o)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#0d1117] border ${errors.role ? "border-red-500" : "border-[var(--border)]"} text-sm ${form.role ? "text-[var(--text)]" : "text-[var(--muted)]"} focus:outline-none transition-colors`}
              >
                {form.role || "Select a role"}
                <CaretDown size={14} className={`text-[var(--muted)] transition-transform ${roleOpen ? "rotate-180" : ""}`} />
              </button>

              {roleOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a2035] border border-[var(--border)] rounded-lg shadow-2xl z-10 overflow-hidden">
                  {AVAILABLE_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { set("role", r); setRoleOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        form.role === r
                          ? "bg-[var(--primary)]/15 text-[var(--text)]"
                          : "text-[var(--text)] hover:bg-white/5"
                      }`}
                    >
                      {r}
                      {form.role === r && <CheckCircle size={14} weight="fill" className="text-[var(--primary)]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.role && <p className="text-xs text-red-400 mt-1">{errors.role}</p>}
          </div>

          {/* Password — linked to email, kept for initial credential set */}
          <div>
            <label className="block text-[13px] font-semibold text-[var(--text)] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Create a password"
                className={`${inputCls("password")} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                {showPass ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
            <p className="text-[10px] text-[var(--muted)] mt-1">User will receive a welcome email with login credentials.</p>
          </div>

          {actionError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <Warning size={13} weight="fill" />{actionError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {actionLoading ? <CircleNotch size={14} className="animate-spin" /> : <UserPlus size={15} weight="bold" />}
            Create User
          </button>
          <button
            onClick={() => dispatch(closeModal())}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] text-sm hover:bg-white/5 hover:text-[var(--text)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal() {
  const dispatch  = useDispatch();
  const { activeUser, actionLoading, actionError } = useSelector((s) => s.security);
  const [form, setForm]    = useState({ name: activeUser?.name || "", email: activeUser?.email || "", role: activeUser?.role || "" });
  const [errors, setErrors]= useState({});
  const [roleOpen, setRoleOpen] = useState(false);

  if (!activeUser) return null;

  const set = (key, val) => { setForm((p) => ({ ...p, [key]: val })); setErrors((p) => ({ ...p, [key]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.role)         e.role  = "Role is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    dispatch(updateUser({ id: activeUser.id, payload: form }));
  };

  const inputCls = (key) =>
    `w-full px-3.5 py-2.5 rounded-lg bg-[#0d1117] border ${errors[key] ? "border-red-500" : "border-[var(--border)]"} text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) dispatch(closeModal()); }}>
      <div className="relative w-full max-w-md bg-[#111827] border border-[var(--border)] rounded-2xl shadow-2xl">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--text)]">Edit User</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">{activeUser.email}</p>
          </div>
          <button onClick={() => dispatch(closeModal())} className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-white/5"><X size={17} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: "Full Name",     key: "name",  type: "text",  placeholder: "Enter full name"      },
            { label: "Email Address", key: "email", type: "email", placeholder: "user@company.com"      },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-[13px] font-semibold text-[var(--text)] mb-1.5">{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} className={inputCls(f.key)} />
              {errors[f.key] && <p className="text-xs text-red-400 mt-1">{errors[f.key]}</p>}
            </div>
          ))}
          {/* Role dropdown */}
          <div>
            <label className="block text-[13px] font-semibold text-[var(--text)] mb-1.5">Role</label>
            <div className="relative">
              <button type="button" onClick={() => setRoleOpen((o) => !o)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#0d1117] border ${errors.role?"border-red-500":"border-[var(--border)]"} text-sm text-[var(--text)]`}>
                {form.role || "Select role"}
                <CaretDown size={14} className={`text-[var(--muted)] ${roleOpen?"rotate-180":""}`} />
              </button>
              {roleOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a2035] border border-[var(--border)] rounded-lg shadow-2xl z-10 overflow-hidden">
                  {AVAILABLE_ROLES.map((r) => (
                    <button key={r} type="button" onClick={() => { set("role", r); setRoleOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between ${form.role===r?"bg-[var(--primary)]/15 text-[var(--text)]":"text-[var(--text)] hover:bg-white/5"}`}>
                      {r} {form.role===r && <CheckCircle size={14} weight="fill" className="text-[var(--primary)]"/>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.role && <p className="text-xs text-red-400 mt-1">{errors.role}</p>}
          </div>
          {actionError && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400"><Warning size={13} weight="fill"/>{actionError}</div>}
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={handleSave} disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white text-sm font-semibold disabled:opacity-50 transition-opacity">
            {actionLoading?<CircleNotch size={14} className="animate-spin"/>:null} Save Changes
          </button>
          <button onClick={() => dispatch(closeModal())} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] text-sm hover:bg-white/5">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteUserModal() {
  const dispatch  = useDispatch();
  const { activeUser, actionLoading } = useSelector((s) => s.security);
  if (!activeUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) dispatch(closeModal()); }}>
      <div className="w-full max-w-sm bg-[#111827] border border-[var(--border)] rounded-2xl shadow-2xl px-6 py-7 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
          <Trash size={24} weight="fill" className="text-red-400" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[var(--text)]">Delete User</p>
          <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
            Are you sure you want to delete <span className="text-[var(--text)] font-medium">{activeUser.email}</span>?<br />This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={actionLoading}
            onClick={() => dispatch(deleteUser(activeUser.id))}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {actionLoading ? <CircleNotch size={14} className="animate-spin" /> : null} Delete
          </button>
          <button onClick={() => dispatch(closeModal())} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] text-sm hover:bg-white/5 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── User Management Table (all users, with filters) ─────────────────────────
function UserManagementTable() {
  const dispatch      = useDispatch();
  const { usersLoading, usersError, search, roleFilter, statusFilter } = useSelector((s) => s.security);
  const filtered      = useSelector(selectFilteredUsers);
  const allUsers      = useSelector((s) => s.security.users);

  const selectCls = "px-3 py-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] min-w-[148px] cursor-pointer transition-colors";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {/* Table header + filters */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-semibold text-[var(--text)]">All Users</h2>
        <div className="flex items-center gap-3 flex-1 justify-end flex-wrap">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              value={search}
              onChange={(e) => dispatch(setSearch(e.target.value))}
              placeholder="Search users..."
              className="pl-9 pr-4 py-2 rounded-lg bg-[#0d1117] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] w-52 transition-colors"
            />
          </div>
          <select value={roleFilter} onChange={(e) => dispatch(setRoleFilter(e.target.value))} className={selectCls}>
            <option value="All">All Roles</option>
            {AVAILABLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => dispatch(setStatusFilter(e.target.value))} className={selectCls}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Locked">Locked</option>
          </select>
        </div>
      </div>
      <p className="px-5 py-2 text-xs text-[var(--muted)] border-b border-[var(--border)]">
        Showing {filtered.length} of {allUsers.length} users
      </p>

      {usersLoading ? (
        <div className="p-10 flex items-center justify-center gap-3 text-[var(--muted)]">
          <CircleNotch size={18} className="animate-spin text-blue-400" />
          <span className="text-sm">Loading users...</span>
        </div>
      ) : usersError ? (
        <div className="p-8 text-center text-red-400 text-sm">{usersError}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)]">
              <tr>
                {["USER","ROLE","IP ADDRESS","LAST LOGIN","STATUS","ACTIONS"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-[var(--muted)] tracking-widest uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--muted)]">No users match your filters.</td></tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  {/* User */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/30 flex items-center justify-center text-xs font-bold text-[var(--primary)] flex-shrink-0">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[var(--text)]">{u.name}</p>
                        <p className="text-[11px] text-[var(--muted)]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                  {/* IP */}
                  <td className="px-5 py-3.5 text-[12px] font-mono text-[var(--muted)]">{u.ip}</td>
                  {/* Last Login */}
                  <td className="px-5 py-3.5 text-[12px] text-[var(--muted)]">{u.lastLogin}</td>
                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium ${
                      u.status === "Active"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-500/15 text-red-400 border border-red-500/30"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === "Active" ? "bg-emerald-400" : "bg-red-400"}`} />
                      {u.status}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => dispatch(openModal({ type: "EDIT", user: u }))}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 transition-colors"
                        title="Edit"
                      >
                        <PencilSimple size={15} />
                      </button>
                      <button
                        onClick={() => dispatch(toggleUserLock({ id: u.id, currentStatus: u.status }))}
                        className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${u.status === "Active" ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"}`}
                        title={u.status === "Active" ? "Lock user" : "Unlock user"}
                      >
                        {u.status === "Active" ? <LockSimple size={15} /> : <LockSimpleOpen size={15} />}
                      </button>
                      <button
                        onClick={() => dispatch(openModal({ type: "DELETE", user: u }))}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Security() {
  const dispatch  = useDispatch();
  const modalType = useSelector((s) => s.security.modalType);
const { sessions } = useSelector(s => s.security);

  useEffect(() => {
  dispatch(fetchSecurityStats());
  dispatch(fetchActiveSessions());
  dispatch(fetchFailedLogins());
  dispatch(fetchUsers());
}, [dispatch]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        {/* 🔥 FIXED: CENTERED LAYOUT */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center">
          <div className="w-full max-w-[1200px] space-y-5">

            {/* HEADER */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold text-[var(--text)]">
                  Security &amp; Access Console
                </h1>
                <p className="text-sm text-[var(--muted)] mt-0.5">
                  Authentication, authorization, and security monitoring
                </p>
              </div>

              <button
                onClick={() => dispatch(openModal({ type: "CREATE" }))}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] hover:opacity-90 text-white text-sm font-semibold transition-opacity shadow-sm"
              >
                <UserPlus size={16} weight="bold" />
                Create New User
              </button>
            </div>

            {/* STATS */}
            <StatsCards />

            {/* ACTIVE SESSIONS */}
            <ActiveSessionsTable />

            {/* FAILED LOGINS */}
            <FailedLoginsTable />

            {/* USERS TABLE (REMOVED AS REQUESTED) */}
            {/* <UserManagementTable /> */}

          </div>
        </div>
      </div>

      {/* MODALS */}
      {modalType === "CREATE" && <CreateUserModal />}
      {modalType === "EDIT"   && <EditUserModal   />}
      {modalType === "DELETE" && <DeleteUserModal />}
    </div>
  );
}