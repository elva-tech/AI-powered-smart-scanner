// /**
//  * rulesSlice.js
//  * Central state for the entire Rule Library feature.
//  * Handles: rules list, filters, selection, modal system, simulation flow, bulk actions.
//  */

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import {
//   fetchRulesAPI,
//   deployRulesAPI,
//   activateRulesAPI,
//   deactivateRulesAPI,
//   fetchEnvironmentsAPI,
//   runTestDataSimulationAPI,
//   runLiveSimulationAPI,
// } from "./rulesAPI";

// // ─── Async Thunks ─────────────────────────────────────────────────────────────

// /** Fetch all 100 rules from backend */
// export const fetchRules = createAsyncThunk(
//   "rules/fetch",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await fetchRulesAPI();
//       if (!res.success) return rejectWithValue("Failed to load rules");
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.message || "Network error");
//     }
//   }
// );

// /** Fetch SAP environments for simulation */
// export const fetchEnvironments = createAsyncThunk(
//   "rules/fetchEnvironments",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await fetchEnvironmentsAPI();
//       if (!res.success) return rejectWithValue("Failed to load environments");
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.message || "Network error");
//     }
//   }
// );

// /** Deploy selected rules — updates status in local state optimistically */
// export const deployRules = createAsyncThunk(
//   "rules/deploy",
//   async (ids, { rejectWithValue }) => {
//     try {
//       const res = await deployRulesAPI(ids);
//       if (!res.success) return rejectWithValue("Deployment failed");
//       return res.data; // [{ id, status, lifecycle }]
//     } catch (err) {
//       return rejectWithValue(err.message || "Network error");
//     }
//   }
// );

// /** Activate selected rules */
// export const activateRules = createAsyncThunk(
//   "rules/activate",
//   async (ids, { rejectWithValue }) => {
//     try {
//       const res = await activateRulesAPI(ids);
//       if (!res.success) return rejectWithValue("Activation failed");
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.message || "Network error");
//     }
//   }
// );

// /** Deactivate selected rules — reverts to DRAFT */
// export const deactivateRules = createAsyncThunk(
//   "rules/deactivate",
//   async (ids, { rejectWithValue }) => {
//     try {
//       const res = await deactivateRulesAPI(ids);
//       if (!res.success) return rejectWithValue("Deactivation failed");
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.message || "Network error");
//     }
//   }
// );

// /** Run simulation with synthetic test data */
// export const runTestDataSimulation = createAsyncThunk(
//   "rules/simulateTestData",
//   async ({ ruleId, config }, { rejectWithValue }) => {
//     try {
//       const res = await runTestDataSimulationAPI(ruleId, config);
//       if (!res.success) return rejectWithValue("Simulation failed");
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.message || "Network error");
//     }
//   }
// );

// /** Run simulation against live SAP environment */
// export const runLiveSimulation = createAsyncThunk(
//   "rules/simulateLive",
//   async ({ ruleId, config }, { rejectWithValue }) => {
//     try {
//       const res = await runLiveSimulationAPI(ruleId, config);
//       if (!res.success) return rejectWithValue("Simulation failed");
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.message || "Network error");
//     }
//   }
// );

// // ─── Slice ────────────────────────────────────────────────────────────────────

// const initialSimulation = {
//   /**
//    * step values:
//    *   0 = closed
//    *   1 = mode selection (test data vs live)
//    *   2 = test data config
//    *   3 = env selection (live)
//    *   4 = live simulation config
//    *   5 = running
//    *   6 = results
//    */
//   step:            0,
//   mode:            null,      // "test" | "live"
//   selectedEnv:     null,      // environment object
//   config: {
//     transactionCount: 10000,
//     fromDate:         "",
//     toDate:           "",
//   },
//   result:          null,
//   error:           null,
//   loading:         false,
// };

// const rulesSlice = createSlice({
//   name: "rules",
//   initialState: {
//     // ── Data ────────────────────────────────────────────────────────────────
//     list:              [],
//     environments:      [],
//     loading:           false,
//     error:             null,

//     // ── Filters ─────────────────────────────────────────────────────────────
//     search:            "",
//     statusFilter:      "ALL",
//     moduleFilter:      "ALL",

//     // ── Table Selection ─────────────────────────────────────────────────────
//     selected:          [],   // array of rule IDs

