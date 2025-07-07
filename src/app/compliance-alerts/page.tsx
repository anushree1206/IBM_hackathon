"use client";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AlertCard from "../components/AlertCard";
import React, { useState } from "react";
import { useRegulatoryData } from "../components/RegulatoryDataContext";

export default function ComplianceAlertsPage() {
  const { data } = useRegulatoryData();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  // Generate alerts from data
  const alerts: { status: string; title: string; description: string }[] = [];
  data.forEach((row, idx) => {
    // Example: High emissions alert
    const emissions = parseFloat(row.Emissions ?? row.emissions ?? "0");
    if (!isNaN(emissions) && emissions > 1000) {
      alerts.push({
        status: "High",
        title: `High Emissions Detected (${emissions} tons)`,
        description: `Record ${idx + 1} exceeds safe emissions threshold. Immediate review required.`
      });
    }
    // Example: Compliance deadline alert
    if (row.Due || row.Deadline || row.due || row.deadline) {
      alerts.push({
        status: "Medium",
        title: `Upcoming Compliance Deadline`,
        description: `Deadline for ${row.Regulation || row.regulation || "a regulation"} is ${row.Due || row.Deadline || row.due || row.deadline}. Ensure compliance to avoid penalties.`
      });
    }
    // Example: Missing compliance status
    if (!row.Compliance && !row.compliance && !row.Status && !row.status) {
      alerts.push({
        status: "Medium",
        title: `Missing Compliance Status`,
        description: `Record ${idx + 1} is missing compliance status. Please update.`
      });
    }
  });

  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8 bg-[#111827]">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Compliance Alerts</h1>
            <div className="text-gray-400 mb-6">Review and address active compliance alerts for your organization, dynamically generated from your uploaded data.</div>
            {alerts.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No alerts generated from uploaded data.</div>
            ) : (
              alerts.map((alert, idx) => (
                <AlertCard
                  key={idx}
                  {...alert}
                  status={alert.status as 'High' | 'Medium'}
                  open={openIdx === idx}
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 