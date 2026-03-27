/**
 * CaseManagement.jsx — Full Case Management page (API + state + UI in one file for simplicity).
 * Split into casesAPI.js + casesSlice.js when scaling.
 *
 * Route: /cases
 * PRD: Anomaly Investigation Workflow
 */

import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSlice, createAsyncThunk, configureStore } from "@reduxjs/toolkit";
import Sidebar from "../components/layout/Sidebar";
import Topbar  from "../components/layout/Topbar";
import {
  MagnifyingGlass, FunnelSimple, Eye, PencilSimple, Robot, UserCircle,
  Warning, CircleNotch, ArrowsClockwise, X, CheckCircle, Clock,
  ChartBar, CaretDown, ShieldWarning, Siren, ArrowClockwise,
} from "@phosphor-icons/react";

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const RULES_REF = [
  "CO-Ghost Vendor Analysis-1","SD-Split Purchase Order-2","MM-Price Variance Threshold-3",
  "PP-Vendor Master Anomaly-4","HR-Invoice Manipulation-5","FI-Segregation of Duties-8",
  "CO-Budget Variance Manipulation-17","SD-Customer Credit Override-18","MM-Duplicate Invoice Detection-11",
  "HR-Ghost Employee Detection-13","FI-Backdated Entry Detection-16","CO-Cost Center Override-25",
];
const RULE_IDS = ["RULE-001","RULE-002","RULE-003","RULE-004","RULE-005","RULE-008","RULE-017","RULE-018","RULE-011","RULE-013","RULE-016","RULE-025"];
const ENVS     = ["DEV","QA","PROD"];
const STATUSES = ["New","Investigating","AI Assisted","Closed"];
const CLOSURES = ["Pending","True Positive","False Positive"];
const ASSIGNEES= ["Priya Sharma","Rajan Mehta","Unassigned","Aiko Tanaka","Carlos Ruiz","Unassigned","Fatima Al-Hassan","Sanjay Patel"];