//     // ── Modal System ────────────────────────────────────────────────────────
//     // modalType: null | "VIEW" | "CONFIRM_DEPLOY" | "CONFIRM_ACTIVATE" | "CONFIRM_DEACTIVATE" | "SCHEDULE"
//     modalType:         null,
//     activeRule:        null,  // rule being viewed / acted on

//     // ── Bulk Action Loading ──────────────────────────────────────────────────
//     bulkLoading:       false,
//     bulkError:         null,

//     // ── Simulation Flow ─────────────────────────────────────────────────────
//     simulation:        initialSimulation,

//     // ── Schedule ────────────────────────────────────────────────────────────
//     scheduleConfig: {
//       frequency:  "DAILY",    // DAILY | WEEKLY | MONTHLY
//       time:       "08:00",
//       startDate:  "",
//       endDate:    "",
//     },
//   },

//   reducers: {
//     // ── Filters ─────────────────────────────────────────────────────────────
//     setSearch:       (s, a) => { s.search       = a.payload; },
//     setStatusFilter: (s, a) => { s.statusFilter = a.payload; },
//     setModuleFilter: (s, a) => { s.moduleFilter = a.payload; },

//     // ── Selection ────────────────────────────────────────────────────────────
//     toggleSelect: (s, a) => {
//       const id = a.payload;
//       s.selected = s.selected.includes(id)
//         ? s.selected.filter((i) => i !== id)
//         : [...s.selected, id];
//     },
//     selectAll: (s, a) => {
//       // payload = array of all currently-visible rule IDs
//       const visible = a.payload;
//       const allSelected = visible.every((id) => s.selected.includes(id));
//       s.selected = allSelected ? [] : visible;
//     },
//     clearSelection: (s) => { s.selected = []; },

//     // ── Modal System ─────────────────────────────────────────────────────────
//     openModal: (s, a) => {
//       // payload: { type: "VIEW" | ..., rule?: ruleObject }
//       s.modalType  = a.payload.type;
//       s.activeRule = a.payload.rule || null;
//     },
//     closeModal: (s) => {
//       s.modalType  = null;
//       s.activeRule = null;
//       s.bulkError  = null;
//     },

//     // ── Simulation Control ────────────────────────────────────────────────────
//     openSimulation: (s, a) => {
//       // payload: rule object
//       s.simulation        = { ...initialSimulation, step: 1 };
//       s.activeRule        = a.payload;
//     },
//     setSimulationStep:  (s, a) => { s.simulation.step        = a.payload; },
//     setSimulationMode:  (s, a) => { s.simulation.mode        = a.payload; },
//     setSelectedEnv:     (s, a) => { s.simulation.selectedEnv = a.payload; },
//     setSimulationConfig:(s, a) => {
//       s.simulation.config = { ...s.simulation.config, ...a.payload };
//     },
//     closeSimulation: (s) => {
//       s.simulation = initialSimulation;
//       s.activeRule = null;
//     },

//     // ── Schedule ─────────────────────────────────────────────────────────────
//     setScheduleConfig: (s, a) => {
//       s.scheduleConfig = { ...s.scheduleConfig, ...a.payload };
//     },

//     // ── Optimistic local update (used after confirmed actions) ────────────────
//     applyStatusUpdate: (s, a) => {
//       // payload: [{ id, status, lifecycle }]
//       a.payload.forEach(({ id, status, lifecycle }) => {
//         const rule = s.list.find((r) => r.id === id);
//         if (rule) {
//           rule.status    = status;
//           rule.lifecycle = lifecycle;
//         }
//       });
//       s.selected = [];
//     },
//   },

//   extraReducers: (b) => {
//     // ── fetchRules ────────────────────────────────────────────────────────────
//     b.addCase(fetchRules.pending,  (s) => { s.loading = true;  s.error = null; });
//     b.addCase(fetchRules.fulfilled,(s, a) => { s.loading = false; s.list = a.payload; });
//     b.addCase(fetchRules.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

//     // ── fetchEnvironments ─────────────────────────────────────────────────────
//     b.addCase(fetchEnvironments.fulfilled, (s, a) => { s.environments = a.payload; });

