import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchDashboard } from "../features/dashboard/dashboardSlice";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import KPICard from "../components/common/KPICard";

function Dashboard() {
  const dispatch = useAppDispatch();
  const { kpis, loading } = useAppSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  return (
    <div className="flex">
      
      <Sidebar />

      <div className="flex-1">
        
        <Topbar />

        <div className="p-6">
          
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {kpis.map((kpi) => (
                <KPICard key={kpi.title} data={kpi} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Dashboard;