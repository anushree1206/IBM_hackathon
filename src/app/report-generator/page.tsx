import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const ReportGeneratorForm = () => (
  <div className="bg-gray-800 p-8 rounded-lg w-full max-w-4xl mx-auto">
    <h2 className="text-2xl font-bold mb-6 text-white">Report Generator</h2>
    <form>
      <div className="mb-4">
        <label htmlFor="reportType" className="block text-sm font-medium mb-2 text-gray-300">Report Type</label>
        <select id="reportType" name="reportType" className="w-full p-3 bg-gray-700 rounded-md text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500">
          <option>Annual Emissions Report</option>
          <option>Compliance Report</option>
          <option>Sustainability Performance Report</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-300">Date Range</label>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <input type="date" name="startDate" className="w-full p-3 bg-gray-700 rounded-md text-white border border-gray-600" />
          <input type="date" name="endDate" className="w-full p-3 bg-gray-700 rounded-md text-white border border-gray-600" />
        </div>
      </div>
      <div className="mb-6">
        <label htmlFor="outputFormat" className="block text-sm font-medium mb-2 text-gray-300">Output Format</label>
        <select id="outputFormat" name="outputFormat" className="w-full p-3 bg-gray-700 rounded-md text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500">
          <option>PDF</option>
          <option>CSV</option>
          <option>XLSX</option>
        </select>
      </div>
      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300">
        Generate Report
      </button>
    </form>
  </div>
);

export default function ReportGenerator() {
  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8 bg-[#111827] flex items-center justify-center">
          <ReportGeneratorForm />
        </main>
      </div>
    </div>
  );
}