//     // ── deployRules ───────────────────────────────────────────────────────────
//     b.addCase(deployRules.pending,  (s) => { s.bulkLoading = true;  s.bulkError = null; });
//     b.addCase(deployRules.fulfilled,(s, a) => {
//       s.bulkLoading = false;
//       s.modalType   = null;
//       a.payload.forEach(({ id, status, lifecycle }) => {
//         const rule = s.list.find((r) => r.id === id);
//         if (rule) { rule.status = status; rule.lifecycle = lifecycle; }
//       });
//       s.selected = [];
//     });
//     b.addCase(deployRules.rejected,(s, a) => { s.bulkLoading = false; s.bulkError = a.payload; });

//     // ── activateRules ─────────────────────────────────────────────────────────
//     b.addCase(activateRules.pending,  (s) => { s.bulkLoading = true;  s.bulkError = null; });
//     b.addCase(activateRules.fulfilled,(s, a) => {
//       s.bulkLoading = false;
//       s.modalType   = null;
//       a.payload.forEach(({ id, status, lifecycle }) => {
//         const rule = s.list.find((r) => r.id === id);
//         if (rule) { rule.status = status; rule.lifecycle = lifecycle; }
//       });
//       s.selected = [];
//     });
//     b.addCase(activateRules.rejected,(s, a) => { s.bulkLoading = false; s.bulkError = a.payload; });

//     // ── deactivateRules ───────────────────────────────────────────────────────
//     b.addCase(deactivateRules.pending,  (s) => { s.bulkLoading = true;  s.bulkError = null; });
//     b.addCase(deactivateRules.fulfilled,(s, a) => {
//       s.bulkLoading = false;
//       s.modalType   = null;
//       a.payload.forEach(({ id, status, lifecycle }) => {
//         const rule = s.list.find((r) => r.id === id);
//         if (rule) { rule.status = status; rule.lifecycle = lifecycle; }
//       });
//       s.selected = [];
//     });
//     b.addCase(deactivateRules.rejected,(s, a) => { s.bulkLoading = false; s.bulkError = a.payload; });

//     // ── simulation ────────────────────────────────────────────────────────────
//     b.addCase(runTestDataSimulation.pending,  (s) => { s.simulation.loading = true; s.simulation.error = null; s.simulation.step = 5; });
//     b.addCase(runTestDataSimulation.fulfilled,(s, a) => {
//       s.simulation.loading = false;
//       s.simulation.result  = a.payload;
//       s.simulation.step    = 6;
//       // Update rule status to SIMULATION
//       const rule = s.list.find((r) => r.id === a.payload.ruleId);
//       if (rule) { rule.status = "SIMULATION"; rule.lifecycle = "SIMULATION"; }
//     });
//     b.addCase(runTestDataSimulation.rejected,(s, a) => { s.simulation.loading = false; s.simulation.error = a.payload; s.simulation.step = 2; });

//     b.addCase(runLiveSimulation.pending,  (s) => { s.simulation.loading = true; s.simulation.error = null; s.simulation.step = 5; });
//     b.addCase(runLiveSimulation.fulfilled,(s, a) => {
//       s.simulation.loading = false;
//       s.simulation.result  = a.payload;
//       s.simulation.step    = 6;
//       const rule = s.list.find((r) => r.id === a.payload.ruleId);
//       if (rule) { rule.status = "SIMULATION"; rule.lifecycle = "SIMULATION"; }
//     });
//     b.addCase(runLiveSimulation.rejected,(s, a) => { s.simulation.loading = false; s.simulation.error = a.payload; s.simulation.step = 4; });
//   },
// });

// export const {
//   setSearch, setStatusFilter, setModuleFilter,
//   toggleSelect, selectAll, clearSelection,
//   openModal, closeModal,
//   openSimulation, setSimulationStep, setSimulationMode,
//   setSelectedEnv, setSimulationConfig, closeSimulation,
//   setScheduleConfig, applyStatusUpdate,
// } = rulesSlice.actions;

// // ─── Selectors ────────────────────────────────────────────────────────────────

