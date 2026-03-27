// /**
//  * rulesAPI.js
//  * Mock API layer — mirrors real backend contract exactly.
//  * Replace `await delay()` calls with real fetch() when backend is ready.
//  * All function signatures and return shapes remain the same.
//  */

// const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

// // ─── 100 Rule Definitions ────────────────────────────────────────────────────
// // Each entry maps to a sequential rule ID.
// // Module cycles: CO→SD→MM→PP→HR→PM→QM→FI (8 modules, repeating)
// // Risk  cycles:  HIGH→MEDIUM→LOW→CRITICAL   (4 levels, repeating)
// // Thresholds vary per module for realism.

// const RULE_DEFS = [
//   // ── CO ──────────────────────────────────────────────────────────────────────
//   { module: "CO", name: "Ghost Vendor Analysis",          desc: "Detects ghost vendor manipulation patterns in CO module transactions",               amountThreshold: 50000,  frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 15 },
//   // ── SD ──────────────────────────────────────────────────────────────────────
//   { module: "SD", name: "Split Purchase Order",           desc: "Detects split purchase order fraud patterns in SD module transactions",             amountThreshold: 100000, frequencyLimit: 30, timeWindow: 90,  varianceThreshold: 25 },
//   // ── MM ──────────────────────────────────────────────────────────────────────
//   { module: "MM", name: "Price Variance Threshold",       desc: "Detects price variance anomalies beyond threshold in MM module transactions",       amountThreshold: 25000,  frequencyLimit: 5,  timeWindow: 14,  varianceThreshold: 10 },
//   // ── PP ──────────────────────────────────────────────────────────────────────
//   { module: "PP", name: "Vendor Master Anomaly",          desc: "Detects vendor master anomaly patterns in PP module transactions",                  amountThreshold: 75000,  frequencyLimit: 15, timeWindow: 60,  varianceThreshold: 20 },
//   // ── HR ──────────────────────────────────────────────────────────────────────
//   { module: "HR", name: "Invoice Manipulation",           desc: "Detects invoice manipulation patterns in HR module transactions",                   amountThreshold: 5000,   frequencyLimit: 3,  timeWindow: 7,   varianceThreshold: 30 },
//   // ── PM ──────────────────────────────────────────────────────────────────────
//   { module: "PM", name: "Journal Entry Reversal",         desc: "Detects journal entry reversal patterns in PM module transactions",                 amountThreshold: 30000,  frequencyLimit: 8,  timeWindow: 45,  varianceThreshold: 12 },
//   // ── QM ──────────────────────────────────────────────────────────────────────
//   { module: "QM", name: "Budget Overrun Alert",           desc: "Detects budget overrun alert patterns in QM module transactions",                   amountThreshold: 10000,  frequencyLimit: 20, timeWindow: 21,  varianceThreshold: 8  },
//   // ── FI ──────────────────────────────────────────────────────────────────────
//   { module: "FI", name: "Segregation of Duties",          desc: "Detects segregation of duties violations in FI module transactions",                amountThreshold: 200000, frequencyLimit: 2,  timeWindow: 180, varianceThreshold: 5  },
//   // ── CO (round 2) ────────────────────────────────────────────────────────────
//   { module: "CO", name: "Unusual Time Entry Pattern",     desc: "Detects unusual time entry patterns in CO module transactions",                     amountThreshold: 0,      frequencyLimit: 10, timeWindow: 7,   varianceThreshold: 50 },
//   { module: "SD", name: "Material Movement Anomaly",      desc: "Detects material movement anomaly patterns in SD module transactions",              amountThreshold: 80000,  frequencyLimit: 25, timeWindow: 60,  varianceThreshold: 20 },
//   { module: "MM", name: "Duplicate Invoice Detection",    desc: "Detects duplicate invoice submissions in MM module transactions",                   amountThreshold: 10000,  frequencyLimit: 2,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "PP", name: "Production Order Cost Override", desc: "Detects production order cost override patterns in PP module transactions",         amountThreshold: 150000, frequencyLimit: 10, timeWindow: 90,  varianceThreshold: 15 },
//   { module: "HR", name: "Ghost Employee Detection",       desc: "Detects ghost employee payroll patterns in HR module transactions",                 amountThreshold: 8000,   frequencyLimit: 1,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "PM", name: "Asset Disposal Fraud",           desc: "Detects fraudulent asset disposal patterns in PM module transactions",              amountThreshold: 50000,  frequencyLimit: 3,  timeWindow: 90,  varianceThreshold: 10 },
//   { module: "QM", name: "Quality Hold Override",          desc: "Detects unauthorized quality hold override patterns in QM transactions",            amountThreshold: 15000,  frequencyLimit: 5,  timeWindow: 14,  varianceThreshold: 5  },
//   { module: "FI", name: "Backdated Entry Detection",      desc: "Detects backdated journal entry patterns in FI module transactions",                amountThreshold: 50000,  frequencyLimit: 3,  timeWindow: 365, varianceThreshold: 0  },
//   // ── CO (round 3) ────────────────────────────────────────────────────────────
//   { module: "CO", name: "Budget Variance Manipulation",   desc: "Detects budget variance manipulation in CO controlling transactions",               amountThreshold: 100000, frequencyLimit: 3,  timeWindow: 90,  varianceThreshold: 25 },
//   { module: "SD", name: "Customer Credit Override",       desc: "Detects unauthorized customer credit override patterns in SD module",               amountThreshold: 200000, frequencyLimit: 10, timeWindow: 30,  varianceThreshold: 15 },
//   { module: "MM", name: "Vendor Master Change Alert",     desc: "Detects suspicious vendor master data changes in MM module transactions",           amountThreshold: 0,      frequencyLimit: 5,  timeWindow: 1,   varianceThreshold: 0  },
//   { module: "PP", name: "BOM Manipulation Detection",     desc: "Detects bill of materials manipulation patterns in PP module transactions",         amountThreshold: 20000,  frequencyLimit: 8,  timeWindow: 30,  varianceThreshold: 10 },
//   { module: "HR", name: "Overtime Threshold Breach",      desc: "Detects overtime threshold breach patterns in HR module transactions",              amountThreshold: 3000,   frequencyLimit: 20, timeWindow: 7,   varianceThreshold: 40 },
//   { module: "PM", name: "Maintenance Order Abuse",        desc: "Detects maintenance order cost abuse patterns in PM module transactions",           amountThreshold: 25000,  frequencyLimit: 12, timeWindow: 30,  varianceThreshold: 20 },
//   { module: "QM", name: "Inspection Lot Manipulation",    desc: "Detects inspection lot result manipulation in QM module transactions",              amountThreshold: 5000,   frequencyLimit: 15, timeWindow: 7,   varianceThreshold: 0  },
//   { module: "FI", name: "Rounding Manipulation",          desc: "Detects systematic rounding manipulation patterns in FI module transactions",       amountThreshold: 1,      frequencyLimit: 100, timeWindow: 30, varianceThreshold: 0  },
//   // ── Round 4 ──────────────────────────────────────────────────────────────────
//   { module: "CO", name: "Cost Center Override",           desc: "Detects unauthorized cost center override patterns in CO module transactions",      amountThreshold: 75000,  frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 20 },
//   { module: "SD", name: "Pricing Condition Manipulation", desc: "Detects pricing condition manipulation patterns in SD module transactions",         amountThreshold: 50000,  frequencyLimit: 20, timeWindow: 14,  varianceThreshold: 30 },
//   { module: "MM", name: "Purchase Order Split",           desc: "Detects purchase order split to avoid approval thresholds in MM transactions",     amountThreshold: 50000,  frequencyLimit: 10, timeWindow: 7,   varianceThreshold: 5  },
//   { module: "PP", name: "Routing Time Fraud",             desc: "Detects routing time manipulation patterns in PP module transactions",              amountThreshold: 10000,  frequencyLimit: 25, timeWindow: 14,  varianceThreshold: 35 },
//   { module: "HR", name: "Expense Report Fraud",           desc: "Detects fraudulent expense report patterns in HR module transactions",              amountThreshold: 2000,   frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 50 },
//   { module: "PM", name: "Equipment Master Manipulation",  desc: "Detects equipment master data manipulation in PM module transactions",              amountThreshold: 100000, frequencyLimit: 2,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "QM", name: "Certificate Fraud Detection",    desc: "Detects fraudulent quality certificate patterns in QM module transactions",         amountThreshold: 0,      frequencyLimit: 5,  timeWindow: 7,   varianceThreshold: 0  },
//   { module: "FI", name: "Payment Terms Abuse",            desc: "Detects payment terms abuse patterns in FI module transactions",                   amountThreshold: 100000, frequencyLimit: 8,  timeWindow: 90,  varianceThreshold: 0  },
//   // ── Round 5 ──────────────────────────────────────────────────────────────────
//   { module: "CO", name: "Profit Center Fraud",            desc: "Detects profit center allocation fraud patterns in CO module transactions",         amountThreshold: 200000, frequencyLimit: 3,  timeWindow: 90,  varianceThreshold: 10 },
//   { module: "SD", name: "Delivery Tolerance Abuse",       desc: "Detects delivery tolerance abuse patterns in SD module transactions",               amountThreshold: 30000,  frequencyLimit: 50, timeWindow: 60,  varianceThreshold: 15 },
//   { module: "MM", name: "Invoice Tolerance Abuse",        desc: "Detects invoice tolerance abuse patterns in MM module transactions",                amountThreshold: 5000,   frequencyLimit: 15, timeWindow: 30,  varianceThreshold: 5  },
//   { module: "PP", name: "Capacity Planning Abuse",        desc: "Detects capacity planning manipulation in PP module transactions",                  amountThreshold: 50000,  frequencyLimit: 10, timeWindow: 30,  varianceThreshold: 25 },
//   { module: "HR", name: "Benefit Manipulation",           desc: "Detects unauthorized benefit manipulation patterns in HR module transactions",       amountThreshold: 1500,   frequencyLimit: 3,  timeWindow: 90,  varianceThreshold: 0  },
//   { module: "PM", name: "Work Order Cost Fraud",          desc: "Detects work order cost fraud patterns in PM module transactions",                  amountThreshold: 15000,  frequencyLimit: 8,  timeWindow: 14,  varianceThreshold: 20 },
//   { module: "QM", name: "Usage Decision Override",        desc: "Detects unauthorized usage decision overrides in QM module transactions",           amountThreshold: 20000,  frequencyLimit: 10, timeWindow: 7,   varianceThreshold: 0  },
//   { module: "FI", name: "Advance Payment Fraud",          desc: "Detects advance payment fraud patterns in FI module transactions",                  amountThreshold: 150000, frequencyLimit: 3,  timeWindow: 30,  varianceThreshold: 0  },
//   // ── Round 6 ──────────────────────────────────────────────────────────────────
//   { module: "CO", name: "Transfer Price Manipulation",    desc: "Detects transfer pricing manipulation patterns in CO module transactions",          amountThreshold: 500000, frequencyLimit: 2,  timeWindow: 90,  varianceThreshold: 10 },
//   { module: "SD", name: "Return Order Fraud",             desc: "Detects fraudulent return order patterns in SD module transactions",                amountThreshold: 25000,  frequencyLimit: 20, timeWindow: 30,  varianceThreshold: 0  },
//   { module: "MM", name: "Goods Receipt Manipulation",     desc: "Detects goods receipt manipulation patterns in MM module transactions",             amountThreshold: 50000,  frequencyLimit: 8,  timeWindow: 14,  varianceThreshold: 10 },
//   { module: "PP", name: "Confirmation Backdating",        desc: "Detects production confirmation backdating in PP module transactions",              amountThreshold: 0,      frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "HR", name: "Payroll Override Detection",     desc: "Detects unauthorized payroll override patterns in HR module transactions",          amountThreshold: 10000,  frequencyLimit: 2,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "PM", name: "Technical Object Abuse",         desc: "Detects technical object master abuse in PM module transactions",                   amountThreshold: 0,      frequencyLimit: 10, timeWindow: 7,   varianceThreshold: 0  },
//   { module: "QM", name: "Sampling Procedure Abuse",       desc: "Detects sampling procedure abuse patterns in QM module transactions",               amountThreshold: 5000,   frequencyLimit: 30, timeWindow: 7,   varianceThreshold: 0  },
//   { module: "FI", name: "Bank Reconciliation Override",   desc: "Detects bank reconciliation override patterns in FI module transactions",           amountThreshold: 50000,  frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 0  },
//   // ── Round 7 ──────────────────────────────────────────────────────────────────
//   { module: "CO", name: "Internal Order Abuse",           desc: "Detects internal order cost abuse patterns in CO module transactions",              amountThreshold: 80000,  frequencyLimit: 10, timeWindow: 60,  varianceThreshold: 20 },
//   { module: "SD", name: "Free Goods Manipulation",        desc: "Detects free goods manipulation patterns in SD module transactions",                amountThreshold: 10000,  frequencyLimit: 40, timeWindow: 30,  varianceThreshold: 0  },
//   { module: "MM", name: "Material Document Reversal",     desc: "Detects suspicious material document reversal patterns in MM transactions",        amountThreshold: 30000,  frequencyLimit: 5,  timeWindow: 7,   varianceThreshold: 0  },
//   { module: "PP", name: "Material Scrap Manipulation",    desc: "Detects material scrap manipulation patterns in PP module transactions",            amountThreshold: 15000,  frequencyLimit: 20, timeWindow: 30,  varianceThreshold: 30 },
//   { module: "HR", name: "Time Recording Fraud",           desc: "Detects time recording fraud patterns in HR module transactions",                   amountThreshold: 0,      frequencyLimit: 50, timeWindow: 7,   varianceThreshold: 0  },
//   { module: "PM", name: "Counter Reading Manipulation",   desc: "Detects counter reading manipulation in PM module transactions",                    amountThreshold: 0,      frequencyLimit: 10, timeWindow: 30,  varianceThreshold: 50 },
//   { module: "QM", name: "Defect Recording Manipulation",  desc: "Detects defect recording manipulation patterns in QM module transactions",          amountThreshold: 5000,   frequencyLimit: 20, timeWindow: 14,  varianceThreshold: 0  },
//   { module: "FI", name: "Fixed Asset Manipulation",       desc: "Detects fixed asset manipulation patterns in FI module transactions",               amountThreshold: 300000, frequencyLimit: 2,  timeWindow: 180, varianceThreshold: 0  },
//   // ── Round 8 ──────────────────────────────────────────────────────────────────
//   { module: "CO", name: "Activity Rate Manipulation",     desc: "Detects activity rate manipulation patterns in CO module transactions",             amountThreshold: 20000,  frequencyLimit: 15, timeWindow: 30,  varianceThreshold: 25 },
//   { module: "SD", name: "Rebate Agreement Bypass",        desc: "Detects rebate agreement bypass patterns in SD module transactions",                amountThreshold: 75000,  frequencyLimit: 10, timeWindow: 90,  varianceThreshold: 15 },
//   { module: "MM", name: "Stock Transfer Fraud",           desc: "Detects fraudulent stock transfer patterns in MM module transactions",              amountThreshold: 40000,  frequencyLimit: 8,  timeWindow: 7,   varianceThreshold: 10 },
//   { module: "PP", name: "Work Center Override",           desc: "Detects work center capacity override patterns in PP module transactions",          amountThreshold: 30000,  frequencyLimit: 12, timeWindow: 30,  varianceThreshold: 20 },
//   { module: "HR", name: "Leave Balance Manipulation",     desc: "Detects leave balance manipulation patterns in HR module transactions",             amountThreshold: 0,      frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "PM", name: "Functional Location Fraud",      desc: "Detects functional location master fraud in PM module transactions",                amountThreshold: 0,      frequencyLimit: 5,  timeWindow: 7,   varianceThreshold: 0  },
//   { module: "QM", name: "Quality Score Override",         desc: "Detects quality score override patterns in QM module transactions",                 amountThreshold: 10000,  frequencyLimit: 8,  timeWindow: 7,   varianceThreshold: 0  },
//   { module: "FI", name: "GL Account Override",            desc: "Detects GL account override patterns in FI module transactions",                    amountThreshold: 100000, frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 0  },
//   // ── Round 9 ──────────────────────────────────────────────────────────────────
//   { module: "CO", name: "Statistical Key Fraud",          desc: "Detects statistical key figure fraud in CO module transactions",                    amountThreshold: 0,      frequencyLimit: 20, timeWindow: 30,  varianceThreshold: 40 },
//   { module: "SD", name: "Revenue Recognition Fraud",      desc: "Detects revenue recognition fraud patterns in SD module transactions",              amountThreshold: 250000, frequencyLimit: 5,  timeWindow: 90,  varianceThreshold: 10 },
//   { module: "MM", name: "Inventory Write-off Abuse",      desc: "Detects inventory write-off abuse patterns in MM module transactions",              amountThreshold: 20000,  frequencyLimit: 3,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "PP", name: "Process Order Fraud",            desc: "Detects process order manipulation patterns in PP module transactions",             amountThreshold: 80000,  frequencyLimit: 8,  timeWindow: 30,  varianceThreshold: 15 },
//   { module: "HR", name: "Bonus Override Detection",       desc: "Detects unauthorized bonus override patterns in HR module transactions",            amountThreshold: 25000,  frequencyLimit: 2,  timeWindow: 90,  varianceThreshold: 0  },
//   { module: "PM", name: "Measurement Doc Override",       desc: "Detects measurement document override patterns in PM module transactions",          amountThreshold: 0,      frequencyLimit: 10, timeWindow: 30,  varianceThreshold: 60 },
//   { module: "QM", name: "Characteristic Override",        desc: "Detects inspection characteristic override patterns in QM transactions",            amountThreshold: 0,      frequencyLimit: 15, timeWindow: 14,  varianceThreshold: 0  },
//   { module: "FI", name: "Write-off Threshold Breach",     desc: "Detects write-off threshold breach patterns in FI module transactions",             amountThreshold: 10000,  frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 0  },
//   // ── Round 10 ─────────────────────────────────────────────────────────────────
//   { module: "CO", name: "Plan vs Actual Override",        desc: "Detects plan vs actual override patterns in CO module transactions",               amountThreshold: 150000, frequencyLimit: 5,  timeWindow: 90,  varianceThreshold: 20 },
//   { module: "SD", name: "Customer Master Override",       desc: "Detects customer master override patterns in SD module transactions",               amountThreshold: 0,      frequencyLimit: 5,  timeWindow: 1,   varianceThreshold: 0  },
//   { module: "MM", name: "Purchase Req Override",          desc: "Detects purchase requisition override patterns in MM module transactions",          amountThreshold: 30000,  frequencyLimit: 10, timeWindow: 7,   varianceThreshold: 0  },
//   { module: "PP", name: "Component Substitution Fraud",   desc: "Detects component substitution fraud patterns in PP module transactions",           amountThreshold: 50000,  frequencyLimit: 8,  timeWindow: 30,  varianceThreshold: 25 },
//   { module: "HR", name: "Recruitment Fraud Detection",    desc: "Detects recruitment fraud patterns in HR module transactions",                      amountThreshold: 15000,  frequencyLimit: 3,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "PM", name: "Task List Manipulation",         desc: "Detects task list manipulation patterns in PM module transactions",                 amountThreshold: 10000,  frequencyLimit: 10, timeWindow: 14,  varianceThreshold: 15 },
//   { module: "QM", name: "Catalog Entry Manipulation",     desc: "Detects catalog entry manipulation patterns in QM module transactions",             amountThreshold: 0,      frequencyLimit: 20, timeWindow: 7,   varianceThreshold: 0  },
//   { module: "FI", name: "Intercompany Manipulation",      desc: "Detects intercompany manipulation patterns in FI module transactions",              amountThreshold: 500000, frequencyLimit: 3,  timeWindow: 90,  varianceThreshold: 5  },
//   // ── Round 11 ─────────────────────────────────────────────────────────────────
//   { module: "CO", name: "Assessment Cycle Bypass",        desc: "Detects assessment cycle bypass patterns in CO module transactions",               amountThreshold: 80000,  frequencyLimit: 3,  timeWindow: 30,  varianceThreshold: 10 },
//   { module: "SD", name: "Output Tax Manipulation",        desc: "Detects output tax manipulation patterns in SD module transactions",                amountThreshold: 50000,  frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "MM", name: "Contract Deviation Detection",   desc: "Detects contract price deviation patterns in MM module transactions",               amountThreshold: 25000,  frequencyLimit: 8,  timeWindow: 90,  varianceThreshold: 10 },
//   { module: "PP", name: "Planned Order Manipulation",     desc: "Detects planned order manipulation patterns in PP module transactions",             amountThreshold: 40000,  frequencyLimit: 15, timeWindow: 30,  varianceThreshold: 20 },
//   { module: "HR", name: "Termination Date Manipulation",  desc: "Detects termination date manipulation patterns in HR module transactions",          amountThreshold: 0,      frequencyLimit: 2,  timeWindow: 7,   varianceThreshold: 0  },
//   { module: "PM", name: "Calibration Override",           desc: "Detects calibration override patterns in PM module transactions",                   amountThreshold: 5000,   frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "QM", name: "Control Chart Fraud",            desc: "Detects control chart manipulation patterns in QM module transactions",             amountThreshold: 0,      frequencyLimit: 25, timeWindow: 14,  varianceThreshold: 0  },
//   { module: "FI", name: "Currency Rounding Fraud",        desc: "Detects currency rounding fraud patterns in FI module transactions",                amountThreshold: 1,      frequencyLimit: 200, timeWindow: 30, varianceThreshold: 0  },
//   // ── Round 12 ─────────────────────────────────────────────────────────────────
//   { module: "CO", name: "Settlement Rule Fraud",          desc: "Detects settlement rule manipulation patterns in CO module transactions",           amountThreshold: 100000, frequencyLimit: 3,  timeWindow: 90,  varianceThreshold: 15 },
//   { module: "SD", name: "Credit Limit Bypass",            desc: "Detects credit limit bypass patterns in SD module transactions",                    amountThreshold: 300000, frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "MM", name: "Info Record Manipulation",       desc: "Detects purchase info record manipulation in MM module transactions",               amountThreshold: 20000,  frequencyLimit: 5,  timeWindow: 14,  varianceThreshold: 15 },
//   { module: "PP", name: "MRP Exception Abuse",            desc: "Detects MRP exception message abuse in PP module transactions",                     amountThreshold: 60000,  frequencyLimit: 20, timeWindow: 7,   varianceThreshold: 0  },
//   { module: "HR", name: "Training Cost Abuse",            desc: "Detects training cost abuse patterns in HR module transactions",                    amountThreshold: 3000,   frequencyLimit: 5,  timeWindow: 90,  varianceThreshold: 0  },
//   { module: "PM", name: "Notification Override",          desc: "Detects notification override patterns in PM module transactions",                   amountThreshold: 0,      frequencyLimit: 15, timeWindow: 7,   varianceThreshold: 0  },
//   { module: "QM", name: "Specification Override",         desc: "Detects specification override patterns in QM module transactions",                 amountThreshold: 10000,  frequencyLimit: 8,  timeWindow: 7,   varianceThreshold: 0  },
//   { module: "FI", name: "Clearing Account Abuse",         desc: "Detects clearing account abuse patterns in FI module transactions",                 amountThreshold: 80000,  frequencyLimit: 5,  timeWindow: 30,  varianceThreshold: 0  },
//   // ── Round 13 (last 4 to hit 100) ─────────────────────────────────────────────
//   { module: "CO", name: "CO-PA Data Manipulation",        desc: "Detects CO-PA data manipulation patterns in CO module transactions",               amountThreshold: 200000, frequencyLimit: 5,  timeWindow: 90,  varianceThreshold: 10 },
//   { module: "SD", name: "Sales Order Backdating",         desc: "Detects sales order backdating patterns in SD module transactions",                 amountThreshold: 50000,  frequencyLimit: 10, timeWindow: 30,  varianceThreshold: 0  },
//   { module: "MM", name: "Valuation Class Change",         desc: "Detects suspicious valuation class change patterns in MM module transactions",      amountThreshold: 100000, frequencyLimit: 2,  timeWindow: 30,  varianceThreshold: 0  },
//   { module: "PP", name: "Phantom Production Report",      desc: "Detects phantom production reporting patterns in PP module transactions",           amountThreshold: 40000,  frequencyLimit: 10, timeWindow: 14,  varianceThreshold: 20 },
// ];