function buildCases() {
  const raw = [
    { score:97, title:"Ghost vendor detected in CO module — payments to non-existent vendor",   env:"PROD", ri:0, st:"New",          cl:"Pending",       ai:0 },
    { score:92, title:"Split PO pattern flagged — multiple orders below approval threshold",       env:"QA",   ri:1, st:"Investigating", cl:"True Positive",  ai:1 },
    { score:88, title:"Price variance of 38% detected in MM module — 12 transactions affected",   env:"PROD", ri:2, st:"AI Assisted",   cl:"Pending",       ai:2 },
    { score:85, title:"Vendor master changed 3 times in 24hrs — possible unauthorized access",    env:"DEV",  ri:3, st:"Investigating", cl:"Pending",       ai:3 },
    { score:82, title:"Invoice submitted twice within 30 days — duplicate payment risk",           env:"QA",   ri:4, st:"New",          cl:"Pending",       ai:4 },
    { score:78, title:"SOD violation detected — same user created and approved vendor",            env:"PROD", ri:5, st:"Closed",        cl:"True Positive",  ai:5 },
    { score:75, title:"Budget variance manipulation in CO-PA — $250K over-allocated",             env:"PROD", ri:6, st:"Investigating", cl:"Pending",       ai:0 },
    { score:73, title:"Credit limit overridden without authorization — $500K exposure",            env:"QA",   ri:7, st:"AI Assisted",   cl:"False Positive", ai:1 },
    { score:71, title:"Duplicate invoice submission detected across two SAP systems",              env:"PROD", ri:8, st:"New",          cl:"Pending",       ai:2 },
    { score:68, title:"Ghost employee payroll detected — account created post-termination",        env:"QA",   ri:9, st:"Closed",        cl:"True Positive",  ai:3 },
    { score:65, title:"Backdated journal entry 45 days prior — period-end manipulation suspected", env:"PROD", ri:10,st:"Investigating", cl:"Pending",       ai:4 },
    { score:63, title:"Cost center override $180K — unauthorized budget reallocation",            env:"DEV",  ri:11,st:"New",          cl:"Pending",       ai:5 },
    { score:95, title:"Multiple vendor payments routed to single bank account outside SAP",        env:"PROD", ri:0, st:"Investigating", cl:"True Positive",  ai:0 },
    { score:90, title:"Purchase split across 8 orders over 3 days — approval bypass",             env:"QA",   ri:1, st:"AI Assisted",   cl:"Pending",       ai:1 },
    { score:80, title:"Payroll override detected — $45K increase without HR approval",            env:"PROD", ri:3, st:"New",          cl:"Pending",       ai:2 },
    { score:72, title:"Material document reversed 6 times within 7 days — possible fraud",        env:"DEV",  ri:2, st:"Closed",        cl:"False Positive", ai:3 },
    { score:66, title:"Quality inspection overridden for batch — regulatory risk",                env:"QA",   ri:4, st:"Investigating", cl:"Pending",       ai:4 },
    { score:58, title:"Overtime hours recorded 3x normal rate — 22 employees affected",           env:"PROD", ri:5, st:"New",          cl:"Pending",       ai:5 },
    { score:91, title:"Intercompany transaction $1.2M — no matching document in subsidiary",      env:"PROD", ri:6, st:"Investigating", cl:"True Positive",  ai:0 },
    { score:84, title:"Asset disposal without approval — total value $380K",                      env:"QA",   ri:7, st:"AI Assisted",   cl:"Pending",       ai:1 },
    { score:76, title:"Revenue recognition manipulation — $890K recognized early",                env:"PROD", ri:8, st:"New",          cl:"Pending",       ai:2 },
    { score:61, title:"BOM component substitution — lower grade material used, cost difference",  env:"DEV",  ri:9, st:"Closed",        cl:"False Positive", ai:3 },
    { score:55, title:"Training cost anomaly — $48K claimed without attendance records",          env:"QA",   ri:10,st:"Investigating", cl:"Pending",       ai:4 },
    { score:93, title:"GL account override $620K — reclassification without controller approval", env:"PROD", ri:11,st:"New",          cl:"Pending",       ai:5 },
    { score:87, title:"Credit limit bypass in SD — customer order $1.8M over credit line",        env:"PROD", ri:0, st:"Investigating", cl:"True Positive",  ai:0 },
  ];
  return raw.map((r,i)=>({
    id:       `CASE-${String(i+1).padStart(3,"0")}`,
    riskScore: r.score,
    title:    r.title,
    environment: ENVS[i%3],
    ruleId:   RULE_IDS[r.ri],
    ruleName: RULES_REF[r.ri],
    status:   r.st,
    closure:  r.cl,
    assignee: ASSIGNEES[r.ai],
    createdAt: new Date(Date.now()-i*3600000*6).toLocaleString(),
    updatedAt: new Date(Date.now()-i*3600000*2).toLocaleString(),
  }));
}

// ─── Config ────────────────────────────────────────────────────────────────────
const RISK_CLS = (score) => {
  if(score>=90) return { bg:"bg-red-500/20",    text:"text-red-400",    border:"border-red-500/30"    };
  if(score>=70) return { bg:"bg-orange-500/20", text:"text-orange-400", border:"border-orange-500/30" };
  return              { bg:"bg-green-500/20",  text:"text-green-400",  border:"border-green-500/30"  };
};
const STATUS_CLS = {
  "New":          { bg:"bg-blue-500/15",    text:"text-blue-300"    },
  "Investigating":{ bg:"bg-amber-500/15",   text:"text-amber-300"   },
  "AI Assisted":  { bg:"bg-purple-500/15",  text:"text-purple-300"  },
  "Closed":       { bg:"bg-slate-600/40",   text:"text-slate-400"   },
};
const CLOSURE_CLS = {
  "Pending":       { bg:"bg-gray-700/40",    text:"text-gray-400"   },
  "True Positive": { bg:"bg-red-500/15",     text:"text-red-400"    },
  "False Positive":{ bg:"bg-emerald-500/15", text:"text-emerald-400"},
};
const ENV_CLS = { PROD:"bg-red-500/20 text-red-400", QA:"bg-blue-500/20 text-blue-400", DEV:"bg-emerald-500/20 text-emerald-400" };