// /** Returns filtered rules based on active search/status/module filters */
// export const selectFilteredRules = (state) => {
//   const { list, search, statusFilter, moduleFilter } = state.rules;
//   return list.filter((r) => {
//     const q = search.toLowerCase();
//     const matchSearch =
//       !q ||
//       r.name.toLowerCase().includes(q) ||
//       r.id.toLowerCase().includes(q);
//     const matchStatus =
//       statusFilter === "ALL" || r.status === statusFilter;
//     const matchModule =
//       moduleFilter === "ALL" || r.module === moduleFilter;
//     return matchSearch && matchStatus && matchModule;
//   });
// };

// /** Summary counts for stats cards */
// export const selectStats = (state) => {
//   const { list } = state.rules;
//   return {
//     total:      list.length,
//     draft:      list.filter((r) => r.status === "DRAFT").length,
//     simulation: list.filter((r) => r.status === "SIMULATION").length,
//     active:     list.filter((r) => r.status === "ACTIVE").length,
//     deployed:   list.filter((r) => r.status === "DEPLOYED").length,
//   };
// };

// export default rulesSlice.reducer;

/**
 * rulesSlice.js — Complete state for Rule Library.
 * Handles: rules, filters, selection, modals, simulation (multi-step),
 * bulk actions, per-rule simulation history, deploy-to-env flow.
 */

