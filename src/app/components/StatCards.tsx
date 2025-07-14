"use client";

import React from "react";
import { useRegulatoryData } from "./RegulatoryDataContext";

export default function StatCards() {
  const { data } = useRegulatoryData();

  // Compute total emissions from context data
  const totalEmissions = data.reduce((sum, item) => {
    const val = parseFloat(item.Emissions ?? item.emissions ?? "0");
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Example: Compute risk score (customize as needed)
  const riskScore = data.length > 0 ? (totalEmissions / (data.length * 1000)).toFixed(1) : "-";
  const riskLevel = parseFloat(riskScore) > 5 ? "High" : "Low";

  const stats = [
    {
      title: data.length === 0 ? "-" : `${Math.round(totalEmissions).toLocaleString()} tons CO₂`,
      subtitle: "Total Carbon Footprint",
      label: "Current Emissions",
    },
    {
      title: data.length === 0 ? "-" : `${riskScore}/10`,
      subtitle: riskLevel === "High" ? "High Risk" : "Low Risk",
      label: "Compliance Risk Score",
      badge: riskLevel === "High" ? "High Risk" : "Low Risk",
      badgeColor: riskLevel === "High" ? "bg-red-600" : "bg-green-600",
    },
    {
      title: data.length === 0 ? "-" : "Compliant",
      subtitle: data.length === 0 ? "No data" : "All systems operational",
      label: "Regulatory Scanner",
      badge: data.length === 0 ? undefined : "Active",
      badgeColor: "bg-green-600",
    },
    {
      title: data.length === 0 ? "-" : `${data.length} Records`,
      subtitle: data.length === 0 ? "No data" : "Records loaded",
      label: "System Status",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-[#192132] rounded-xl p-6 flex flex-col gap-2 shadow-md min-w-[180px]"
        >
          {stat.label && (
            <div className="text-xs text-gray-400 font-medium mb-1">{stat.label}</div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{stat.title}</span>
            {stat.badge && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${stat.badgeColor}`}>{stat.badge}</span>
            )}
          </div>
          <div className="text-xs text-gray-400">{stat.subtitle}</div>
        </div>
      ))}
    </div>
  );
} 