// const RISKS = ["HIGH", "MEDIUM", "LOW", "CRITICAL"];

// /** Build the full 100-rule array */
// function buildRules() {
//   return RULE_DEFS.map((def, index) => {
//     const num = index + 1;
//     return {
//       id:              `RULE-${String(num).padStart(3, "0")}`,
//       name:            `${def.module}-${def.name}-${num}`,
//       description:     def.desc,
//       status:          "DRAFT",
//       lifecycle:       "DRAFT",
//       module:          def.module,
//       risk:            RISKS[index % 4],
//       version:         "1.0.0",
//       origin:          "System",
//       createdDate:     "2025-01-15",
//       createdBy:       "System Rule",
//       // Thresholds vary per rule with slight random-ish offsets based on index
//       thresholds: {
//         amountThreshold:   def.amountThreshold + (index % 5) * Math.floor(def.amountThreshold * 0.1),
//         frequencyLimit:    def.frequencyLimit,
//         timeWindow:        def.timeWindow,
//         varianceThreshold: def.varianceThreshold,
//       },
//       // Simulation history (empty until first run)
//       simulationHistory: [],
//     };
//   });
// }

// // ─── SAP Environments ────────────────────────────────────────────────────────
// const SAP_ENVIRONMENTS = [
//   {
//     id:       "DEV",
//     name:     "Development (DEV)",
//     systemId: "SAP-DEV-001",
//     desc:     "Testing environment with synthetic data and full access permissions",
//     badge:    null,
//     status:   "Online",
//     lastSync: "2 min ago",
//     isLive:   false,
//     color:    "emerald",
//   },
//   {
//     id:       "QA",
//     name:     "Quality Assurance (QA)",
//     systemId: "SAP-QA-001",
//     desc:     "Pre-production environment with sanitized production data for validation",
//     badge:    null,
//     status:   "Online",
//     lastSync: "5 min ago",
//     isLive:   false,
//     color:    "blue",
//   },
//   {
//     id:       "STG",
//     name:     "Staging (STG)",
//     systemId: "SAP-STG-001",
//     desc:     "Mirror of production environment for final testing before deployment",
//     badge:    null,
//     status:   "Online",
//     lastSync: "1 min ago",
//     isLive:   false,
//     color:    "amber",
//   },
//   {
//     id:       "PROD",
//     name:     "Production (PROD)",
//     systemId: "SAP-PRD-001",
//     desc:     "Live production environment with real transaction data — use with caution",
//     badge:    "LIVE",
//     status:   "Online",
//     lastSync: "Real-time data",
//     isLive:   true,
//     color:    "red",
//   },
// ];

