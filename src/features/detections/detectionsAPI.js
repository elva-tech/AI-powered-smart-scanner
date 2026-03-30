/**
 * detectionsAPI.js — single source of truth for ALL dashboard analytics.
 * FIX: sumTxWindow filter was inverted → transactions always returned 0.
 *      sumTxWindow(0,30) means "last 30 days" = daysAgo 0..29
 *      correct filter: daysAgo >= toDaysAgo && daysAgo < fromDaysAgo
 *      was called as sumTxWindow(0,30) but filter used wrong direction.
 *      Fixed by swapping call args to sumTxWindow(30,0) and sumTxWindow(60,30).
 */

/**
 * detectionsAPI.js — UPDATED WITH localStorage persistence
 */

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));
const NOW  = Date.now();
const DAY  = 86_400_000;
const HOUR = 3_600_000;

// ── SEED FUNCTIONS (unchanged) ───────────────────────────────────────────────
function seedDetections() {
  const rules = [
    { ruleId:"RULE-001", ruleName:"Ghost Vendor Analysis",        module:"CO", weight:2.1 },
    { ruleId:"RULE-002", ruleName:"Split Purchase Order",         module:"SD", weight:3.8 },
    { ruleId:"RULE-003", ruleName:"Price Variance Threshold",     module:"MM", weight:1.4 },
    { ruleId:"RULE-004", ruleName:"Vendor Master Anomaly",        module:"PP", weight:2.7 },
    { ruleId:"RULE-005", ruleName:"Invoice Manipulation",         module:"HR", weight:4.5 },
    { ruleId:"RULE-008", ruleName:"Segregation of Duties",        module:"FI", weight:2.0 },
    { ruleId:"RULE-011", ruleName:"Duplicate Invoice Detection",  module:"MM", weight:3.2 },
    { ruleId:"RULE-016", ruleName:"Backdated Entry Detection",    module:"FI", weight:1.5 },
    { ruleId:"RULE-017", ruleName:"Budget Variance Manipulation", module:"CO", weight:2.9 },
    { ruleId:"RULE-018", ruleName:"Customer Credit Override",     module:"SD", weight:2.2 },
    { ruleId:"RULE-025", ruleName:"Cost Center Override",         module:"CO", weight:1.7 },
  ];

  const detections = [];
  let id = 1;
  let seed = 42;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };

  for (let daysAgo = 59; daysAgo >= 0; daysAgo--) {
    const dayBase = NOW - daysAgo * DAY;
    rules.forEach(rule => {
      const count = Math.floor(rule.weight * (0.4 + rand() * 1.2));
      for (let k = 0; k < count; k++) {
        const ts = dayBase + Math.floor(rand() * DAY);
        detections.push({
          id:            `DET-${String(id++).padStart(6,"0")}`,
          ruleId:        rule.ruleId,
          ruleName:      rule.ruleName,
          module:        rule.module,
          severity:      rand() > 0.7 ? "high" : rand() > 0.4 ? "medium" : "low",
          timestamp:     ts,
          transactionId: `TXN-${Math.floor(rand()*999999)}`,
          amount:        Math.floor(10000 + rand() * 200000),
        });
      }
    });
  }
  return detections;
}

function seedTransactions() {
  let seed = 99;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };
  const txns = [];
  const BASE_DAILY = 40_000;
  for (let daysAgo = 59; daysAgo >= 0; daysAgo--) {
    txns.push({ daysAgo, count: Math.floor(BASE_DAILY * (0.85 + rand() * 0.3)) });
  }
  return txns;
}

// ── LOAD FROM LOCAL STORAGE OR SEED ───────────────────────────────────────────
let DETECTIONS = JSON.parse(localStorage.getItem("detections")) || seedDetections();
let TRANSACTIONS = JSON.parse(localStorage.getItem("transactions")) || seedTransactions();

// ── SAVE HELPERS ──────────────────────────────────────────────────────────────
const saveDetections = () => localStorage.setItem("detections", JSON.stringify(DETECTIONS));
const saveTransactions = () => localStorage.setItem("transactions", JSON.stringify(TRANSACTIONS));

