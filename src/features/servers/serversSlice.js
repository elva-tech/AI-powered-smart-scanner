/**
 * serversSlice.js — Redux state for "My Connections" (custom SAP servers).
 * Persists to localStorage so servers survive page refresh.
 * When a server is added here, it automatically appears in DeployToEnvModal.
 */

import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "sap_custom_servers_v1";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

const serversSlice = createSlice({
  name: "servers",
  initialState: {
    list:        loadFromStorage(),  // [{ id, name, ip, hostname, description, createdAt }]
    modalOpen:   false,
    editTarget:  null,               // server being edited, null = create mode
    deleteTarget:null,
    formError:   null,
  },
  reducers: {
    openAddModal:    (s) => { s.modalOpen = true; s.editTarget = null; s.formError = null; },
    openEditModal:   (s, a) => { s.modalOpen = true; s.editTarget = a.payload; s.formError = null; },
    closeModal:      (s) => { s.modalOpen = false; s.editTarget = null; s.formError = null; },
    setDeleteTarget: (s, a) => { s.deleteTarget = a.payload; },
    clearDelete:     (s) => { s.deleteTarget = null; },
    setFormError:    (s, a) => { s.formError = a.payload; },

    addServer: (s, a) => {
      const server = {
        id:          `SRV-${Date.now()}`,
        name:        a.payload.name.trim(),
        ip:          a.payload.ip.trim(),
        hostname:    a.payload.hostname.trim(),
        description: (a.payload.description || "").trim(),
        createdAt:   new Date().toLocaleDateString(),
      };
      s.list.unshift(server);
      saveToStorage(s.list);
      s.modalOpen = false;
      s.formError = null;
    },

    updateServer: (s, a) => {
      const idx = s.list.findIndex(x => x.id === a.payload.id);
      if (idx !== -1) {
        s.list[idx] = {
          ...s.list[idx],
          name:        a.payload.name.trim(),
          ip:          a.payload.ip.trim(),
          hostname:    a.payload.hostname.trim(),
          description: (a.payload.description || "").trim(),
        };
        saveToStorage(s.list);
      }
      s.modalOpen  = false;
      s.editTarget = null;
      s.formError  = null;
    },

    deleteServer: (s, a) => {
      s.list        = s.list.filter(x => x.id !== a.payload);
      s.deleteTarget= null;
      saveToStorage(s.list);
    },
  },
});

export const {
  openAddModal, openEditModal, closeModal,
  setDeleteTarget, clearDelete,
  setFormError,
  addServer, updateServer, deleteServer,
} = serversSlice.actions;

// Selector — returns servers in the shape DeployToEnvModal expects
export const selectDeployServers = (state) =>
  state.servers.list.map(s => ({
    id:      s.id,
    name:    s.name,
    ip:      s.ip,
    hostname:s.hostname,
    desc:    s.description || s.hostname,
    badge:   "Custom",
    badgeCls:"text-violet-400 bg-violet-500/20 border-violet-500/30",
    isProd:  false,
    isCustom:true,
  }));
export default serversSlice.reducer;
