"use client";
import React, { useState } from "react";

interface Analysis {
  selectedCompany: string;
  companyData: {
    initialCost: string;
    annualSavings: string;
    roi: string;
    paybackPeriod: string;
    implementationTime: string;
  };
  roiRankings: any[];
  strategies: any[];
  recommendations: string[];
  chartData: {
    costs: number[];
    savings: number[];
    strategies: string[];
    roi: number[];
  };
}

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  fileName: string;
}

const FileUpload = ({ onFileUpload, fileName }: FileUploadProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Upload Cost-Benefit Data (CSV)</h3>
      <div className="flex items-center justify-center w-full">
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-6 h-6 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-400">CSV file (multi-company supported)</p>
            {fileName && <p className="text-xs text-green-400 mt-2">Uploaded: {fileName}</p>}
          </div>
          <input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
        </label>
      </div> 
    </div>
  );
};

interface CompanySelectorProps {
  selectedCompany: string;
  setSelectedCompany: (company: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  hasFile: boolean;
}

const CompanySelector = ({ selectedCompany, setSelectedCompany, onAnalyze, loading, hasFile }: CompanySelectorProps) => (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Select Company & Analyze</h3>
    <select 
      className="w-full p-3 bg-gray-700 rounded-md text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500 mb-4"
      value={selectedCompany}
      onChange={(e) => setSelectedCompany(e.target.value)}
    >
      <option>Company A</option>
      <option>Company B</option>
      <option>Company C</option>
    </select>
    <button 
      onClick={onAnalyze}
      disabled={!hasFile || loading}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
    >
      {loading ? 'Analyzing...' : 'Analyze Cost-Benefit'}
    </button>
  </div>
);

interface ROIRankingGraphsProps {
  analysis: Analysis | null;
  loading: boolean;
}

// Simple ROI Bar Chart component
const ROIBarChart = ({ analysis }: { analysis: Analysis }) => (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">ROI Performance by Strategy</h3>
    <div className="space-y-3">
      {analysis.strategies.slice(0, 5).map((strategy, index) => (
        <div key={index} className="flex items-center space-x-4">
          <div className="w-32 text-sm text-gray-300 truncate">{strategy.strategy}</div>
          <div className="flex-1 bg-gray-700 rounded-full h-6 relative">
            <div 
              className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
              style={{ width: `${Math.min(strategy.roi / 250 * 100, 100)}%` }}
            >
              <span className="text-xs font-semibold text-white">{strategy.roi.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Cost vs Savings Chart
const CostSavingsChart = ({ analysis }: { analysis: Analysis }) => (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Cost vs Savings Analysis</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h4 className="text-sm font-medium mb-3 text-gray-300">Implementation Costs</h4>
        <div className="space-y-2">
          {analysis.strategies.slice(0, 3).map((strategy, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
              <span className="text-sm text-gray-300">{strategy.strategy}</span>
              <span className="text-sm font-semibold text-red-400">${strategy.cost.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-3 text-gray-300">Projected Savings</h4>
        <div className="space-y-2">
          {analysis.strategies.slice(0, 3).map((strategy, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
              <span className="text-sm text-gray-300">{strategy.strategy}</span>
              <span className="text-sm font-semibold text-green-400">${strategy.savings.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Company Performance Summary
const CompanyPerformanceCard = ({ analysis }: { analysis: Analysis }) => (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Company Performance: {analysis.selectedCompany}</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-400">{analysis.companyData.roi}</div>
        <div className="text-sm text-gray-400">ROI</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-400">{analysis.companyData.annualSavings}</div>
        <div className="text-sm text-gray-400">Annual Savings</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-400">{analysis.companyData.paybackPeriod}</div>
        <div className="text-sm text-gray-400">Payback Period</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-400">{analysis.companyData.initialCost}</div>
        <div className="text-sm text-gray-400">Initial Cost</div>
      </div>
    </div>
  </div>
);

export default function CostBenefitAnalysis() {
  const [selectedCompany, setSelectedCompany] = useState("Company A");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileData(content);
    };
    reader.readAsText(file);
  };

  const analyzeData = async () => {
    if (!fileData) {
      setError("Please upload a CSV file first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/cost-benefit-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData: fileData,
          selectedCompany
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Failed to analyze data');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#111827]">
          <h1 className="text-2xl font-bold mb-8">Cost-Benefit Analysis</h1>
          {error && (
            <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {/* Upload and Company Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FileUpload onFileUpload={handleFileUpload} fileName={fileName} />
            <CompanySelector 
              selectedCompany={selectedCompany}
              setSelectedCompany={setSelectedCompany}
              onAnalyze={analyzeData}
              loading={loading}
              hasFile={!!fileData}
            />
          </div>
          
          {/* Analysis Results */}
          {loading ? (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <div className="text-gray-300">Analyzing data...</div>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Company Performance Card */}
              <CompanyPerformanceCard analysis={analysis} />
              
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ROIBarChart analysis={analysis} />
                <CostSavingsChart analysis={analysis} />
              </div>
              
              {/* Strategy Rankings Table */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">ROI Rankings for {analysis.selectedCompany}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                      <tr>
                        <th className="px-6 py-3">#</th>
                        <th className="px-6 py-3">Strategy</th>
                        <th className="px-6 py-3">Cost</th>
                        <th className="px-6 py-3">Savings</th>
                        <th className="px-6 py-3">Waste Reduction</th>
                        <th className="px-6 py-3">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.strategies.map((strategy, index) => (
                        <tr key={index} className="bg-gray-800 border-b border-gray-700">
                          <td className="px-6 py-4 font-medium text-white">{index}</td>
                          <td className="px-6 py-4">{strategy.strategy}</td>
                          <td className="px-6 py-4">${strategy.cost.toLocaleString()}</td>
                          <td className="px-6 py-4">${strategy.savings.toLocaleString()}</td>
                          <td className="px-6 py-4">{strategy.waste_reduction}</td>
                          <td className="px-6 py-4 text-green-400 font-semibold">{strategy.roi.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <div className="text-gray-300">Upload a CSV file and select a company to see the analysis.</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
