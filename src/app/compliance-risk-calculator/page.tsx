import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const FileUpload = () => (
  <div className="bg-gray-800 p-6 rounded-lg mb-8">
    <h3 className="text-lg font-semibold mb-4">Upload Risk Input File</h3>
    <div className="flex items-center justify-center w-full">
      <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-gray-400">CSV, XLSX, or other supported formats</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" />
      </label>
    </div> 
  </div>
);

const AnalysisResults = () => (
  <div className="bg-gray-800 p-6 rounded-lg mb-8">
    <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
    <div className="text-gray-300">
      {/* Placeholder for analysis results */}
      <p>Overall Risk Score: <span className="font-bold text-red-400">High</span></p>
      <p>Key Risk Areas: Regulatory Changes, Data Privacy</p>
    </div>
  </div>
);

const RecommendedActionsChart = () => (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Recommended Actions</h3>
    {/* Placeholder for bar graph */}
    <div className="h-64 bg-gray-700 rounded-md"></div>
  </div>
);

export default function ComplianceRiskCalculator() {
  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8 bg-[#111827]">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Compliance Risk Calculator</h1>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
              Download Risk Report (CSV)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <FileUpload />
              <AnalysisResults />
            </div>
            <RecommendedActionsChart />
          </div>
        </main>
      </div>
    </div>
  );
}