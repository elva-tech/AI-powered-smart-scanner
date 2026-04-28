/**
 * Dashboard.jsx — Executive Dashboard.
 * SOURCE: detectionsAPI for transactions/anomaly/trend/topRules/sapPerf
 *         casesAPI for cases list only
 *         rulesSlice for donut (live)
 *         securitySlice for security panel (live)
 * casesAPI.fetchDashboardStatsAPI is NOT used — it's a duplicate, detectionsAPI is the source.
 * FIX: detectionFilter passes null when rules not yet loaded (avoids 0 results).
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie,
} from "recharts";
import Sidebar from "../components/layout/Sidebar";
import Topbar  from "../components/layout/Topbar";
import { fetchRules, selectStats } from "../features/rules/rulesSlice";
import { fetchActiveSessions, fetchSecurityStats } from "../features/security/securitySlice";
import { fetchCasesAPI } from "../features/cases/casesApi";
import { fetchDetectionStatsAPI } from "../features/detections/detectionsAPI";
import {
  TrendUp, Warning, Briefcase, ArrowUpRight, ArrowDownRight,
  Books, FolderSimple, ShieldCheck, ChartLine, CheckCircle,
  XCircle, Info, ActivityIcon, CircleNotch,
} from "@phosphor-icons/react";
// ✅ NEW: Import backend services
import { dashboardService } from "../services/dashboardService";
import { sapService } from "../services/sapService";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2035] border border-[var(--border)] rounded-xl px-3 py-2.5 shadow-2xl">
      {label && <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-[12px] font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.value > 1000 ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

const RISK_TEXT  = s => s>=90?"text-red-400":s>=75?"text-orange-400":s>=60?"text-yellow-400":"text-green-400";
const STATUS_CLS = {
  "New":          "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  "Investigating":"bg-amber-500/20 text-amber-300 border border-amber-500/30",
  "AI Assisted":  "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  "Closed":       "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  "Escalated":    "bg-red-500/20 text-red-300 border border-red-500/30",
};
const MODULE_CLS = {
  FI:"bg-indigo-500/20 text-indigo-300", MM:"bg-violet-500/20 text-violet-300",
  SD:"bg-cyan-500/20 text-cyan-300",     CO:"bg-teal-500/20 text-teal-300",
  PP:"bg-blue-500/20 text-blue-300",     HR:"bg-orange-500/20 text-orange-300",
  Multi:"bg-gray-500/20 text-gray-300",
};

function KpiCard({ label, value, sub, subCls, Icon, iconCls, onClick, loading }) {
  return (
    <button onClick={onClick}
      className="text-left w-full p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50 hover:bg-white/[0.03] transition-all cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest">{label}</p>
          {loading
            ? <div className="mt-2 h-9 flex items-center"><CircleNotch size={18} className="animate-spin text-[var(--muted)]"/></div>
            : <p className="text-[2.2rem] font-bold text-[var(--text)] leading-none mt-2">{value}</p>
          }
          {!loading && sub && <p className={`text-[11px] mt-1.5 ${subCls}`}>{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconCls}`}>
            <Icon size={18} weight="fill"/>
          </div>
        )}
      </div>
    </button>
  );
}

function Panel({ title, icon: Icon, iconCls="text-teal-400", topRight, children, onClick }) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden ${onClick?"hover:border-[var(--primary)]/40 transition-all cursor-pointer":""}`} onClick={onClick}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className={iconCls}/>}
          <h3 className="text-[13px] font-semibold text-[var(--text)]">{title}</h3>
        </div>
        {topRight}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const ruleStats = useSelector(selectStats);
  const rulesAll  = useSelector(s => s.rules.list);
  const secStats  = useSelector(s => s.security.stats);

  const [cases,   setCases]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ✅ NEW: Backend connection state
  const [sapConnectionStatus, setSapConnectionStatus] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Only filter by active rule IDs if rules are loaded AND some are active/deployed.
  // Pass null otherwise so detectionsAPI uses full dataset (not empty array = 0).
  const activeRuleIds = rulesAll
    .filter(r => r.status === "ACTIVE" || r.status === "DEPLOYED")
    .map(r => r.id);
  const detectionFilter = (rulesAll.length > 0 && activeRuleIds.length > 0) ? activeRuleIds : null;
  const activeKey = [...activeRuleIds].sort().join(",");

  // Initial load
  useEffect(() => {
    dispatch(fetchRules());
    dispatch(fetchSecurityStats());
    dispatch(fetchActiveSessions());
    fetchCasesAPI().then(r => { if (r.success) setCases(r.data); });
    
    // ✅ NEW: Call backend APIs
    setupBackendIntegration();
  }, [dispatch]);

  // ✅ NEW: Setup backend integration
  const setupBackendIntegration = async () => {
    try {
      // Test SAP connection
      const connectionResult = await sapService.testConnection();
      setSapConnectionStatus(connectionResult);
      
      // Get real-time dashboard data
      const dashboardResult = await dashboardService.getDashboardData();
      if (dashboardResult.status === 'success') {
        setRealtimeData(dashboardResult.data);
      } else {
        setApiError(dashboardResult.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Backend API error:', error);
      setApiError(error.message);
    }
  };

  // ✅ NEW: Subscribe to real-time updates (SSE streaming)
  useEffect(() => {
    const unsubscribe = dashboardService.streamRealtimeUpdates(
      (newData) => {
        setRealtimeData(newData);
        setLoading(false);
      },
      (error) => {
        console.error('Real-time streaming error:', error);
        setApiError(error.message);
      }
    );

    return () => {
      // Cleanup subscription
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Re-fetch detection stats when active rules change
  useEffect(() => {
    setLoading(true);
    fetchDetectionStatsAPI(detectionFilter).then(r => {
      if (r.success) setStats(r.data);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, rulesAll.length]);

  // ── Case counts ───────────────────────────────────────────────────────────
  const cc = {
    total:     cases.length,
    new:       cases.filter(c=>c.status==="New").length,
    inv:       cases.filter(c=>c.status==="Investigating").length,
    ai:        cases.filter(c=>c.status==="AI Assisted").length,
    escalated: cases.filter(c=>c.status==="Escalated").length,
    closed:    cases.filter(c=>c.status==="Closed").length,
    confirmed: cases.filter(c=>c.closureStatus==="Confirmed").length,
    fp:        cases.filter(c=>c.closureStatus==="False Positive").length,
    noAction:  cases.filter(c=>c.closureStatus==="No Action").length,
  };
  const closureRate = cc.total>0 ? ((cc.closed/cc.total)*100).toFixed(1) : "0.0";
  const pct = n => cc.closed>0 ? `${((n/cc.closed)*100).toFixed(1)}% of closed` : "0.0% of closed";

  const donutData = [
    { name:"Active",   value:ruleStats.active    ||0, fill:"#14b8a6" },
    { name:"Deployed", value:ruleStats.deployed  ||0, fill:"#3b82f6" },
    { name:"QA/Sim",   value:ruleStats.simulation||0, fill:"#f59e0b" },
    { name:"Draft",    value:ruleStats.draft     ||0, fill:"#6b7280" },
  ];
  const barData = [
    { name:"New",          value:cc.new,      fill:"#3b82f6" },
    { name:"Investigating",value:cc.inv,       fill:"#f59e0b" },
    { name:"AI-Assisted",  value:cc.ai,        fill:"#a855f7" },
    { name:"Escalated",    value:cc.escalated, fill:"#ef4444" },
  ];

  const txn      = stats?.transactions;
  const anomaly  = stats?.anomalyFlags;
  const topRules = stats?.topRules      || [];
  const trend    = stats?.anomalyTrend  || [];
  const sapPerf  = stats?.sapPerformance|| [];
  const highPriority = [...cases].sort((a,b)=>b.riskScore-a.riskScore).slice(0,5);
  const toCase = (filter) => navigate("/cases", { state: filter ? { statusFilter:filter } : undefined });

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar/>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar/>
        <div className="flex-1 overflow-y-auto" style={{scrollbarWidth:"none"}}>
          <div className="px-6 py-5 space-y-5 pb-8">

            {/* ✅ NEW: SAP Connection Status & Error Display */}
            {apiError && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-[12px]">
                ⚠️ API Error: {apiError}
              </div>
            )}
            
            {sapConnectionStatus && sapConnectionStatus.status === 'connected' && (
              <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[12px]">
                ✓ SAP Connected • Badge: {sapConnectionStatus.badge} • Notifications: {sapConnectionStatus.notifications}
              </div>
            )}

            <div>
              <h1 className="text-[18px] font-semibold text-[var(--text)]">Executive Dashboard</h1>
              <p className="text-[12px] text-[var(--muted)] mt-0.5">Real-time anomaly detection and governance overview</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <KpiCard label="TOTAL TRANSACTIONS" value={txn?.displayValue||"—"} loading={loading&&!txn}
                sub={txn?`${txn.changePercent>=0?"+":""}${txn.changePercent}% vs last month`:""} subCls={txn?.trend==="up"?"text-emerald-400":"text-red-400"}
                Icon={ActivityIcon} iconCls="text-teal-400 border-teal-500/25 bg-teal-500/10" onClick={()=>{}}/>
              <KpiCard label="ANOMALY FLAGS" value={anomaly?.displayValue||"—"} loading={loading&&!anomaly}
                sub={anomaly?`${anomaly.changePercent>=0?"+":""}${anomaly.changePercent}% vs last month`:""} subCls={anomaly?.trend==="down"?"text-emerald-400":"text-red-400"}
                Icon={Warning} iconCls="text-amber-400 border-amber-500/25 bg-amber-500/10" onClick={()=>toCase()}/>
              <KpiCard label="ACTIVE CASES" value={String(cc.total)} sub={`${cc.new} new cases`} subCls="text-[var(--muted)]"
                Icon={Briefcase} iconCls="text-blue-400 border-blue-500/25 bg-blue-500/10" onClick={()=>toCase()}/>
            </div>

            <div>
              <h2 className="text-[13px] font-semibold text-[var(--text)] mb-3">Case Closure Analytics</h2>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label:"TOTAL CLOSED",   val:cc.closed,    sub:`${closureRate}% of total`, Icon:ChartLine,  onClick:()=>toCase("Closed") },
                  { label:"CONFIRMED",      val:cc.confirmed, sub:pct(cc.confirmed),           Icon:CheckCircle,onClick:()=>toCase("Closed") },
                  { label:"FALSE POSITIVE", val:cc.fp,        sub:pct(cc.fp),                  Icon:XCircle,    iconCls:"text-orange-400", onClick:()=>toCase("Closed") },
                  { label:"NO ACTION",      val:cc.noAction,  sub:pct(cc.noAction),             Icon:Info,       iconCls:"text-[var(--muted)]", onClick:()=>toCase("Closed") },
                  { label:"CLOSURE RATE",   val:`${closureRate}%`, sub:`${cc.total-cc.closed} open`, Icon:TrendUp, valCls:"text-blue-400", iconCls:"text-blue-400", onClick:()=>toCase() },
                ].map((c,i)=>(
                  <button key={i} onClick={c.onClick} className="text-left p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50 hover:bg-white/[0.025] transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-semibold text-[var(--muted)] uppercase tracking-widest">{c.label}</p>
                      <c.Icon size={13} className={c.iconCls||"text-teal-400"}/>
                    </div>
                    <p className={`text-[1.8rem] font-bold leading-none ${c.valCls||"text-[var(--text)]"}`}>{c.val}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-1.5">{c.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Panel title="Rule Library Status" icon={Books}
                topRight={<button onClick={e=>{e.stopPropagation();navigate("/rules");}} className="text-[11px] text-blue-400 hover:underline">View All →</button>}
                onClick={()=>navigate("/rules")}>
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={155}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={2}>
                        {donutData.map((d,i)=><Cell key={i} fill={d.fill} opacity={0.9}/>)}
                      </Pie>
                      <Tooltip content={<CustomTooltip/>}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                    {donutData.map((d,i)=>(
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:d.fill}}/>{d.name}: {d.value}
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel title="Case Management" icon={FolderSimple}
                topRight={<button onClick={e=>{e.stopPropagation();toCase();}} className="text-[11px] text-blue-400 hover:underline">View All →</button>}
                onClick={()=>toCase()}>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={barData} margin={{top:0,right:0,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:"rgba(255,255,255,0.4)"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:"rgba(255,255,255,0.4)"}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CustomTooltip/>} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
                    <Bar dataKey="value" radius={[4,4,0,0]} maxBarSize={48}>{barData.map((d,i)=><Cell key={i} fill={d.fill}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Security Overview" icon={ShieldCheck}
                topRight={<button onClick={e=>{e.stopPropagation();navigate("/security");}} className="text-[11px] text-blue-400 hover:underline">View →</button>}
                onClick={()=>navigate("/security")}>
                <div className="space-y-3.5">
                  {[
                    { label:"Active Sessions",    value:secStats?.activeSessions||0,  badge:"+3 vs 1h ago",  badgeCls:"bg-emerald-500/20 text-emerald-400" },
                    { label:"Failed Logins (1h)", value:secStats?.failedLogins1h||0,  badge:"2 IPs blocked", badgeCls:"bg-orange-500/20 text-orange-400"   },
                    { label:"WAF Blocks (24h)",   value:secStats?.wafBlocked||0,      badge:"+12% vs avg",   badgeCls:"bg-blue-500/20 text-blue-400"        },
                    { label:"DLP Alerts",          value:secStats?.dlpAlerts||0,       badge:"No incidents",  badgeCls:"bg-emerald-500/20 text-emerald-400"  },
                  ].map((s,i)=>(
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                        <p className="text-[17px] font-bold text-[var(--text)]">{s.value}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${s.badgeCls}`}>{s.badge}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Panel title="Anomaly Detection Trend">
                {loading&&!trend.length ? (
                  <div className="flex items-center justify-center h-[180px]"><CircleNotch size={16} className="animate-spin text-blue-400"/></div>
                ) : (
                  <ResponsiveContainer width="100%" height={190}>
                    <AreaChart data={trend} margin={{top:5,right:10,left:-22,bottom:0}}>
                      <defs>
                        <linearGradient id="gDet"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/></linearGradient>
                        <linearGradient id="gBase" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.25}/><stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false}/>
                      <XAxis dataKey="label" tick={{fontSize:11,fill:"rgba(255,255,255,0.4)"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:11,fill:"rgba(255,255,255,0.4)"}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Area type="monotone" dataKey="detected" name="Detected" stroke="#ef4444" strokeWidth={2} fill="url(#gDet)"/>
                      <Area type="monotone" dataKey="baseline" name="Baseline" stroke="#14b8a6" strokeWidth={2} fill="url(#gBase)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              <Panel title="SAP Performance Impact">
                {loading&&!sapPerf.length ? (
                  <div className="flex items-center justify-center h-[180px]"><CircleNotch size={16} className="animate-spin text-blue-400"/></div>
                ) : (
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={sapPerf} margin={{top:5,right:10,left:-22,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false}/>
                      <XAxis dataKey="time" tick={{fontSize:11,fill:"rgba(255,255,255,0.4)"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:11,fill:"rgba(255,255,255,0.4)"}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Line type="monotone" dataKey="throughput" name="Throughput" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
                      <Line type="monotone" dataKey="latency"    name="Latency"    stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Panel>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h3 className="text-[13px] font-semibold text-[var(--text)]">Top Rules by Detection (24h)</h3>
                <button onClick={()=>navigate("/rules")} className="text-[11px] text-blue-400 hover:underline">View All Rules →</button>
              </div>
              {loading&&!topRules.length ? (
                <div className="p-8 flex items-center justify-center gap-2"><CircleNotch size={14} className="animate-spin text-blue-400"/><span className="text-sm text-[var(--muted)]">Loading...</span></div>
              ) : topRules.length===0 ? (
                <div className="p-8 text-center text-[var(--muted)] text-sm">No detections in last 24h.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                    {["RULE NAME","DETECTIONS","SAP MODULE","TREND"].map(h=>(
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--muted)] tracking-widest uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {topRules.map((r,i)=>(
                      <tr key={i} className="hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={()=>navigate("/rules")}>
                        <td className="px-4 py-3 text-[13px] text-[var(--text)]">{r.name}</td>
                        <td className="px-4 py-3 text-[13px] font-bold text-[var(--text)]">{r.detections}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${MODULE_CLS[r.module]||"bg-gray-500/20 text-gray-300"}`}>{r.module}</span></td>
                        <td className="px-4 py-3">
                          {r.trend==="up"   && <ArrowUpRight  size={16} className="text-emerald-400"/>}
                          {r.trend==="down" && <ArrowDownRight size={16} className="text-red-400"/>}
                          {r.trend==="flat" && <span className="text-[var(--muted)] font-bold">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden mb-2">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h3 className="text-[13px] font-semibold text-[var(--text)]">High-Priority Cases</h3>
                <button onClick={()=>toCase()} className="text-[11px] text-blue-400 hover:underline">View All Cases →</button>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                  {["CASE ID","DESCRIPTION","RISK","STATUS"].map(h=>(
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--muted)] tracking-widest uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {highPriority.map((c,i)=>(
                    <tr key={i} onClick={()=>toCase()} className="hover:bg-white/[0.025] cursor-pointer transition-colors">
                      <td className="px-4 py-3 text-[12px] font-mono text-[var(--text)]">{c.id}</td>
                      <td className="px-4 py-3 text-[13px] text-[var(--text)] max-w-[400px] truncate">{c.title}</td>
                      <td className="px-4 py-3"><span className={`text-[14px] font-bold ${RISK_TEXT(c.riskScore)}`}>{c.riskScore}%</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold ${STATUS_CLS[c.status]||STATUS_CLS["New"]}`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}