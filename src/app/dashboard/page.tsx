import React from "react";
import StatCards from "../components/StatCards";
import BarChart from "../components/BarChart";
import ComplianceTable from "../components/ComplianceTable";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#111827]">
          <StatCards />
          <div className="flex flex-col md:flex-row gap-8 mt-2">
            <BarChart />
            <ComplianceTable />
          </div>
        </main>
      </div>
    </div>
  );
}
