import React from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import StatCards from "./components/StatCards";
import BarChart from "./components/BarChart";
import ComplianceTable from "./components/ComplianceTable";

const stats = [
  {
    title: "Carbon Footprint",
    value: "1,250 tCO₂e",
    icon: "🌱",
    change: "+2.1%",
    color: "bg-green-600/80",
  },
  {
    title: "Risk Score",
    value: "Low",
    icon: "⚠️",
    change: "-1.3%",
    color: "bg-yellow-500/80",
  },
  {
    title: "Regulatory Scanner",
    value: "Compliant",
    icon: "🛡️",
    change: "0%",
    color: "bg-blue-600/80",
  },
];

const barData = [
  { dept: "Operations", value: 400 },
  { dept: "IT", value: 250 },
  { dept: "HR", value: 100 },
  { dept: "Finance", value: 200 },
  { dept: "R&D", value: 300 },
];

const tableData = [
  {
    activity: "Quarterly Audit",
    compliance: "Passed",
    priority: "High",
  },
  {
    activity: "Policy Update",
    compliance: "Pending",
    priority: "Medium",
  },
  {
    activity: "Incident Review",
    compliance: "Failed",
    priority: "Critical",
  },
  {
    activity: "Training",
    compliance: "Passed",
    priority: "Low",
  },
];

const priorityColors: Record<string, string> = {
  High: "bg-orange-500",
  Medium: "bg-yellow-400",
  Critical: "bg-red-600",
  Low: "bg-green-500",
};

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8 bg-[#111827]">
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