// // ─── API Functions ────────────────────────────────────────────────────────────

// /** GET /rules/ */
// export const fetchRulesAPI = async () => {
//   await delay(400);
//   return { success: true, data: buildRules() };
// };

// /** GET /rules/:id */
// export const fetchRuleByIdAPI = async (id) => {
//   await delay(200);
//   const rules = buildRules();
//   const rule = rules.find((r) => r.id === id);
//   if (!rule) return { success: false, error: "Rule not found" };
//   return { success: true, data: rule };
// };

// /** PUT /rules/:id — update status/lifecycle */
// export const updateRuleStatusAPI = async (id, updates) => {
//   await delay(300);
//   // In real implementation: PATCH to backend
//   return { success: true, data: { id, ...updates } };
// };

// /** POST /rules/deploy/ — bulk deploy */
// export const deployRulesAPI = async (ids) => {
//   await delay(600);
//   return { success: true, data: ids.map((id) => ({ id, status: "DEPLOYED", lifecycle: "DEPLOYED" })) };
// };

// /** POST /rules/activate/ — bulk activate */
// export const activateRulesAPI = async (ids) => {
//   await delay(500);
//   return { success: true, data: ids.map((id) => ({ id, status: "ACTIVE", lifecycle: "ACTIVE" })) };
// };