/**
 * rulesSlice.js — Complete state for Rule Library.
 * Handles: rules, filters, selection, modals, simulation (multi-step),
 * bulk actions, per-rule simulation history, deploy-to-env flow.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchRulesAPI, fetchEnvironmentsAPI,
  deployRulesAPI, activateRulesAPI, deactivateRulesAPI,
  runSimulationAPI, deployRuleToEnvAPI,
} from "./rulesAPI";

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchRules = createAsyncThunk("rules/fetch", async (_, {rejectWithValue}) => {
  try { const r = await fetchRulesAPI(); return r.data; }
  catch(e) { return rejectWithValue(e.message); }
});

export const fetchEnvironments = createAsyncThunk("rules/fetchEnvs", async (_, {rejectWithValue}) => {
  try { return await fetchEnvironmentsAPI(); }
  catch(e) { return rejectWithValue(e.message); }
});

export const bulkDeploy = createAsyncThunk("rules/bulkDeploy", async (ids, {rejectWithValue}) => {
  try { const r = await deployRulesAPI(ids); if(!r.success) return rejectWithValue("Failed"); return r.data; }
  catch(e) { return rejectWithValue(e.message); }
});

export const bulkActivate = createAsyncThunk("rules/bulkActivate", async (ids, {rejectWithValue}) => {
  try { const r = await activateRulesAPI(ids); if(!r.success) return rejectWithValue("Failed"); return r.data; }
  catch(e) { return rejectWithValue(e.message); }
});

export const bulkDeactivate = createAsyncThunk("rules/bulkDeactivate", async (ids, {rejectWithValue}) => {
  try { const r = await deactivateRulesAPI(ids); if(!r.success) return rejectWithValue("Failed"); return r.data; }
  catch(e) { return rejectWithValue(e.message); }
});

export const runSimulation = createAsyncThunk("rules/runSimulation", async ({ruleId, config}, {rejectWithValue}) => {
  try { const r = await runSimulationAPI(ruleId, config); if(!r.success) return rejectWithValue("Simulation failed"); return r.data; }
  catch(e) { return rejectWithValue(e.message); }
});

export const deployRuleToEnv = createAsyncThunk("rules/deployRuleToEnv", async ({ruleId, environment}, {rejectWithValue}) => {
  try { const r = await deployRuleToEnvAPI(ruleId, environment); if(!r.success) return rejectWithValue("Deploy failed"); return r.data; }
  catch(e) { return rejectWithValue(e.message); }
});

// ─── Simulation State Machine ─────────────────────────────────────────────────
// step: 0=closed 1=mode-select 2=test-config 3=env-select(live) 4=live-config 5=running 6=done
const initSim = {
  step:0, mode:null, selectedEnv:null,
  config:{ transactionCount:10000, fromDate:"", toDate:"" },
  loading:false, error:null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const rulesSlice = createSlice({
  name:"rules",
  initialState:{
    list:[], loading:false, error:null,
    simEnvs:[], deployEnvs:[],

    // filters
    search:"", statusFilter:"ALL", moduleFilter:"ALL",

    // selection
    selected:[],

    // modals
    // modalType: null | "VIEW" | "CONFIRM_DEPLOY" | "CONFIRM_ACTIVATE" | "CONFIRM_DEACTIVATE"
    //           | "SCHEDULE" | "DEPLOY_TO_ENV" | "DEPLOY_SUCCESS" | "SIM_GATE" | "SCHEDULE_GATE" | "DATE_ERROR"
    modalType:null, activeRule:null,

    // bulk action loading
    bulkLoading:false, bulkError:null,

    // deploy-to-env within VIEW modal
    deployTarget:null,   // selected DEPLOY_ENVIRONMENTS entry
    deployLoading:false, deployError:null,
    deploySuccessMsg:"", // message shown in DEPLOY_SUCCESS popup

    // schedule modal
    scheduleConfig:{ type:"ONE_TIME", environment:"", fromDate:"", toDate:"" },
    scheduleError:"",

    // simulation flow
    simulation:{ ...initSim },
  },

  reducers:{
    // ── Filters ─────────────────────────────────────────────────────────────
    setSearch:       (s,a) => { s.search = a.payload; },
    setStatusFilter: (s,a) => { s.statusFilter = a.payload; },
    setModuleFilter: (s,a) => { s.moduleFilter = a.payload; },

    // ── Selection ────────────────────────────────────────────────────────────
    toggleSelect:(s,a) => {
      const id = a.payload;
      s.selected = s.selected.includes(id) ? s.selected.filter(i=>i!==id) : [...s.selected, id];
    },
    selectAll:(s,a) => {
      const ids = a.payload;
      s.selected = ids.every(id=>s.selected.includes(id)) ? [] : ids;
    },
    clearSelection:(s) => { s.selected=[]; },

    // ── Modals ───────────────────────────────────────────────────────────────
    openModal: (s,a) => { s.modalType=a.payload.type; s.activeRule=a.payload.rule||null; s.bulkError=null; s.deployError=null; },
    closeModal:(s) => { s.modalType=null; s.activeRule=null; s.bulkError=null; s.deployError=null; s.deploySuccessMsg=""; },

    // ── Simulation Control ────────────────────────────────────────────────────
    openSimulation:(s,a) => {
      s.simulation = { ...initSim, step:1 };
      s.activeRule = a.payload;
      s.modalType  = null; // close view modal
    },
    setSimStep:(s,a)    => { s.simulation.step = a.payload; },
    setSimMode:(s,a)    => { s.simulation.mode = a.payload; },
    setSimEnv:(s,a)     => { s.simulation.selectedEnv = a.payload; },
    setSimConfig:(s,a)  => { s.simulation.config = {...s.simulation.config,...a.payload}; },
    closeSimulation:(s) => { s.simulation = {...initSim}; s.activeRule=null; },

    // ── Deploy-to-env control ─────────────────────────────────────────────────
    setDeployTarget:(s,a) => { s.deployTarget=a.payload; s.deployError=null; },
    closeDeployEnv:(s) => { s.deployTarget=null; s.deployError=null; },

    // ── Schedule ─────────────────────────────────────────────────────────────
    setScheduleConfig:(s,a) => { s.scheduleConfig={...s.scheduleConfig,...a.payload}; s.scheduleError=""; },
    setScheduleError:(s,a)  => { s.scheduleError=a.payload; },
  },

  extraReducers:(b) => {
    // fetchRules
    b.addCase(fetchRules.pending,   (s)   => { s.loading=true; s.error=null; });
    b.addCase(fetchRules.fulfilled, (s,a) => { s.loading=false; s.list=a.payload; });
    b.addCase(fetchRules.rejected,  (s,a) => { s.loading=false; s.error=a.payload; });

    // fetchEnvironments
    b.addCase(fetchEnvironments.fulfilled,(s,a)=>{ s.simEnvs=a.payload.simEnvs; s.deployEnvs=a.payload.deployEnvs; });

    // ── Bulk actions ──────────────────────────────────────────────────────────
    const bulkPending   = (s)   => { s.bulkLoading=true; s.bulkError=null; };
    const bulkRejected  = (s,a) => { s.bulkLoading=false; s.bulkError=a.payload; };
    const applyBulk     = (s,a) => {
      s.bulkLoading=false; s.modalType=null;
      a.payload.forEach(({id,status,lifecycle,activatedAt})=>{
        const r = s.list.find(x=>x.id===id);
        if(r){ r.status=status; r.lifecycle=lifecycle; if(activatedAt) r.activatedAt=activatedAt; }
      });
      s.selected=[];
    };
    b.addCase(bulkDeploy.pending,   bulkPending);
    b.addCase(bulkDeploy.fulfilled, applyBulk);
    b.addCase(bulkDeploy.rejected,  bulkRejected);
    b.addCase(bulkActivate.pending,   bulkPending);
    b.addCase(bulkActivate.fulfilled, applyBulk);
    b.addCase(bulkActivate.rejected,  bulkRejected);
    b.addCase(bulkDeactivate.pending,   bulkPending);
    b.addCase(bulkDeactivate.fulfilled, applyBulk);
    b.addCase(bulkDeactivate.rejected,  bulkRejected);

    // ── Simulation ────────────────────────────────────────────────────────────
    b.addCase(runSimulation.pending, (s) => {
      s.simulation.loading=true; s.simulation.error=null; s.simulation.step=5;
    });
    b.addCase(runSimulation.fulfilled,(s,a)=>{
      s.simulation.loading=false; s.simulation.step=6;
      const result = a.payload;
      // Add to rule's simulationHistory
      const rule = s.list.find(r=>r.id===result.ruleId);
      if(rule){
        rule.simulationHistory = [result, ...rule.simulationHistory];
        rule.status   = "SIMULATION";
        rule.lifecycle= "SIMULATION";
      }
      // Also update activeRule so modal can show fresh data
      if(s.activeRule?.id === result.ruleId && rule){
        s.activeRule = { ...rule };
      }
    });
    b.addCase(runSimulation.rejected,(s,a)=>{
      s.simulation.loading=false; s.simulation.error=a.payload;
      s.simulation.step = s.simulation.mode==="test" ? 2 : 4;
    });

    // ── Deploy to specific env (from VIEW modal) ───────────────────────────────
    b.addCase(deployRuleToEnv.pending,  (s)   => { s.deployLoading=true; s.deployError=null; });
    b.addCase(deployRuleToEnv.fulfilled,(s,a) => {
      s.deployLoading=false;
      const { ruleId, environment } = a.payload;
      const rule = s.list.find(r=>r.id===ruleId);
      if(rule){ rule.status="DEPLOYED"; rule.lifecycle="DEPLOYED"; rule.deployedEnv=environment; }
      if(s.activeRule?.id===ruleId){ s.activeRule={...rule}; }
      // Close deploy modal, open success
      const envLabel = { DEV:"DEV environment", QAS:"QA environment", PROD:"PRODUCTION environment" };
      s.deploySuccessMsg = `${s.activeRule?.name || ""} has been deployed to ${envLabel[environment]||environment}.\nStatus: DEPLOYED\nThe active rule has been archived to the selected environment.`;
      s.modalType="DEPLOY_SUCCESS";
      s.deployTarget=null;
    });
    b.addCase(deployRuleToEnv.rejected,(s,a) => { s.deployLoading=false; s.deployError=a.payload; });
  },
});

export const {
  setSearch,setStatusFilter,setModuleFilter,
  toggleSelect,selectAll,clearSelection,
  openModal,closeModal,
  openSimulation,setSimStep,setSimMode,setSimEnv,setSimConfig,closeSimulation,
  setDeployTarget,closeDeployEnv,
  setScheduleConfig,setScheduleError,
} = rulesSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectFilteredRules = (s) => {
  const {list,search,statusFilter,moduleFilter} = s.rules;
  const q = search.toLowerCase();
  return list.filter(r=>{
    const ms = !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const ss = statusFilter==="ALL" || r.status===statusFilter;
    const ms2= moduleFilter==="ALL" || r.module===moduleFilter;
    return ms && ss && ms2;
  });
};

export const selectStats = (s) => {
  const l = s.rules.list;
  return {
    total:      l.length,
    draft:      l.filter(r=>r.status==="DRAFT").length,
    simulation: l.filter(r=>r.status==="SIMULATION").length,
    active:     l.filter(r=>r.status==="ACTIVE").length,
    deployed:   l.filter(r=>r.status==="DEPLOYED").length,
  };
};

export default rulesSlice.reducer;