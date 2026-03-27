/**
 * RuleLibrary.jsx
 * Page wrapper. Composes Sidebar + Topbar + RuleLibraryFull.
 * Route: /rules
 */

import Sidebar from "../components/layout/Sidebar";
import Topbar  from "../components/layout/Topbar";
import RuleLibraryFull from "../components/rule-library/RuleLibraryFull";

export default function RuleLibrary() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">

          {/* Page title */}
          <div className="px-6 pt-5 pb-0">
            <h1 className="text-xl font-semibold text-[var(--text)]">Rule Library</h1>
          </div>

          <RuleLibraryFull />
        </div>
      </div>
    </div>
  );
}