// /** POST /rules/deactivate/ — revert to draft */
// export const deactivateRulesAPI = async (ids) => {
//   await delay(500);
//   return { success: true, data: ids.map((id) => ({ id, status: "DRAFT", lifecycle: "DRAFT" })) };
// };

// /** GET /sap/environments */
// export const fetchEnvironmentsAPI = async () => {
//   await delay(300);
//   return { success: true, data: SAP_ENVIRONMENTS };
// };

// /** POST /rules/:id/simulate/test-data */
// export const runTestDataSimulationAPI = async (ruleId, config) => {
//   await delay(800);
//   return {
//     success: true,
//     data: {
//       ruleId,
//       mode:             "test",
//       status:           "COMPLETED",
//       transactionsRun:  config.transactionCount,
//       anomaliesFound:   Math.floor(config.transactionCount * 0.08),
//       falsePositives:   Math.floor(config.transactionCount * 0.02),
//       completedAt:      new Date().toISOString(),
//     },
//   };
// };

// /** POST /rules/:id/simulate/live */
// export const runLiveSimulationAPI = async (ruleId, config) => {
//   await delay(1000);
//   return {
//     success: true,
//     data: {
//       ruleId,
//       mode:            "live",
//       environment:     config.environment,
//       status:          "COMPLETED",
//       transactionsRun: 47823,
//       anomaliesFound:  342,
//       falsePositives:  28,
//       completedAt:     new Date().toISOString(),
//     },
//   };
// };