// ─── Sub-components ────────────────────────────────────────────────────────────
function Chip({ label, className="" }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${className}`}>{label}</span>;
}

function RiskScore({ score }) {
  const c = RISK_CLS(score);
  return (
    <span className={`inline-flex items-center justify-center w-12 h-7 rounded-lg text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>{score}</span>
  );
}

// ─── Case Detail Modal ─────────────────────────────────────────────────────────
function CaseDetailModal({ case: c, onClose, onUpdate }) {
  const [status,  setStatus]  = useState(c.status);
  const [closure, setClosure] = useState(c.closure);
  const [assignee,setAssignee]= useState(c.assignee);

  const handleSave = () => {
    onUpdate(c.id, { status, closure, assignee });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="relative w-full max-w-xl bg-[#13151f] border border-[var(--border)] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-blue-400">{c.id}</span>
              <RiskScore score={c.riskScore}/>
            </div>
            <h2 className="text-sm font-semibold text-[var(--text)] leading-snug">{c.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-white/5 flex-shrink-0 ml-3"><X size={18}/></button>
        </div>

        {/* Meta */}
        <div className="px-6 py-4 grid grid-cols-2 gap-x-6 gap-y-3 border-b border-[var(--border)]">
          <div><p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-1">Environment</p><Chip label={c.environment} className={ENV_CLS[c.environment]}/></div>
          <div><p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-1">Created</p><p className="text-xs text-[var(--text)]">{c.createdAt}</p></div>
          <div><p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-1">Triggered By Rule</p><p className="text-xs text-blue-400 font-mono">{c.ruleId}</p><p className="text-[10px] text-[var(--muted)]">{c.ruleName}</p></div>
          <div><p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-1">Last Updated</p><p className="text-xs text-[var(--text)]">{c.updatedAt}</p></div>
        </div>

        {/* Editable fields */}
        <div className="px-6 py-4 space-y-4 border-b border-[var(--border)]">
          <div>
            <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest mb-1.5">Status</label>
            <select value={status} onChange={e=>setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest mb-1.5">Resolution</label>
            <select value={closure} onChange={e=>setClosure(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              {CLOSURES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest mb-1.5">Assignee</label>
            <select value={assignee} onChange={e=>setAssignee(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              {ASSIGNEES.map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* AI Assistance note */}
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Robot size={16} weight="fill" className="text-purple-400 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-xs font-semibold text-purple-400">AI Investigation Insight</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">This anomaly pattern matches 94% similarity with previously confirmed fraud cases in {c.ruleId}. Recommend cross-referencing vendor master data and payment history.</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex gap-2">
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">Save Changes</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] text-sm hover:bg-white/5">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CaseManagement() {
  const [cases,    setCases]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState("");
  const [statusF,  setStatusF] = useState("All");
  const [closureF, setClosureF]= useState("All");
  const [selected, setSelected]= useState(null); // case for modal

  useEffect(()=>{
    setTimeout(()=>{ setCases(buildCases()); setLoading(false); }, 400);
  },[]);

  const filtered = cases.filter(c=>{
    const q = search.toLowerCase();
    const ms = !q || c.id.toLowerCase().includes(q) || c.ruleName.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
    const ss = statusF==="All"   || c.status===statusF;
    const cs = closureF==="All"  || c.closure===closureF;
    return ms && ss && cs;
  });

  const stats = {
    total: cases.length,
    new:   cases.filter(c=>c.status==="New").length,
    inv:   cases.filter(c=>c.status==="Investigating").length,
    ai:    cases.filter(c=>c.status==="AI Assisted").length,
    closed:cases.filter(c=>c.status==="Closed").length,
  };

  const handleUpdate = (id, updates) => {
    setCases(prev=>prev.map(c=>c.id===id?{...c,...updates,updatedAt:new Date().toLocaleString()}:c));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar/>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar/>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Title */}
          <div>
            <h1 className="text-xl font-semibold text-[var(--text)]">Case Management</h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">Anomaly investigation workflow and case tracking</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label:"TOTAL CASES",  value:stats.total,  cls:"border-[var(--border)]"  },
              { label:"NEW",          value:stats.new,    cls:"border-blue-500/20"       },
              { label:"INVESTIGATING",value:stats.inv,    cls:"border-amber-500/20"      },
              { label:"AI ASSISTED",  value:stats.ai,     cls:"border-purple-500/20"     },
              { label:"CLOSED",       value:stats.closed, cls:"border-emerald-500/20"    },
            ].map(s=>(
              <div key={s.label} className={`p-4 rounded-xl border bg-[var(--card)] ${s.cls}`}>
                <p className="text-[10px] font-semibold text-[var(--muted)] tracking-widest">{s.label}</p>
                <p className="text-2xl font-bold mt-1.5 text-[var(--text)]">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]"/>
              <input
                value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search by Case ID, rule name, or title..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <select value={statusF} onChange={e=>setStatusF(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] min-w-[160px]">
              <option>All</option>{STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
            <select value={closureF} onChange={e=>setClosureF(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] min-w-[180px]">
              <option>All</option>{CLOSURES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <p className="text-xs text-[var(--muted)]">Showing {filtered.length} of {cases.length} cases</p>

          {/* Table */}
          {loading ? (
            <div className="border border-[var(--border)] rounded-xl p-10 flex items-center justify-center gap-3 text-[var(--muted)]">
              <CircleNotch size={20} className="animate-spin text-blue-400"/>
              <span className="text-sm">Loading cases...</span>
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1100px]">
                  <thead className="bg-[#0f1117] border-b border-[var(--border)]">
                    <tr>
                      {["CASE ID","RISK","TITLE","ENVIRONMENT","RULE","STATUS","RESOLUTION","ASSIGNEE","ACTIONS"].map(h=>(
                        <th key={h} className="p-3.5 text-left text-[10px] font-semibold text-[var(--muted)] tracking-widest uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filtered.length===0 && (
                      <tr><td colSpan={9} className="p-10 text-center text-[var(--muted)] text-sm">No cases match your filters.</td></tr>
                    )}
                    {filtered.map(c=>{
                      const sc = STATUS_CLS[c.status]  || STATUS_CLS["New"];
                      const cc = CLOSURE_CLS[c.closure] || CLOSURE_CLS["Pending"];
                      return (
                        <tr key={c.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={()=>setSelected(c)}>
                          <td className="p-3.5"><span className="text-xs font-mono font-semibold text-blue-400">{c.id}</span></td>
                          <td className="p-3.5"><RiskScore score={c.riskScore}/></td>
                          <td className="p-3.5 max-w-[280px]"><p className="text-sm text-[var(--text)] truncate">{c.title}</p></td>
                          <td className="p-3.5"><Chip label={c.environment} className={ENV_CLS[c.environment]}/></td>
                          <td className="p-3.5">
                            <p className="text-xs font-mono text-blue-400">{c.ruleId}</p>
                            <p className="text-[10px] text-[var(--muted)] truncate max-w-[140px]">{c.ruleName}</p>
                          </td>
                          <td className="p-3.5"><Chip label={c.status} className={`${sc.bg} ${sc.text}`}/></td>
                          <td className="p-3.5"><Chip label={c.closure} className={`${cc.bg} ${cc.text}`}/></td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                              <UserCircle size={14}/>{c.assignee}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1" onClick={e=>e.stopPropagation()}>
                              <button onClick={()=>setSelected(c)} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5" title="View"><Eye size={15}/></button>
                              <button onClick={()=>setSelected(c)} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5" title="Edit"><PencilSimple size={15}/></button>
                              {c.status==="New" && <button className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10" title="AI Assist"><Robot size={15}/></button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && <CaseDetailModal case={selected} onClose={()=>setSelected(null)} onUpdate={handleUpdate}/>}
    </div>
  );
}