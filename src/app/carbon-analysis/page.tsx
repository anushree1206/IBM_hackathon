import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

// Placeholder components for the new charts and cards
const TotalAnnualEmissionsCard = () => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <h2 className="text-lg font-semibold">Total Annual Emissions</h2>
    <p className="text-3xl font-bold">1,234 tCO₂e</p>
  </div>
);

const EmissionsIntensityCard = () => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <h2 className="text-lg font-semibold">Emissions Intensity</h2>
    <p className="text-3xl font-bold">0.15 tCO2e / $1k revenue</p>
    <p className="text-sm text-green-400">-5% compared to last year</p>
  </div>
);

const RenewableEnergyUsageCard = () => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <h2 className="text-lg font-semibold">Renewable Energy Usage</h2>
    <p className="text-3xl font-bold">25%</p>
  </div>
);

const EmissionsByScopeChart = () => (
  <div className="bg-gray-800 p-4 rounded-lg col-span-2">
    <h2 className="text-lg font-semibold">Emissions by Scope</h2>
    {/* Placeholder for chart */}
    <div className="h-64 bg-gray-700 rounded-md mt-2"></div>
  </div>
);

const MonthlyEmissionsTrendChart = () => (
  <div className="bg-gray-800 p-4 rounded-lg col-span-3">
    <h2 className="text-lg font-semibold">Monthly Emissions Trend</h2>
    {/* Placeholder for chart */}
    <div className="h-64 bg-gray-700 rounded-md mt-2"></div>
  </div>
);


export default function CarbonAnalysis() {
  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8 bg-[#111827]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TotalAnnualEmissionsCard />
            <EmissionsIntensityCard />
            <RenewableEnergyUsageCard />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mt-8">
            <EmissionsByScopeChart />
            <MonthlyEmissionsTrendChart />
          </div>
        </main>
      </div>
    </div>
  );
}