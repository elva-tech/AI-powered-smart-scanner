
/**
 * rulesAPI.js — Mock backend layer.
 * Replace await delay() + return with real fetch() calls when backend is ready.
 * ALL return shapes mirror the exact API contract.
 */

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let RULES_CACHE = JSON.parse(localStorage.getItem("rules")) || null;

// ─── 100 Rules ────────────────────────────────────────────────────────────────
const DEFS = [
  { m: "CO", n: "Ghost Vendor Analysis", d: "Detects ghost vendor manipulation patterns in CO module transactions", a: 50000, f: 5, tw: 30, v: 15 },
  { m: "SD", n: "Split Purchase Order", d: "Detects split purchase order fraud patterns in SD module transactions", a: 100000, f: 30, tw: 90, v: 25 },
  { m: "MM", n: "Price Variance Threshold", d: "Detects price variance anomalies beyond threshold in MM module transactions", a: 25000, f: 5, tw: 14, v: 10 },
  { m: "PP", n: "Vendor Master Anomaly", d: "Detects vendor master anomaly patterns in PP module transactions", a: 75000, f: 15, tw: 60, v: 20 },
  { m: "HR", n: "Invoice Manipulation", d: "Detects invoice manipulation patterns in HR module transactions", a: 5000, f: 3, tw: 7, v: 30 },
  { m: "PM", n: "Journal Entry Reversal", d: "Detects journal entry reversal patterns in PM module transactions", a: 30000, f: 8, tw: 45, v: 12 },
  { m: "QM", n: "Budget Overrun Alert", d: "Detects budget overrun alert patterns in QM module transactions", a: 10000, f: 20, tw: 21, v: 8 },
  { m: "FI", n: "Segregation of Duties", d: "Detects segregation of duties violations in FI module transactions", a: 200000, f: 2, tw: 180, v: 5 },
  { m: "CO", n: "Unusual Time Entry Pattern", d: "Detects unusual time entry patterns in CO module transactions", a: 0, f: 10, tw: 7, v: 50 },
  { m: "SD", n: "Material Movement Anomaly", d: "Detects material movement anomaly patterns in SD module transactions", a: 80000, f: 25, tw: 60, v: 20 },
  { m: "MM", n: "Duplicate Invoice Detection", d: "Detects duplicate invoice submissions in MM module transactions", a: 10000, f: 2, tw: 30, v: 0 },
  { m: "PP", n: "Production Order Cost Override", d: "Detects production order cost override patterns in PP module transactions", a: 150000, f: 10, tw: 90, v: 15 },
  { m: "HR", n: "Ghost Employee Detection", d: "Detects ghost employee payroll patterns in HR module transactions", a: 8000, f: 1, tw: 30, v: 0 },
  { m: "PM", n: "Asset Disposal Fraud", d: "Detects fraudulent asset disposal patterns in PM module transactions", a: 50000, f: 3, tw: 90, v: 10 },
  { m: "QM", n: "Quality Hold Override", d: "Detects unauthorized quality hold override patterns in QM transactions", a: 15000, f: 5, tw: 14, v: 5 },
  { m: "FI", n: "Backdated Entry Detection", d: "Detects backdated journal entry patterns in FI module transactions", a: 50000, f: 3, tw: 365, v: 0 },
  { m: "CO", n: "Budget Variance Manipulation", d: "Detects budget variance manipulation in CO controlling transactions", a: 100000, f: 3, tw: 90, v: 25 },
  { m: "SD", n: "Customer Credit Override", d: "Detects unauthorized customer credit override patterns in SD module", a: 200000, f: 10, tw: 30, v: 15 },
  { m: "MM", n: "Vendor Master Change Alert", d: "Detects suspicious vendor master data changes in MM module transactions", a: 0, f: 5, tw: 1, v: 0 },
  { m: "PP", n: "BOM Manipulation Detection", d: "Detects bill of materials manipulation patterns in PP module transactions", a: 20000, f: 8, tw: 30, v: 10 },
  { m: "HR", n: "Overtime Threshold Breach", d: "Detects overtime threshold breach patterns in HR module transactions", a: 3000, f: 20, tw: 7, v: 40 },
  { m: "PM", n: "Maintenance Order Abuse", d: "Detects maintenance order cost abuse patterns in PM module transactions", a: 25000, f: 12, tw: 30, v: 20 },
  { m: "QM", n: "Inspection Lot Manipulation", d: "Detects inspection lot result manipulation in QM module transactions", a: 5000, f: 15, tw: 7, v: 0 },
  { m: "FI", n: "Rounding Manipulation", d: "Detects systematic rounding manipulation patterns in FI module transactions", a: 1, f: 100, tw: 30, v: 0 },
  { m: "CO", n: "Cost Center Override", d: "Detects unauthorized cost center override patterns in CO module transactions", a: 75000, f: 5, tw: 30, v: 20 },
  { m: "SD", n: "Pricing Condition Manipulation", d: "Detects pricing condition manipulation patterns in SD module transactions", a: 50000, f: 20, tw: 14, v: 30 },
  { m: "MM", n: "Purchase Order Split", d: "Detects purchase order split to avoid approval thresholds in MM transactions", a: 50000, f: 10, tw: 7, v: 5 },
  { m: "PP", n: "Routing Time Fraud", d: "Detects routing time manipulation patterns in PP module transactions", a: 10000, f: 25, tw: 14, v: 35 },
  { m: "HR", n: "Expense Report Fraud", d: "Detects fraudulent expense report patterns in HR module transactions", a: 2000, f: 5, tw: 30, v: 50 },
  { m: "PM", n: "Equipment Master Manipulation", d: "Detects equipment master data manipulation in PM module transactions", a: 100000, f: 2, tw: 30, v: 0 },
  { m: "QM", n: "Certificate Fraud Detection", d: "Detects fraudulent quality certificate patterns in QM module transactions", a: 0, f: 5, tw: 7, v: 0 },
  { m: "FI", n: "Payment Terms Abuse", d: "Detects payment terms abuse patterns in FI module transactions", a: 100000, f: 8, tw: 90, v: 0 },
  { m: "CO", n: "Profit Center Fraud", d: "Detects profit center allocation fraud patterns in CO module transactions", a: 200000, f: 3, tw: 90, v: 10 },
  { m: "SD", n: "Delivery Tolerance Abuse", d: "Detects delivery tolerance abuse patterns in SD module transactions", a: 30000, f: 50, tw: 60, v: 15 },
  { m: "MM", n: "Invoice Tolerance Abuse", d: "Detects invoice tolerance abuse patterns in MM module transactions", a: 5000, f: 15, tw: 30, v: 5 },
  { m: "PP", n: "Capacity Planning Abuse", d: "Detects capacity planning manipulation in PP module transactions", a: 50000, f: 10, tw: 30, v: 25 },
  { m: "HR", n: "Benefit Manipulation", d: "Detects unauthorized benefit manipulation patterns in HR module transactions", a: 1500, f: 3, tw: 90, v: 0 },
  { m: "PM", n: "Work Order Cost Fraud", d: "Detects work order cost fraud patterns in PM module transactions", a: 15000, f: 8, tw: 14, v: 20 },
  { m: "QM", n: "Usage Decision Override", d: "Detects unauthorized usage decision overrides in QM module transactions", a: 20000, f: 10, tw: 7, v: 0 },
  { m: "FI", n: "Advance Payment Fraud", d: "Detects advance payment fraud patterns in FI module transactions", a: 150000, f: 3, tw: 30, v: 0 },
  { m: "CO", n: "Transfer Price Manipulation", d: "Detects transfer pricing manipulation patterns in CO module transactions", a: 500000, f: 2, tw: 90, v: 10 },
  { m: "SD", n: "Return Order Fraud", d: "Detects fraudulent return order patterns in SD module transactions", a: 25000, f: 20, tw: 30, v: 0 },
  { m: "MM", n: "Goods Receipt Manipulation", d: "Detects goods receipt manipulation patterns in MM module transactions", a: 50000, f: 8, tw: 14, v: 10 },
  { m: "PP", n: "Confirmation Backdating", d: "Detects production confirmation backdating in PP module transactions", a: 0, f: 5, tw: 30, v: 0 },
  { m: "HR", n: "Payroll Override Detection", d: "Detects unauthorized payroll override patterns in HR module transactions", a: 10000, f: 2, tw: 30, v: 0 },
  { m: "PM", n: "Technical Object Abuse", d: "Detects technical object master abuse in PM module transactions", a: 0, f: 10, tw: 7, v: 0 },
  { m: "QM", n: "Sampling Procedure Abuse", d: "Detects sampling procedure abuse patterns in QM module transactions", a: 5000, f: 30, tw: 7, v: 0 },
  { m: "FI", n: "Bank Reconciliation Override", d: "Detects bank reconciliation override patterns in FI module transactions", a: 50000, f: 5, tw: 30, v: 0 },
  { m: "CO", n: "Internal Order Abuse", d: "Detects internal order cost abuse patterns in CO module transactions", a: 80000, f: 10, tw: 60, v: 20 },
  { m: "SD", n: "Free Goods Manipulation", d: "Detects free goods manipulation patterns in SD module transactions", a: 10000, f: 40, tw: 30, v: 0 },
  { m: "MM", n: "Material Document Reversal", d: "Detects suspicious material document reversal patterns in MM transactions", a: 30000, f: 5, tw: 7, v: 0 },
  { m: "PP", n: "Material Scrap Manipulation", d: "Detects material scrap manipulation patterns in PP module transactions", a: 15000, f: 20, tw: 30, v: 30 },
  { m: "HR", n: "Time Recording Fraud", d: "Detects time recording fraud patterns in HR module transactions", a: 0, f: 50, tw: 7, v: 0 },
  { m: "PM", n: "Counter Reading Manipulation", d: "Detects counter reading manipulation in PM module transactions", a: 0, f: 10, tw: 30, v: 50 },
  { m: "QM", n: "Defect Recording Manipulation", d: "Detects defect recording manipulation patterns in QM module transactions", a: 5000, f: 20, tw: 14, v: 0 },
  { m: "FI", n: "Fixed Asset Manipulation", d: "Detects fixed asset manipulation patterns in FI module transactions", a: 300000, f: 2, tw: 180, v: 0 },
  { m: "CO", n: "Activity Rate Manipulation", d: "Detects activity rate manipulation patterns in CO module transactions", a: 20000, f: 15, tw: 30, v: 25 },
  { m: "SD", n: "Rebate Agreement Bypass", d: "Detects rebate agreement bypass patterns in SD module transactions", a: 75000, f: 10, tw: 90, v: 15 },
  { m: "MM", n: "Stock Transfer Fraud", d: "Detects fraudulent stock transfer patterns in MM module transactions", a: 40000, f: 8, tw: 7, v: 10 },
  { m: "PP", n: "Work Center Override", d: "Detects work center capacity override patterns in PP module transactions", a: 30000, f: 12, tw: 30, v: 20 },
  { m: "HR", n: "Leave Balance Manipulation", d: "Detects leave balance manipulation patterns in HR module transactions", a: 0, f: 5, tw: 30, v: 0 },
  { m: "PM", n: "Functional Location Fraud", d: "Detects functional location master fraud in PM module transactions", a: 0, f: 5, tw: 7, v: 0 },
  { m: "QM", n: "Quality Score Override", d: "Detects quality score override patterns in QM module transactions", a: 10000, f: 8, tw: 7, v: 0 },
  { m: "FI", n: "GL Account Override", d: "Detects GL account override patterns in FI module transactions", a: 100000, f: 5, tw: 30, v: 0 },
  { m: "CO", n: "Statistical Key Fraud", d: "Detects statistical key figure fraud in CO module transactions", a: 0, f: 20, tw: 30, v: 40 },
  { m: "SD", n: "Revenue Recognition Fraud", d: "Detects revenue recognition fraud patterns in SD module transactions", a: 250000, f: 5, tw: 90, v: 10 },
  { m: "MM", n: "Inventory Write-off Abuse", d: "Detects inventory write-off abuse patterns in MM module transactions", a: 20000, f: 3, tw: 30, v: 0 },
  { m: "PP", n: "Process Order Fraud", d: "Detects process order manipulation patterns in PP module transactions", a: 80000, f: 8, tw: 30, v: 15 },
  { m: "HR", n: "Bonus Override Detection", d: "Detects unauthorized bonus override patterns in HR module transactions", a: 25000, f: 2, tw: 90, v: 0 },
  { m: "PM", n: "Measurement Doc Override", d: "Detects measurement document override patterns in PM module transactions", a: 0, f: 10, tw: 30, v: 60 },
  { m: "QM", n: "Characteristic Override", d: "Detects inspection characteristic override patterns in QM transactions", a: 0, f: 15, tw: 14, v: 0 },
  { m: "FI", n: "Write-off Threshold Breach", d: "Detects write-off threshold breach patterns in FI module transactions", a: 10000, f: 5, tw: 30, v: 0 },
  { m: "CO", n: "Plan vs Actual Override", d: "Detects plan vs actual override patterns in CO module transactions", a: 150000, f: 5, tw: 90, v: 20 },
  { m: "SD", n: "Customer Master Override", d: "Detects customer master override patterns in SD module transactions", a: 0, f: 5, tw: 1, v: 0 },
  { m: "MM", n: "Purchase Req Override", d: "Detects purchase requisition override patterns in MM module transactions", a: 30000, f: 10, tw: 7, v: 0 },
  { m: "PP", n: "Component Substitution Fraud", d: "Detects component substitution fraud patterns in PP module transactions", a: 50000, f: 8, tw: 30, v: 25 },
  { m: "HR", n: "Recruitment Fraud Detection", d: "Detects recruitment fraud patterns in HR module transactions", a: 15000, f: 3, tw: 30, v: 0 },
  { m: "PM", n: "Task List Manipulation", d: "Detects task list manipulation patterns in PM module transactions", a: 10000, f: 10, tw: 14, v: 15 },
  { m: "QM", n: "Catalog Entry Manipulation", d: "Detects catalog entry manipulation patterns in QM module transactions", a: 0, f: 20, tw: 7, v: 0 },
  { m: "FI", n: "Intercompany Manipulation", d: "Detects intercompany manipulation patterns in FI module transactions", a: 500000, f: 3, tw: 90, v: 5 },
  { m: "CO", n: "Assessment Cycle Bypass", d: "Detects assessment cycle bypass patterns in CO module transactions", a: 80000, f: 3, tw: 30, v: 10 },
  { m: "SD", n: "Output Tax Manipulation", d: "Detects output tax manipulation patterns in SD module transactions", a: 50000, f: 5, tw: 30, v: 0 },
  { m: "MM", n: "Contract Deviation Detection", d: "Detects contract price deviation patterns in MM module transactions", a: 25000, f: 8, tw: 90, v: 10 },
  { m: "PP", n: "Planned Order Manipulation", d: "Detects planned order manipulation patterns in PP module transactions", a: 40000, f: 15, tw: 30, v: 20 },
  { m: "HR", n: "Termination Date Manipulation", d: "Detects termination date manipulation patterns in HR module transactions", a: 0, f: 2, tw: 7, v: 0 },
  { m: "PM", n: "Calibration Override", d: "Detects calibration override patterns in PM module transactions", a: 5000, f: 5, tw: 30, v: 0 },
  { m: "QM", n: "Control Chart Fraud", d: "Detects control chart manipulation patterns in QM module transactions", a: 0, f: 25, tw: 14, v: 0 },
  { m: "FI", n: "Currency Rounding Fraud", d: "Detects currency rounding fraud patterns in FI module transactions", a: 1, f: 200, tw: 30, v: 0 },
  { m: "CO", n: "Settlement Rule Fraud", d: "Detects settlement rule manipulation patterns in CO module transactions", a: 100000, f: 3, tw: 90, v: 15 },
  { m: "SD", n: "Credit Limit Bypass", d: "Detects credit limit bypass patterns in SD module transactions", a: 300000, f: 5, tw: 30, v: 0 },
  { m: "MM", n: "Info Record Manipulation", d: "Detects purchase info record manipulation in MM module transactions", a: 20000, f: 5, tw: 14, v: 15 },
  { m: "PP", n: "MRP Exception Abuse", d: "Detects MRP exception message abuse in PP module transactions", a: 60000, f: 20, tw: 7, v: 0 },
  { m: "HR", n: "Training Cost Abuse", d: "Detects training cost abuse patterns in HR module transactions", a: 3000, f: 5, tw: 90, v: 0 },
  { m: "PM", n: "Notification Override", d: "Detects notification override patterns in PM module transactions", a: 0, f: 15, tw: 7, v: 0 },
  { m: "QM", n: "Specification Override", d: "Detects specification override patterns in QM module transactions", a: 10000, f: 8, tw: 7, v: 0 },
  { m: "FI", n: "Clearing Account Abuse", d: "Detects clearing account abuse patterns in FI module transactions", a: 80000, f: 5, tw: 30, v: 0 },
  { m: "CO", n: "CO-PA Data Manipulation", d: "Detects CO-PA data manipulation patterns in CO module transactions", a: 200000, f: 5, tw: 90, v: 10 },
  { m: "SD", n: "Sales Order Backdating", d: "Detects sales order backdating patterns in SD module transactions", a: 50000, f: 10, tw: 30, v: 0 },
  { m: "MM", n: "Valuation Class Change", d: "Detects suspicious valuation class change patterns in MM module transactions", a: 100000, f: 2, tw: 30, v: 0 },
  { m: "PP", n: "Phantom Production Report", d: "Detects phantom production reporting patterns in PP module transactions", a: 40000, f: 10, tw: 14, v: 20 },
];