/**
 * rulesAPI.js — Mock backend layer.
 * Replace await delay() + return with real fetch() calls when backend is ready.
 * ALL return shapes mirror the exact API contract.
 */

/**
 * rulesAPI.js — Mock backend layer.
 * Replace await delay() + return with real fetch() calls when backend is ready.
 * ALL return shapes mirror the exact API contract.
 */

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ─── 100 Rules ────────────────────────────────────────────────────────────────
const DEFS = [
  { m:"CO", n:"Ghost Vendor Analysis",          d:"Detects ghost vendor manipulation patterns in CO module transactions",               a:50000,  f:5,   tw:30,  v:15 },
  { m:"SD", n:"Split Purchase Order",           d:"Detects split purchase order fraud patterns in SD module transactions",             a:100000, f:30,  tw:90,  v:25 },
  { m:"MM", n:"Price Variance Threshold",       d:"Detects price variance anomalies beyond threshold in MM module transactions",       a:25000,  f:5,   tw:14,  v:10 },
  { m:"PP", n:"Vendor Master Anomaly",          d:"Detects vendor master anomaly patterns in PP module transactions",                  a:75000,  f:15,  tw:60,  v:20 },
  { m:"HR", n:"Invoice Manipulation",           d:"Detects invoice manipulation patterns in HR module transactions",                   a:5000,   f:3,   tw:7,   v:30 },
  { m:"PM", n:"Journal Entry Reversal",         d:"Detects journal entry reversal patterns in PM module transactions",                 a:30000,  f:8,   tw:45,  v:12 },
  { m:"QM", n:"Budget Overrun Alert",           d:"Detects budget overrun alert patterns in QM module transactions",                   a:10000,  f:20,  tw:21,  v:8  },
  { m:"FI", n:"Segregation of Duties",          d:"Detects segregation of duties violations in FI module transactions",                a:200000, f:2,   tw:180, v:5  },
  { m:"CO", n:"Unusual Time Entry Pattern",     d:"Detects unusual time entry patterns in CO module transactions",                     a:0,      f:10,  tw:7,   v:50 },
  { m:"SD", n:"Material Movement Anomaly",      d:"Detects material movement anomaly patterns in SD module transactions",              a:80000,  f:25,  tw:60,  v:20 },
  { m:"MM", n:"Duplicate Invoice Detection",    d:"Detects duplicate invoice submissions in MM module transactions",                   a:10000,  f:2,   tw:30,  v:0  },
  { m:"PP", n:"Production Order Cost Override", d:"Detects production order cost override patterns in PP module transactions",         a:150000, f:10,  tw:90,  v:15 },
  { m:"HR", n:"Ghost Employee Detection",       d:"Detects ghost employee payroll patterns in HR module transactions",                 a:8000,   f:1,   tw:30,  v:0  },
  { m:"PM", n:"Asset Disposal Fraud",           d:"Detects fraudulent asset disposal patterns in PM module transactions",              a:50000,  f:3,   tw:90,  v:10 },
  { m:"QM", n:"Quality Hold Override",          d:"Detects unauthorized quality hold override patterns in QM transactions",            a:15000,  f:5,   tw:14,  v:5  },
  { m:"FI", n:"Backdated Entry Detection",      d:"Detects backdated journal entry patterns in FI module transactions",                a:50000,  f:3,   tw:365, v:0  },
  { m:"CO", n:"Budget Variance Manipulation",   d:"Detects budget variance manipulation in CO controlling transactions",               a:100000, f:3,   tw:90,  v:25 },
  { m:"SD", n:"Customer Credit Override",       d:"Detects unauthorized customer credit override patterns in SD module",               a:200000, f:10,  tw:30,  v:15 },
  { m:"MM", n:"Vendor Master Change Alert",     d:"Detects suspicious vendor master data changes in MM module transactions",           a:0,      f:5,   tw:1,   v:0  },
  { m:"PP", n:"BOM Manipulation Detection",     d:"Detects bill of materials manipulation patterns in PP module transactions",         a:20000,  f:8,   tw:30,  v:10 },
  { m:"HR", n:"Overtime Threshold Breach",      d:"Detects overtime threshold breach patterns in HR module transactions",              a:3000,   f:20,  tw:7,   v:40 },
  { m:"PM", n:"Maintenance Order Abuse",        d:"Detects maintenance order cost abuse patterns in PM module transactions",           a:25000,  f:12,  tw:30,  v:20 },
  { m:"QM", n:"Inspection Lot Manipulation",    d:"Detects inspection lot result manipulation in QM module transactions",              a:5000,   f:15,  tw:7,   v:0  },
  { m:"FI", n:"Rounding Manipulation",          d:"Detects systematic rounding manipulation patterns in FI module transactions",       a:1,      f:100, tw:30,  v:0  },
  { m:"CO", n:"Cost Center Override",           d:"Detects unauthorized cost center override patterns in CO module transactions",      a:75000,  f:5,   tw:30,  v:20 },
  { m:"SD", n:"Pricing Condition Manipulation", d:"Detects pricing condition manipulation patterns in SD module transactions",         a:50000,  f:20,  tw:14,  v:30 },
  { m:"MM", n:"Purchase Order Split",           d:"Detects purchase order split to avoid approval thresholds in MM transactions",     a:50000,  f:10,  tw:7,   v:5  },
  { m:"PP", n:"Routing Time Fraud",             d:"Detects routing time manipulation patterns in PP module transactions",              a:10000,  f:25,  tw:14,  v:35 },
  { m:"HR", n:"Expense Report Fraud",           d:"Detects fraudulent expense report patterns in HR module transactions",              a:2000,   f:5,   tw:30,  v:50 },
  { m:"PM", n:"Equipment Master Manipulation",  d:"Detects equipment master data manipulation in PM module transactions",              a:100000, f:2,   tw:30,  v:0  },
  { m:"QM", n:"Certificate Fraud Detection",    d:"Detects fraudulent quality certificate patterns in QM module transactions",         a:0,      f:5,   tw:7,   v:0  },
  { m:"FI", n:"Payment Terms Abuse",            d:"Detects payment terms abuse patterns in FI module transactions",                   a:100000, f:8,   tw:90,  v:0  },
  { m:"CO", n:"Profit Center Fraud",            d:"Detects profit center allocation fraud patterns in CO module transactions",         a:200000, f:3,   tw:90,  v:10 },
  { m:"SD", n:"Delivery Tolerance Abuse",       d:"Detects delivery tolerance abuse patterns in SD module transactions",               a:30000,  f:50,  tw:60,  v:15 },
  { m:"MM", n:"Invoice Tolerance Abuse",        d:"Detects invoice tolerance abuse patterns in MM module transactions",                a:5000,   f:15,  tw:30,  v:5  },
  { m:"PP", n:"Capacity Planning Abuse",        d:"Detects capacity planning manipulation in PP module transactions",                  a:50000,  f:10,  tw:30,  v:25 },
  { m:"HR", n:"Benefit Manipulation",           d:"Detects unauthorized benefit manipulation patterns in HR module transactions",       a:1500,   f:3,   tw:90,  v:0  },
  { m:"PM", n:"Work Order Cost Fraud",          d:"Detects work order cost fraud patterns in PM module transactions",                  a:15000,  f:8,   tw:14,  v:20 },
  { m:"QM", n:"Usage Decision Override",        d:"Detects unauthorized usage decision overrides in QM module transactions",           a:20000,  f:10,  tw:7,   v:0  },
  { m:"FI", n:"Advance Payment Fraud",          d:"Detects advance payment fraud patterns in FI module transactions",                  a:150000, f:3,   tw:30,  v:0  },
  { m:"CO", n:"Transfer Price Manipulation",    d:"Detects transfer pricing manipulation patterns in CO module transactions",          a:500000, f:2,   tw:90,  v:10 },
  { m:"SD", n:"Return Order Fraud",             d:"Detects fraudulent return order patterns in SD module transactions",                a:25000,  f:20,  tw:30,  v:0  },
  { m:"MM", n:"Goods Receipt Manipulation",     d:"Detects goods receipt manipulation patterns in MM module transactions",             a:50000,  f:8,   tw:14,  v:10 },
  { m:"PP", n:"Confirmation Backdating",        d:"Detects production confirmation backdating in PP module transactions",              a:0,      f:5,   tw:30,  v:0  },
  { m:"HR", n:"Payroll Override Detection",     d:"Detects unauthorized payroll override patterns in HR module transactions",          a:10000,  f:2,   tw:30,  v:0  },
  { m:"PM", n:"Technical Object Abuse",         d:"Detects technical object master abuse in PM module transactions",                   a:0,      f:10,  tw:7,   v:0  },
  { m:"QM", n:"Sampling Procedure Abuse",       d:"Detects sampling procedure abuse patterns in QM module transactions",               a:5000,   f:30,  tw:7,   v:0  },
  { m:"FI", n:"Bank Reconciliation Override",   d:"Detects bank reconciliation override patterns in FI module transactions",           a:50000,  f:5,   tw:30,  v:0  },
  { m:"CO", n:"Internal Order Abuse",           d:"Detects internal order cost abuse patterns in CO module transactions",              a:80000,  f:10,  tw:60,  v:20 },
  { m:"SD", n:"Free Goods Manipulation",        d:"Detects free goods manipulation patterns in SD module transactions",                a:10000,  f:40,  tw:30,  v:0  },
  { m:"MM", n:"Material Document Reversal",     d:"Detects suspicious material document reversal patterns in MM transactions",        a:30000,  f:5,   tw:7,   v:0  },
  { m:"PP", n:"Material Scrap Manipulation",    d:"Detects material scrap manipulation patterns in PP module transactions",            a:15000,  f:20,  tw:30,  v:30 },
  { m:"HR", n:"Time Recording Fraud",           d:"Detects time recording fraud patterns in HR module transactions",                   a:0,      f:50,  tw:7,   v:0  },
  { m:"PM", n:"Counter Reading Manipulation",   d:"Detects counter reading manipulation in PM module transactions",                    a:0,      f:10,  tw:30,  v:50 },
  { m:"QM", n:"Defect Recording Manipulation",  d:"Detects defect recording manipulation patterns in QM module transactions",          a:5000,   f:20,  tw:14,  v:0  },
  { m:"FI", n:"Fixed Asset Manipulation",       d:"Detects fixed asset manipulation patterns in FI module transactions",               a:300000, f:2,   tw:180, v:0  },
  { m:"CO", n:"Activity Rate Manipulation",     d:"Detects activity rate manipulation patterns in CO module transactions",             a:20000,  f:15,  tw:30,  v:25 },
  { m:"SD", n:"Rebate Agreement Bypass",        d:"Detects rebate agreement bypass patterns in SD module transactions",                a:75000,  f:10,  tw:90,  v:15 },
  { m:"MM", n:"Stock Transfer Fraud",           d:"Detects fraudulent stock transfer patterns in MM module transactions",              a:40000,  f:8,   tw:7,   v:10 },
  { m:"PP", n:"Work Center Override",           d:"Detects work center capacity override patterns in PP module transactions",          a:30000,  f:12,  tw:30,  v:20 },
  { m:"HR", n:"Leave Balance Manipulation",     d:"Detects leave balance manipulation patterns in HR module transactions",             a:0,      f:5,   tw:30,  v:0  },
  { m:"PM", n:"Functional Location Fraud",      d:"Detects functional location master fraud in PM module transactions",                a:0,      f:5,   tw:7,   v:0  },
  { m:"QM", n:"Quality Score Override",         d:"Detects quality score override patterns in QM module transactions",                 a:10000,  f:8,   tw:7,   v:0  },
  { m:"FI", n:"GL Account Override",            d:"Detects GL account override patterns in FI module transactions",                    a:100000, f:5,   tw:30,  v:0  },
  { m:"CO", n:"Statistical Key Fraud",          d:"Detects statistical key figure fraud in CO module transactions",                    a:0,      f:20,  tw:30,  v:40 },
  { m:"SD", n:"Revenue Recognition Fraud",      d:"Detects revenue recognition fraud patterns in SD module transactions",              a:250000, f:5,   tw:90,  v:10 },
  { m:"MM", n:"Inventory Write-off Abuse",      d:"Detects inventory write-off abuse patterns in MM module transactions",              a:20000,  f:3,   tw:30,  v:0  },
  { m:"PP", n:"Process Order Fraud",            d:"Detects process order manipulation patterns in PP module transactions",             a:80000,  f:8,   tw:30,  v:15 },
  { m:"HR", n:"Bonus Override Detection",       d:"Detects unauthorized bonus override patterns in HR module transactions",            a:25000,  f:2,   tw:90,  v:0  },
  { m:"PM", n:"Measurement Doc Override",       d:"Detects measurement document override patterns in PM module transactions",          a:0,      f:10,  tw:30,  v:60 },
  { m:"QM", n:"Characteristic Override",        d:"Detects inspection characteristic override patterns in QM transactions",            a:0,      f:15,  tw:14,  v:0  },
  { m:"FI", n:"Write-off Threshold Breach",     d:"Detects write-off threshold breach patterns in FI module transactions",             a:10000,  f:5,   tw:30,  v:0  },
  { m:"CO", n:"Plan vs Actual Override",        d:"Detects plan vs actual override patterns in CO module transactions",               a:150000, f:5,   tw:90,  v:20 },
  { m:"SD", n:"Customer Master Override",       d:"Detects customer master override patterns in SD module transactions",               a:0,      f:5,   tw:1,   v:0  },
  { m:"MM", n:"Purchase Req Override",          d:"Detects purchase requisition override patterns in MM module transactions",          a:30000,  f:10,  tw:7,   v:0  },
  { m:"PP", n:"Component Substitution Fraud",   d:"Detects component substitution fraud patterns in PP module transactions",           a:50000,  f:8,   tw:30,  v:25 },
  { m:"HR", n:"Recruitment Fraud Detection",    d:"Detects recruitment fraud patterns in HR module transactions",                      a:15000,  f:3,   tw:30,  v:0  },
  { m:"PM", n:"Task List Manipulation",         d:"Detects task list manipulation patterns in PM module transactions",                 a:10000,  f:10,  tw:14,  v:15 },
  { m:"QM", n:"Catalog Entry Manipulation",     d:"Detects catalog entry manipulation patterns in QM module transactions",             a:0,      f:20,  tw:7,   v:0  },
  { m:"FI", n:"Intercompany Manipulation",      d:"Detects intercompany manipulation patterns in FI module transactions",              a:500000, f:3,   tw:90,  v:5  },
  { m:"CO", n:"Assessment Cycle Bypass",        d:"Detects assessment cycle bypass patterns in CO module transactions",               a:80000,  f:3,   tw:30,  v:10 },
  { m:"SD", n:"Output Tax Manipulation",        d:"Detects output tax manipulation patterns in SD module transactions",                a:50000,  f:5,   tw:30,  v:0  },
  { m:"MM", n:"Contract Deviation Detection",   d:"Detects contract price deviation patterns in MM module transactions",               a:25000,  f:8,   tw:90,  v:10 },
  { m:"PP", n:"Planned Order Manipulation",     d:"Detects planned order manipulation patterns in PP module transactions",             a:40000,  f:15,  tw:30,  v:20 },
  { m:"HR", n:"Termination Date Manipulation",  d:"Detects termination date manipulation patterns in HR module transactions",          a:0,      f:2,   tw:7,   v:0  },
  { m:"PM", n:"Calibration Override",           d:"Detects calibration override patterns in PM module transactions",                   a:5000,   f:5,   tw:30,  v:0  },
  { m:"QM", n:"Control Chart Fraud",            d:"Detects control chart manipulation patterns in QM module transactions",             a:0,      f:25,  tw:14,  v:0  },
  { m:"FI", n:"Currency Rounding Fraud",        d:"Detects currency rounding fraud patterns in FI module transactions",                a:1,      f:200, tw:30,  v:0  },
  { m:"CO", n:"Settlement Rule Fraud",          d:"Detects settlement rule manipulation patterns in CO module transactions",           a:100000, f:3,   tw:90,  v:15 },
  { m:"SD", n:"Credit Limit Bypass",            d:"Detects credit limit bypass patterns in SD module transactions",                    a:300000, f:5,   tw:30,  v:0  },
  { m:"MM", n:"Info Record Manipulation",       d:"Detects purchase info record manipulation in MM module transactions",               a:20000,  f:5,   tw:14,  v:15 },
  { m:"PP", n:"MRP Exception Abuse",            d:"Detects MRP exception message abuse in PP module transactions",                     a:60000,  f:20,  tw:7,   v:0  },
  { m:"HR", n:"Training Cost Abuse",            d:"Detects training cost abuse patterns in HR module transactions",                    a:3000,   f:5,   tw:90,  v:0  },
  { m:"PM", n:"Notification Override",          d:"Detects notification override patterns in PM module transactions",                   a:0,      f:15,  tw:7,   v:0  },
  { m:"QM", n:"Specification Override",         d:"Detects specification override patterns in QM module transactions",                 a:10000,  f:8,   tw:7,   v:0  },
  { m:"FI", n:"Clearing Account Abuse",         d:"Detects clearing account abuse patterns in FI module transactions",                 a:80000,  f:5,   tw:30,  v:0  },
  { m:"CO", n:"CO-PA Data Manipulation",        d:"Detects CO-PA data manipulation patterns in CO module transactions",               a:200000, f:5,   tw:90,  v:10 },
  { m:"SD", n:"Sales Order Backdating",         d:"Detects sales order backdating patterns in SD module transactions",                 a:50000,  f:10,  tw:30,  v:0  },
  { m:"MM", n:"Valuation Class Change",         d:"Detects suspicious valuation class change patterns in MM module transactions",      a:100000, f:2,   tw:30,  v:0  },
  { m:"PP", n:"Phantom Production Report",      d:"Detects phantom production reporting patterns in PP module transactions",           a:40000,  f:10,  tw:14,  v:20 },
];

