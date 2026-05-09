/**
 * chatService.js — API layer for AI chat.
 *
 * MOCK MODE (now): simulates AI responses locally.
 * PRODUCTION MODE: Django devs replace ONLY the function bodies below.
 * The shape of request/response never changes — frontend stays untouched.
 *
 * Django endpoint contract:
 *   POST /api/chat/message/
 *   Body: { message: string, sessionId: string, ruleContext?: object }
 *   Response: {
 *     reply: string,          // markdown text for chat bubble
 *     type: string,           // "rule_result" | "info" | "welcome"
 *     module?: string,        // "FI" | "MM" | "SD" | "CO" | "HR" | "PP"
 *     riskScore?: number,     // 0-100
 *     cdsCode?: string,       // full CDS view code string
 *     threshold?: number,     // amount threshold
 *     timeDiff?: number,      // days
 *   }
 *
 *   GET /api/chat/sessions/:sessionId/messages/
 *   Response: [ { id, role, text, type, module, riskScore, cdsCode, timestamp } ]
 *
 *   POST /api/chat/sessions/
 *   Body: { userId?: string }
 *   Response: { sessionId: string }
 *
 * HOW DJANGO DEV CONNECTS OpenAI GPT:
 *   In chat/views.py:
 *     from openai import OpenAI
 *     client = OpenAI()  # reads OPENAI_API_KEY from env
 *
 *     system_prompt = """You are an SAP anomaly detection rule architect.
 *     Parse user input and respond ONLY with valid JSON matching this shape:
 *     {
 *       "reply": "conversational markdown response",
 *       "type": "rule_result",
 *       "module": "FI",
 *       "riskScore": 75,
 *       "cdsCode": "define view ...",
 *       "threshold": 50000,
 *       "timeDiff": 7
 *     }
 *     If user asks what you can do, set type to "info" and omit rule fields.
 *     """
 *
 *     response = client.chat.completions.create(
 *       model="gpt-4o",
 *       messages=[{"role":"system","content":system_prompt}, ...history, {"role":"user","content":message}],
 *       response_format={"type":"json_object"}
 *     )
 *     return JsonResponse(json.loads(response.choices[0].message.content))
 */

// ─── Session management ───────────────────────────────────────────────────────

const SESSION_KEY = "sap_chat_session_id";

export function getOrCreateSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ─── Chat history (mock: sessionStorage; prod: backend DB) ───────────────────

const HISTORY_KEY = "sap_chat_history";

export function loadChatHistory() {
  // PROD: replace with → GET /api/chat/sessions/${getOrCreateSessionId()}/messages/
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveChatHistory(messages) {
  // PROD: no-op here — backend saves on each sendMessage call
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  } catch {}
}