const RISKS = ["HIGH", "MEDIUM", "LOW", "CRITICAL"];


export function buildRules() {
  if (RULES_CACHE) return RULES_CACHE;

  const rules = DEFS.map((def, i) => {
    const num = i + 1;
    return {
      id: `RULE-${String(num).padStart(3, "0")}`,
      name: `${def.m}-${def.n}-${num}`,
      description: def.d,
      status: "DRAFT",
      lifecycle: "DRAFT",
      module: def.m,
      risk: RISKS[i % 4],
      version: "1.0.0",
      origin: "System",
      createdDate: "2025-01-15",
      createdBy: "System Rule",
      thresholds: { amountThreshold: def.a, frequencyLimit: def.f, timeWindow: def.tw, varianceThreshold: def.v },
      simulationHistory: [],
      deployedEnv: null,
      activatedAt: null,
    };
  });
  RULES_CACHE = rules;
  localStorage.setItem("rules", JSON.stringify(RULES_CACHE));

  return rules;
}

export const SIM_ENVIRONMENTS = [
  { id: "DEV", name: "Development (DEV)", systemId: "SAP-DEV-001", desc: "Testing environment with synthetic data and full access permissions", badge: null, isLive: false, status: "Online", lastSync: "2 min ago" },
  { id: "QA", name: "Quality Assurance (QA)", systemId: "SAP-QA-001", desc: "Pre-production environment with sanitized production data for validation", badge: null, isLive: false, status: "Online", lastSync: "5 min ago" },
  { id: "STG", name: "Staging (STG)", systemId: "SAP-STG-001", desc: "Mirror of production environment for final testing before deployment", badge: null, isLive: false, status: "Online", lastSync: "1 min ago" },
  { id: "PROD", name: "Production (PROD)", systemId: "SAP-PRD-001", desc: "Live production environment with real transaction data — use with caution", badge: "LIVE", isLive: true, status: "Online", lastSync: "Real-time" },
];

