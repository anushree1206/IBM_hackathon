import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const ScenarioInput = () => (
  <div className="bg-gray-800 p-6 rounded-lg mb-8">
    <h3 className="text-lg font-semibold mb-4">Describe Regulatory Scenario</h3>
    <textarea
      className="w-full p-3 bg-gray-700 rounded-md text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
      rows={5}
      placeholder="e.g., New carbon tax introduced, stricter emissions limits by 2030..."
    ></textarea>
  </div>
);

const TimelineInputs = () => (
  <div className="bg-gray-800 p-6 rounded-lg mb-8">
    <h3 className="text-lg font-semibold mb-4">Timeline & Strictness</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="strictness" className="block text-sm font-medium mb-2 text-gray-300">Regulation Strictness Level</label>
        <select id="strictness" className="w-full p-3 bg-gray-700 rounded-md text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500">
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Very High</option>
        </select>
      </div>
      <div>
        <label htmlFor="complianceTimeline" className="block text-sm font-medium mb-2 text-gray-300">Compliance Timeline (Years)</label>
        <input
          type="number"
          id="complianceTimeline"
          className="w-full p-3 bg-gray-700 rounded-md text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 5"
        />
      </div>
    </div>
  </div>
);

const SummaryOutput = () => (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Model Summary</h3>
    <div className="text-gray-300">
      {/* Placeholder for model's summary */}
      <p>Based on the scenario, the estimated impact on operations is...</p>
      <p>Potential costs: $X million</p>
      <p>Required changes: Y, Z, A</p>
    </div>
  </div>
);

export default function WhatIfCalculator() {
  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8 bg-[#111827]">
          <h1 className="text-2xl font-bold mb-8">What-If Scenario Calculator</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <ScenarioInput />
              <TimelineInputs />
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 w-full">
                Calculate Scenario
              </button>
            </div>
            <SummaryOutput />
          </div>
        </main>
      </div>
    </div>
  );
}