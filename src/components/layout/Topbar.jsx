/**
 * Topbar.jsx — Pixel-perfect. Matches screenshot exactly.
 * Icons: Palette (theme), Sun/Moon (mode), Bell (notifications), user dropdown.
 */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import {
  Palette,
  Sun,
  Moon,
  Bell,
  CaretDown,
  SignOut,
  Gear,
  Check,
} from "@phosphor-icons/react";

const COLORS = [
  { name: "Blue",   value: "blue",   hex: "#2563EB" },
  { name: "Purple", value: "purple", hex: "#7C3AED" },
  { name: "Green",  value: "green",  hex: "#16A34A" },
  { name: "Orange", value: "orange", hex: "#EA580C" },
  { name: "Red",    value: "red",    hex: "#DC2626" },
  { name: "Teal",   value: "teal",   hex: "#0D9488" },
];

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector((s) => s.auth.user);

  const [themeOpen,   setThemeOpen]   = useState(false);
  const [userOpen,    setUserOpen]    = useState(false);
  const [darkMode,    setDarkMode]    = useState(true);
  const [activeColor, setActiveColor] = useState("purple");

  const applyColor = (c) => {
    document.documentElement.classList.remove(
      "theme-blue","theme-purple","theme-green","theme-orange","theme-red","theme-teal"
    );
    document.documentElement.classList.add(`theme-${c}`);
    setActiveColor(c);
    setThemeOpen(false);
  };

  const toggleMode = () => {
    document.documentElement.classList.toggle("light");
    setDarkMode(!darkMode);
  };

  const closeAll = () => { setThemeOpen(false); setUserOpen(false); };

  return (
    <div
      className="h-14 flex-shrink-0 flex items-center justify-between px-5 border-b border-[var(--border)] bg-[var(--card)] relative z-30"
      onClick={(e) => { if (e.target === e.currentTarget) closeAll(); }}
    >
      {/* LEFT — breadcrumb placeholder */}
      <div />

      {/* RIGHT */}
      <div className="flex items-center gap-1">

        {/* ── Color Palette ──────────────────────────────────────────────────── */}
        <div className="relative">
          <button
            onClick={() => { setThemeOpen(!themeOpen); setUserOpen(false); }}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 transition-colors"
            title="Color theme"
          >
            <Palette size={19} weight="duotone" />
          </button>

          {themeOpen && (
            <div className="absolute right-0 top-11 w-44 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 z-50">
              <p className="px-2 py-1.5 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest">
                Color Scheme
              </p>
              <div className="space-y-0.5">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => applyColor(c.value)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c.hex }} />
                    <span className="text-[13px] text-[var(--text)] flex-1 text-left">{c.name}</span>
                    {activeColor === c.value && (
                      <Check size={13} className="text-[var(--primary)]" weight="bold" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Dark / Light ────────────────────────────────────────────────────── */}
        <button
          onClick={toggleMode}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 transition-colors"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode
            ? <Sun  size={19} weight="duotone" />
            : <Moon size={19} weight="duotone" />
          }
        </button>

        {/* ── Notifications ────────────────────────────────────────────────────── */}
        <div className="relative">
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 transition-colors" title="Notifications">
            <Bell size={19} weight="duotone" />
          </button>
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </div>

        {/* ── Divider ──────────────────────────────────────────────────────────── */}
        <div className="w-px h-5 bg-[var(--border)] mx-1.5" />

        {/* ── User Dropdown ────────────────────────────────────────────────────── */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setThemeOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <span className="text-[13px] text-[var(--muted)] hidden sm:block">
              {user?.email ?? "admin@corp.com"}
            </span>
            <CaretDown size={11} className="text-[var(--muted)]" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-11 w-58 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden min-w-[220px]">
              {/* User header */}
              <div className="p-3.5 flex items-center gap-3 border-b border-[var(--border)]">
                <div className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--text)] truncate">{user?.name ?? "Admin"}</p>
                  <p className="text-[11px] text-[var(--muted)] truncate">{user?.email ?? "admin@corp.com"}</p>
                  <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                    {user?.role ?? "Administrator"}
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div className="p-1.5 space-y-0.5">
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[var(--text)] hover:bg-white/5 transition-colors">
                  <Gear size={14} className="text-[var(--muted)]" />
                  Settings
                </button>
                <button
                  onClick={() => { dispatch(logout()); navigate("/login"); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <SignOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}