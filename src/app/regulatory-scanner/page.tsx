"use client";
import React, { useRef } from "react";
import { useRegulatoryData } from "../components/RegulatoryDataContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function parseCSV(text: string) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = values[i]?.trim() || "";
    });
    return obj;
  });
}

export default function RegulatoryScanner() {
  const { data, setData } = useRegulatoryData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    setData(parsed);
  };

  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8 bg-[#111827]">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Regulatory Scanner</h1>
              <p className="text-gray-400">Upload and analyze regulatory compliance data for your organization</p>
            </div>
            
            {/* File Upload Section */}
            <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6 mb-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Upload Emissions Data</h2>
                  <p className="text-gray-400 text-sm">Upload CSV files to analyze regulatory compliance</p>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-[#4b5563] rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium text-gray-300 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">CSV files only</p>
                </label>
              </div>
            </div>

            {/* Data Preview Section */}
            <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Data Preview</h3>
                {data.length > 0 && (
                  <span className="ml-auto bg-green-600 text-xs px-3 py-1 rounded-full font-semibold">
                    {data.length} records loaded
                  </span>
                )}
              </div>
              
              {data.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-400 text-lg">No data uploaded yet</p>
                  <p className="text-gray-500 text-sm">Upload a CSV file to see the preview</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-[#374151]">
                        {Object.keys(data[0]).map((header) => (
                          <th key={header} className="px-4 py-3 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#374151]">
                      {data.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-[#2d3748] transition-colors">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-4 py-3 text-sm text-gray-300">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 5 && (
                    <div className="mt-4 text-center">
                      <span className="text-gray-400 text-sm">
                        Showing first 5 rows of {data.length} total records
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 