const RISKS = ["HIGH","MEDIUM","LOW","CRITICAL"];

export function buildRules() {
  return DEFS.map((def, i) => {
    const num = i + 1;
    return {
      id:          `RULE-${String(num).padStart(3,"0")}`,
      name:        `${def.m}-${def.n}-${num}`,
      description: def.d,
      status:      "DRAFT",
      lifecycle:   "DRAFT",
      module:      def.m,
      risk:        RISKS[i % 4],
      version:     "1.0.0",
      origin:      "System",
      createdDate: "2025-01-15",
      createdBy:   "System Rule",
      thresholds: { amountThreshold:def.a, frequencyLimit:def.f, timeWindow:def.tw, varianceThreshold:def.v },
      simulationHistory: [],
      deployedEnv:  null,
      activatedAt:  null,
    };
  });
}

export const SIM_ENVIRONMENTS = [
  { id:"DEV",  name:"Development (DEV)",     systemId:"SAP-DEV-001", desc:"Testing environment with synthetic data and full access permissions",     badge:null,   isLive:false, status:"Online", lastSync:"2 min ago" },
  { id:"QA",   name:"Quality Assurance (QA)",systemId:"SAP-QA-001",  desc:"Pre-production environment with sanitized production data for validation", badge:null,   isLive:false, status:"Online", lastSync:"5 min ago" },
  { id:"STG",  name:"Staging (STG)",          systemId:"SAP-STG-001", desc:"Mirror of production environment for final testing before deployment",     badge:null,   isLive:false, status:"Online", lastSync:"1 min ago" },
  { id:"PROD", name:"Production (PROD)",      systemId:"SAP-PRD-001", desc:"Live production environment with real transaction data — use with caution",badge:"LIVE", isLive:true,  status:"Online", lastSync:"Real-time"  },
];