export const DEPLOY_ENVIRONMENTS = [
  { id: "DEV", name: "Development (DEV)", desc: "Deploy to development environment for initial testing and validation", badge: "Safe", badgeCls: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30", iconCls: "text-emerald-400" },
  { id: "QAS", name: "QA / Testing (QAS)", desc: "Deploy to QA environment for thorough testing before production", badge: "Staging", badgeCls: "text-blue-400 bg-blue-500/20 border-blue-500/30", iconCls: "text-blue-400" },
  { id: "PROD", name: "Production (PRD)", desc: "Deploy active rule to production environment for archival", badge: "Live", badgeCls: "text-red-400 bg-red-500/20 border-red-500/30", iconCls: "text-red-400", isProd: true },
];

export const fetchRulesAPI = async () => { await delay(400); return { success: true, data: buildRules() }; };
// export const fetchEnvironmentsAPI = async () => { await delay(200); return { success: true, simEnvs: SIM_ENVIRONMENTS, deployEnvs: DEPLOY_ENVIRONMENTS }; };

const BUILTIN_STORAGE_KEY = "sap_builtins_v1";
const BUILTIN_ID_TO_DEPLOY = { __DEV__: "DEV", __QAS__: "QAS", __PROD__: "PROD" };

function loadBuiltinRowsForDeploy() {
  try {
    const raw = localStorage.getItem(BUILTIN_STORAGE_KEY);
    if (raw === null || raw === undefined) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function mergeDeployEnvsWithBuiltins(customServers) {
  const rows = loadBuiltinRowsForDeploy();
  let base = DEPLOY_ENVIRONMENTS.map((d) => ({ ...d }));
  if (rows !== null) {
    const allowed = new Set(
      rows.map((b) => BUILTIN_ID_TO_DEPLOY[b.id]).filter(Boolean)
    );
    base = base.filter((d) => allowed.has(d.id));
    base = base.map((d) => {
      const pair = Object.entries(BUILTIN_ID_TO_DEPLOY).find(([, dep]) => dep === d.id);
      if (!pair) return d;
      const [builtinId] = pair;
      const b = rows.find((x) => x.id === builtinId);
      if (!b) return d;
      return { ...d, name: b.name, desc: b.description || d.desc };
    });
  }
  return [...base, ...customServers];
}

export const fetchEnvironmentsAPI = async () => {
  await delay(200);
 
  // Read custom servers added via My Connections page
  let customServers = [];
  try {
    const raw = localStorage.getItem("sap_custom_servers_v1");
    if (raw) {
      customServers = JSON.parse(raw).map(s => ({
        id:      s.id,
        name:    s.name,
        desc:    s.description || s.hostname,
        badge:   "Custom",
        badgeCls:"text-violet-400 bg-violet-500/20 border-violet-500/30",
        isProd:  false,
        isCustom:true,
      }));
    }
  } catch {}
 
  return {
    success:    true,
    simEnvs:    SIM_ENVIRONMENTS,
    deployEnvs: mergeDeployEnvsWithBuiltins(customServers),
  };
};
export const deployRulesAPI = async (ids) => {
  await delay(600);

  const rules = buildRules().map((r) =>
    ids.includes(r.id)
      ? { ...r, status: "DEPLOYED", lifecycle: "DEPLOYED", deployedEnv: r.deployedEnv || "PROD" }
      : r
  );

  RULES_CACHE = rules;
  localStorage.setItem("rules", JSON.stringify(RULES_CACHE));

  return {
    success: true,
    data: ids.map((id) => {
      const row = rules.find((x) => x.id === id);
      return {
        id,
        status: "DEPLOYED",
        lifecycle: "DEPLOYED",
        deployedEnv: row?.deployedEnv ?? "PROD",
      };
    }),
  };
};
export const activateRulesAPI = async (ids) => {
  await delay(500);

  const rules = buildRules().map(r =>
    ids.includes(r.id)
      ? { ...r, status: "ACTIVE", lifecycle: "ACTIVE", activatedAt: new Date().toLocaleString() }
      : r
  );

  RULES_CACHE = rules;
  localStorage.setItem("rules", JSON.stringify(RULES_CACHE));

  return {
    success: true,
    data: ids.map(id => ({
      id,
      status: "ACTIVE",
      lifecycle: "ACTIVE",
      activatedAt: new Date().toLocaleString()
    }))
  };
};
export const deactivateRulesAPI = async (ids) => {
  await delay(500);

  const rules = buildRules().map(r =>
    ids.includes(r.id)
      ? { ...r, status: "DRAFT", lifecycle: "DRAFT", activatedAt: null }
      : r
  );

  RULES_CACHE = rules;
  localStorage.setItem("rules", JSON.stringify(RULES_CACHE));

  return {
    success: true,
    data: ids.map(id => ({
      id,
      status: "DRAFT",
      lifecycle: "DRAFT"
    }))
  };
};

export const runSimulationAPI = async (ruleId, config) => {
  await delay(1500);
  const tx = config.transactionCount || (40000 + Math.floor(Math.random() * 30000));
  const fpr = parseFloat((1.2 + Math.random() * 1.8).toFixed(2));
  const simulationResult = {
    simId: `SIM-${Date.now()}`,
    ruleId,
    environment: config.environment || "QA",
    mode: config.mode || "live",
    runAt: new Date().toLocaleString(),
    dateRange: { from: config.fromDate || "", to: config.toDate || "" },
    transactionsScanned: tx,
    falsePositiveRate: fpr,
    performance: "< 90ms",
    anomaliesDetected: Math.floor(tx * 0.003),
    thresholds: "Default",
  };

  RULES_CACHE = buildRules().map((r) =>
    r.id === ruleId
      ? {
          ...r,
          status: "SIMULATION",
          lifecycle: "SIMULATION",
          simulationHistory: [simulationResult, ...(r.simulationHistory || [])],
        }
      : r
  );

  localStorage.setItem("rules", JSON.stringify(RULES_CACHE));
  return {
    success: true,
    data: simulationResult,
  };
};

export const deployRuleToEnvAPI = async (ruleId, environment) => {
  await delay(800);
  RULES_CACHE = buildRules().map((r) =>
    r.id === ruleId
      ? { ...r, status: "DEPLOYED", lifecycle: "DEPLOYED", deployedEnv: environment }
      : r
  );

  localStorage.setItem("rules", JSON.stringify(RULES_CACHE));
  return { success: true, data: { ruleId, environment, status: "DEPLOYED" } };
};