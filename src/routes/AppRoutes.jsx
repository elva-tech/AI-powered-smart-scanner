import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import RuleLibrary from "../pages/RuleLibrary";
import { useAppSelector } from "../app/hooks";
import CaseManagement from "../pages/caseManagement";
import Security from "../pages/Security";
import AIRuleArchitect from "../pages/AIRuleArchitect";

const ProtectedRoute = ({ children }) => {
  const user = useAppSelector((state) => state.auth.user);
  return user ? children : <Navigate to="/login" />;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rules"
          element={
            <ProtectedRoute>
              <RuleLibrary />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <CaseManagement />
            </ProtectedRoute>
          }
        />

          <Route
          path="/security"
          element={
            <ProtectedRoute>
              <Security />
            </ProtectedRoute>
          }
        />


            <Route
          path="/architect"
          element={
            <ProtectedRoute>
              <AIRuleArchitect />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}