export const DEPLOY_ENVIRONMENTS = [
  { id:"DEV",  name:"Development (DEV)",   desc:"Deploy to development environment for initial testing and validation",      badge:"Safe",    badgeCls:"text-emerald-400 bg-emerald-500/20 border-emerald-500/30", iconCls:"text-emerald-400" },
  { id:"QAS",  name:"QA / Testing (QAS)",  desc:"Deploy to QA environment for thorough testing before production",           badge:"Staging", badgeCls:"text-blue-400 bg-blue-500/20 border-blue-500/30",           iconCls:"text-blue-400"    },
  { id:"PROD", name:"Production (PRD)",     desc:"Deploy active rule to production environment for archival",                  badge:"Live",    badgeCls:"text-red-400 bg-red-500/20 border-red-500/30",              iconCls:"text-red-400", isProd:true },
];

export const fetchRulesAPI        = async () => { await delay(400); return { success:true, data:buildRules() }; };
export const fetchEnvironmentsAPI = async () => { await delay(200); return { success:true, simEnvs:SIM_ENVIRONMENTS, deployEnvs:DEPLOY_ENVIRONMENTS }; };
export const deployRulesAPI       = async (ids) => { await delay(600); return { success:true, data:ids.map(id=>({id,status:"DEPLOYED",lifecycle:"DEPLOYED"})) }; };
export const activateRulesAPI     = async (ids) => { await delay(500); return { success:true, data:ids.map(id=>({id,status:"ACTIVE",lifecycle:"ACTIVE",activatedAt:new Date().toLocaleString()})) }; };
export const deactivateRulesAPI   = async (ids) => { await delay(500); return { success:true, data:ids.map(id=>({id,status:"DRAFT",lifecycle:"DRAFT"})) }; };

export const runSimulationAPI = async (ruleId, config) => {
  await delay(1500);
  const tx  = config.transactionCount || (40000 + Math.floor(Math.random()*30000));
  const fpr = parseFloat((1.2 + Math.random()*1.8).toFixed(2));
  return {
    success: true,
    data: {
      simId:              `SIM-${Date.now()}`,
      ruleId,
      environment:        config.environment || "QA",
      mode:               config.mode || "live",
      runAt:              new Date().toLocaleString(),
      dateRange:          { from: config.fromDate||"", to: config.toDate||"" },
      transactionsScanned: tx,
      falsePositiveRate:  fpr,
      performance:        "< 90ms",
      anomaliesDetected:  Math.floor(tx*0.003),
      thresholds:         "Default",
    },
  };
};

export const deployRuleToEnvAPI = async (ruleId, environment) => {
  await delay(800);
  return { success:true, data:{ ruleId, environment, status:"DEPLOYED" } };
};