export function clearChatHistory() {
  sessionStorage.removeItem(HISTORY_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Send message ─────────────────────────────────────────────────────────────

/**
 * sendMessage — send user text to AI, get structured response back.
 *
 * PROD replacement (Django devs change ONLY this function body):
 *
 *   export async function sendMessage({ message, sessionId, ruleContext }) {
 *     const res = await fetch("/api/chat/message/", {
 *       method: "POST",
 *       headers: {
 *         "Content-Type": "application/json",
 *         "X-CSRFToken": getCookie("csrftoken"),
 *       },
 *       body: JSON.stringify({ message, sessionId, ruleContext }),
 *     });
 *     if (!res.ok) throw new Error("Chat API error");
 *     return res.json();
 *     // returns: { reply, type, module, riskScore, cdsCode, threshold, timeDiff }
 *   }
 */
export async function sendMessage({ message, sessionId, ruleContext }) {
  try {
    const res = await fetch("http://localhost:8000/sap/rule-agent/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
         sessionId: sessionId,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (data.status !== "success") {
      throw new Error(data.message || "Backend error");
    }

    // 🧠 Convert backend → UI format
    const aiText = data.reply || "I've processed your request.";

    const isRuleReady = data.type === "rule_result";

    return {
      type: isRuleReady ? "rule_result" : "info",

      // reply: removeCodeBlocks(aiText),
      reply: aiText,

      module: detectModule(data.intent),

      riskScore: estimateRisk(data),

      cdsCode: data.cdsCode || "",

      threshold: extractAmount(message),

      timeDiff: extractDays(message),
    };

  } catch (err) {
    console.error("❌ Chat API Error:", err);

    return {
      type: "info",
      reply: "⚠️ Unable to connect to AI service. Please try again.",
    };
  }
}

// ─── Mock helpers (DELETE these when Django is connected) ─────────────────────

const SAP_MODULES = {
  FI: "Financial Accounting (FI)",
  MM: "Materials Management (MM)",
  SD: "Sales & Distribution (SD)",
  CO: "Controlling (CO)",
  HR: "Human Resources (HR)",
  PP: "Production Planning (PP)",
};

function _mockParseRule(text, ruleContext) {
  const t = text.toLowerCase();

  // Start from ruleContext if in modify mode
  let module    = ruleContext?.module    || "FI";
  let threshold = ruleContext?.threshold || 50000;
  let timeDiff  = ruleContext?.timeDiff  || 7;

  // Module detection
  if      (t.includes("mm") || t.includes("material") || t.includes("vendor") || t.includes("invoice")) module = "MM";
  else if (t.includes("sd") || t.includes("sales")    || t.includes("customer") || t.includes("order")) module = "SD";
  else if (t.includes("hr") || t.includes("payroll")  || t.includes("employee"))                        module = "HR";
  else if (t.includes("co") || t.includes("budget")   || t.includes("cost"))                            module = "CO";
  else if (t.includes("pp") || t.includes("production")|| t.includes("bom"))                            module = "PP";

  // Amount extraction
  const amtM = text.match(/\$?([\d,]+(?:\.\d+)?)(k|m)?/i);
  if (amtM) {
    let n = parseFloat(amtM[1].replace(/,/g, ""));
    if (amtM[2]?.toLowerCase() === "k") n *= 1000;
    if (amtM[2]?.toLowerCase() === "m") n *= 1_000_000;
    threshold = Math.round(n);
  }

  // Days extraction
  const dayM = text.match(/(\d+)\s*days?/i);
  if (dayM) timeDiff = parseInt(dayM[1]);

  const riskScore = threshold > 100000 ? 90 : threshold > 50000 ? 75 : threshold > 10000 ? 55 : 40;
  const moduleName = SAP_MODULES[module] || module;
  const ts         = Date.now();
  const viewName   = `Z_ANOMALY_${module}_${ts}`;
  const sapEntity  = module === "FI" ? "I_JournalEntry"
    : module === "MM" ? "I_PurchaseOrderItem"
    : module === "SD" ? "I_SalesOrderItem"
    : "I_AccountingDocumentItem";

  const cds = `@AbapCatalog.sqlViewName: '${viewName.slice(0, 16)}'
@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Anomaly Detection - ${module} Module'
define view ${viewName} as select from ${sapEntity} {
  key CompanyCode,
  key FiscalYear,
  key AccountingDocument,
  DocumentDate,
  PostingDate,
  AmountInTransactionCurrency,
  TransactionCurrency,
  AccountingDocumentType,

  case
    when AmountInTransactionCurrency > ${threshold}
      and dats_days_between(DocumentDate, PostingDate) > ${timeDiff}
    then 'HIGH'
    when AmountInTransactionCurrency > ${Math.round(threshold * 0.5)}
    then 'MEDIUM'
    else 'LOW'
  end as RiskLevel,

  case
    when AmountInTransactionCurrency > ${threshold}
      and dats_days_between(DocumentDate, PostingDate) > ${timeDiff}
    then 'X'
    else ''
  end as AnomalyFlag,

  case
    when AmountInTransactionCurrency > ${threshold}
      and dats_days_between(DocumentDate, PostingDate) > ${timeDiff}
    then ${riskScore}
    when AmountInTransactionCurrency > ${Math.round(threshold * 0.5)}
    then ${Math.round(riskScore * 0.6)}
    else ${Math.round(riskScore * 0.3)}
  end as RiskScore

} where AmountInTransactionCurrency > ${Math.round(threshold * 0.2)}`;

  return { module, moduleName, threshold, timeDiff, riskScore, cds };
}

function _mockBuildReply({ module, moduleName, threshold, timeDiff, riskScore }) {
  const fmt = n => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  return `Perfect! I've analyzed your requirements and created a rule for you. Here's what I understood:

📋 **SAP Module**: ${moduleName}
💰 **Amount Threshold**: ${fmt(threshold)}
📅 **Time Difference**: ${timeDiff} days between document and posting date
⚠️ **Risk Score**: ${riskScore}/100

This rule will flag transactions in the ${moduleName} module where the amount exceeds ${fmt(threshold)} and there's more than ${timeDiff} days between the document date and posting date.

I've generated the CDS view code for this rule. Would you like to:
- **Modify any parameters** (amount, days, risk score)
- **Add this to your Rule Library**
- **Test it with a simulation**`;
}

function detectModule(intent = "") {
  const t = intent.toLowerCase();

  if (t.includes("invoice") || t.includes("fi")) return "FI";
  if (t.includes("vendor") || t.includes("mm")) return "MM";
  if (t.includes("sales") || t.includes("sd")) return "SD";
  if (t.includes("cost") || t.includes("co")) return "CO";
  if (t.includes("employee") || t.includes("hr")) return "HR";

  return "FI";
}

function extractAmount(text = "") {
  const match = text.match(/\$?([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, "")) : 50000;
}

function extractDays(text = "") {
  const match = text.match(/(\d+)\s*days?/i);
  return match ? parseInt(match[1]) : 7;
}

function estimateRisk(data) {
  // If backend later sends risk → use it
  if (data.risk_score) return data.risk_score;

  // fallback logic
  return data.approved ? 75 : 50;
}

// function removeCodeBlocks(text = "") {
//   return text.replace(/```[\s\S]*?```/g, "").trim();
// }