/**
 * RuleLibrary.jsx
 * Page wrapper. Composes Sidebar + Topbar + RuleLibraryFull.
 * Route: /rules
 */

import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar  from "../components/layout/Topbar";
import RuleLibraryFull from "../components/rule-library/RuleLibraryFull";
// ✅ NEW: Import backend services
import { ruleService } from "../services/ruleService";
import { sapService } from "../services/sapService";

export default function RuleLibrary() {
  // ✅ NEW: Backend state
  const [sapStatus, setSapStatus] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  // ✅ NEW: Check SAP connection on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // ✅ NEW: Backend connection check
  const checkBackendConnection = async () => {
    try {
      const result = await sapService.testConnection();
      setSapStatus(result);
      if (result.status === 'error') {
        setApiError('SAP connection failed: ' + result.message);
      }
    } catch (error) {
      setApiError('Failed to connect to backend: ' + error.message);
      console.error('Backend connection error:', error);
    }
  };

  // ✅ NEW: Process rule request through AI Agent
  const processRuleRequest = async (userInput) => {
    setIsCreatingRule(true);
    setApiError(null);
    try {
      const result = await ruleService.processRuleRequest(userInput);
      if (result.status === 'error') {
        setApiError(result.message);
        return null;
      }
      return result;
    } catch (error) {
      setApiError(error.message);
      return null;
    } finally {
      setIsCreatingRule(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">

          {/* ✅ NEW: Backend connection alerts */}
          {apiError && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-[12px]">
              ⚠️ {apiError}
            </div>
          )}

          {sapStatus && sapStatus.status === 'connected' && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[12px]">
              ✓ SAP Connected and ready for rule deployment
            </div>
          )}

          {/* Page title */}
          <div className="px-6 pt-5 pb-0">
            <h1 className="text-xl font-semibold text-[var(--text)]">Rule Library</h1>
          </div>

          {/* ✅ NEW: Pass backend functions as props */}
          <RuleLibraryFull 
            onProcessRule={processRuleRequest}
            isProcessingRule={isCreatingRule}
            sapStatus={sapStatus}
          />
        </div>
      </div>
    </div>
  );
}