// ── WINDOW LOGIC (unchanged) ─────────────────────────────────────────────────
function sumTxWindow(fromDaysAgo, toDaysAgo) {
  return TRANSACTIONS
    .filter(t => t.daysAgo >= toDaysAgo && t.daysAgo < fromDaysAgo)
    .reduce((s, t) => s + t.count, 0);
}

function formatMillions(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`;
  return String(n);
}

// ── MAIN API ─────────────────────────────────────────────────────────────────
export const fetchDetectionStatsAPI = async (activeRuleIds = null) => {
  await delay(250);

  const dets = (activeRuleIds && activeRuleIds.length > 0)
    ? DETECTIONS.filter(d => activeRuleIds.includes(d.ruleId))
    : DETECTIONS;

  const txCurr = sumTxWindow(30, 0);
  const txPrev = sumTxWindow(60, 30);

  const txChangePct = txPrev > 0
    ? parseFloat(((txCurr - txPrev) / txPrev * 100).toFixed(1))
    : 0;

  const now30Start  = NOW - 30 * DAY;
  const prev30Start = NOW - 60 * DAY;

  const anomalyCurr = dets.filter(d => d.timestamp >= now30Start).length;
  const anomalyPrev = dets.filter(d => d.timestamp >= prev30Start && d.timestamp < now30Start).length;

  const anomalyChangePct = anomalyPrev > 0
    ? parseFloat(((anomalyCurr - anomalyPrev) / anomalyPrev * 100).toFixed(1))
    : 0;

  const last24hStart = NOW - 24 * HOUR;
  const prev24hStart = last24hStart - 24 * HOUR;

  const last24h = dets.filter(d => d.timestamp >= last24hStart);
  const prev24h = dets.filter(d => d.timestamp >= prev24hStart && d.timestamp < last24hStart);

  const ruleMap = {};

  last24h.forEach(d => {
    if (!ruleMap[d.ruleId]) {
      ruleMap[d.ruleId] = {
        ruleId:d.ruleId,
        name:d.ruleName,
        module:d.module,
        detections:0,
        prev:0
      };
    }
    ruleMap[d.ruleId].detections++;
  });

  prev24h.forEach(d => {
    if (ruleMap[d.ruleId]) ruleMap[d.ruleId].prev++;
  });

  const topRules = Object.values(ruleMap)
    .map(r => ({
      ...r,
      trend: r.detections > r.prev ? "up" : r.detections < r.prev ? "down" : "flat"
    }))
    .sort((a, b) => b.detections - a.detections)
    .slice(0, 5);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today  = new Date(NOW);
  const anomalyTrend = [];

  for (let m = 5; m >= 0; m--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - m);

    const startMs = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const endMs   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();

    const detected = dets.filter(x => x.timestamp >= startMs && x.timestamp <= endMs).length;

    anomalyTrend.push({
      label: MONTHS[d.getMonth()],
      detected,
      baseline: Math.round(detected * 0.65)
    });
  }

  const sapPerformance = [
    { time:"00:00", throughput:20, latency:18 },
    { time:"04:00", throughput:22, latency:17 },
    { time:"08:00", throughput:48, latency:40 },
    { time:"12:00", throughput:65, latency:52 },
    { time:"16:00", throughput:55, latency:48 },
    { time:"20:00", throughput:30, latency:25 },
  ];

  return {
    success: true,
    data: {
      transactions: {
        current: txCurr,
        previous: txPrev,
        displayValue: formatMillions(txCurr),
        changePercent: txChangePct,
        trend: txChangePct >= 0 ? "up" : "down",
      },
      anomalyFlags: {
        current: anomalyCurr,
        previous: anomalyPrev,
        displayValue: String(anomalyCurr),
        changePercent: anomalyChangePct,
        trend: anomalyChangePct >= 0 ? "up" : "down",
      },
      topRules,
      anomalyTrend,
      sapPerformance,
    },
  };
};

export const fetchRuleDetectionsAPI = async (ruleId, days = 30) => {
  await delay(150);
  const since = NOW - days * DAY;

  return {
    success: true,
    data: DETECTIONS.filter(d => d.ruleId === ruleId && d.timestamp >= since)
  };
};