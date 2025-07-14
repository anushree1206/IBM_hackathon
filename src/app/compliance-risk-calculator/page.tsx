"use client";
import React, { useState } from "react";

interface Analysis {
  fileName: string;
  overallRiskScore: number;
  riskLevel: string;
  keyRiskAreas: string[];
  recommendations: string[];
  complianceMetrics: {
    regulatoryCompliance: number;
    dataPrivacy: number;
    environmentalImpact: number;
    operationalRisk: number;
  };
  actionItems: any[];
  timeline: any;
  companyRiskData: any[];
}

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onAnalyze: () => void;
  fileName: string;
  loading: boolean;
  hasFile: boolean;
}

const FileUpload = ({ onFileUpload, onAnalyze, fileName, loading, hasFile }: FileUploadProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Upload Risk Input File</h3>
      <div className="flex items-center justify-center w-full mb-4">
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-6 h-6 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-400">CSV, XLSX, or other supported formats</p>
            {fileName && <p className="text-xs text-green-400 mt-2">Uploaded: {fileName}</p>}
          </div>
          <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
      <button 
        onClick={onAnalyze}
        disabled={!hasFile || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
      >
        {loading ? 'Analyzing...' : 'Analyze Risk'}
      </button>
    </div>
  );
};

interface AnalysisResultsProps {
  analysis: Analysis | null;
}


// Risk Metrics Chart
const RiskMetricsChart = ({ analysis }: { analysis: Analysis }) => (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Risk Metrics</h3>
    <div className="space-y-4">
      {Object.entries(analysis.complianceMetrics).map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const percentage = value;
        return (
          <div key={key} className="flex items-center space-x-4">
            <div className="w-32 text-sm text-gray-300">{label}</div>
            <div className="flex-1 bg-gray-700 rounded-full h-4 relative">
              <div 
                className={`h-4 rounded-full ${
                  percentage > 70 ? 'bg-red-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                {percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// Company Risk Comparison Chart
const CompanyRiskChart = ({ analysis }: { analysis: Analysis }) => (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Company Risk Comparison</h3>
    <div className="space-y-3">
      {analysis.companyRiskData.slice(0, 5).map((company, index) => {
        const maxCost = Math.max(...analysis.companyRiskData.map(c => c.penalty_cost));
        const percentage = (company.penalty_cost / maxCost) * 100;
        return (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-24 text-sm text-gray-300 truncate">{company.company}</div>
            <div className="flex-1 bg-gray-700 rounded-full h-6 relative">
              <div 
                className={`h-6 rounded-full ${
                  company.recommended_action === 'Fix Compliance Issue' ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${percentage}%` }}
              >
                <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-semibold text-white">
                  ${company.penalty_cost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const AnalysisResults = ({ analysis }: AnalysisResultsProps) => (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
    {analysis ? (
      <div className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-bold mb-2 ${
            analysis.riskLevel === 'High' || analysis.riskLevel === 'Very High' ? 'text-red-400' : 
            analysis.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {analysis.overallRiskScore.toFixed(1)}
          </div>
          <div className="text-sm text-gray-400">Overall Risk Score</div>
          <div className={`text-lg font-semibold ${
            analysis.riskLevel === 'High' || analysis.riskLevel === 'Very High' ? 'text-red-400' : 
            analysis.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {analysis.riskLevel}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-gray-300">Key Risk Areas</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.keyRiskAreas.map((area, index) => (
              <span key={index} className="bg-red-600 text-white px-2 py-1 rounded text-sm">
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div className="text-gray-300 text-center py-8">
        <p>Upload a file and click analyze to see results.</p>
      </div>
    )}
  </div>
);

interface RecommendedActionsChartProps {
  analysis: Analysis | null;
}

const RecommendedActionsChart = ({ analysis }: RecommendedActionsChartProps) => (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Recommended Actions</h3>
    {analysis && analysis.recommendations ? (
      <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
        {analysis.recommendations.map((rec, index) => (
          <li key={index}>{rec}</li>
        ))}
      </ul>
    ) : (
      <div className="h-64 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
        <p>Recommendations will appear here.</p>
      </div>
    )}
  </div>
);

export default function ComplianceRiskCalculator() {
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
      // Don't auto-analyze, wait for user to click analyze button
    };
    reader.readAsText(file);
  };

  const analyzeRisk = async (data, name) => {
    if (!data) {
      setError("File data is missing");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/compliance-risk-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: data,
          fileName: name
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysis(result.analysis);
      } else {
        setError(result.error || 'Failed to analyze risk');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await fetch('/api/compliance-risk-calculator');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "compliance-risk-report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError('Failed to download report');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#111827]">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Compliance Risk Calculator</h1>
            <button 
              onClick={downloadReport}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Download Risk Report (CSV)
            </button>
          </div>
          {error && (
            <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          {/* Upload and Analyze Section */}
          <div className="mb-8">
            <FileUpload 
              onFileUpload={handleFileUpload} 
              onAnalyze={() => analyzeRisk(fileData, fileName)}
              fileName={fileName} 
              loading={loading}
              hasFile={!!fileData}
            />
          </div>
          
          {/* Analysis Results */}
          {loading ? (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <div className="text-gray-300">Analyzing risk data...</div>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Summary and Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AnalysisResults analysis={analysis} />
                <RiskMetricsChart analysis={analysis} />
                <CompanyRiskChart analysis={analysis} />
              </div>
              
              {/* Recommendations */}
              <RecommendedActionsChart analysis={analysis} />
              
              {/* Company Risk Data Table */}
              {analysis.companyRiskData && (
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Compliance Risk Analysis Results</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                      <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                          <th className="px-6 py-3">#</th>
                          <th className="px-6 py-3">Company</th>
                          <th className="px-6 py-3">Compliance Cost</th>
                          <th className="px-6 py-3">Penalty Cost</th>
                          <th className="px-6 py-3">Savings If Fixed</th>
                          <th className="px-6 py-3">Recommended Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.companyRiskData.map((company, index) => (
                          <tr key={index} className="bg-gray-800 border-b border-gray-700">
                            <td className="px-6 py-4 font-medium text-white">{index}</td>
                            <td className="px-6 py-4 font-medium text-white">{company.company}</td>
                            <td className="px-6 py-4">${company.compliance_cost.toLocaleString()}</td>
                            <td className="px-6 py-4">${company.penalty_cost.toLocaleString()}</td>
                            <td className={`px-6 py-4 font-semibold ${
                              company.savings_if_fixed >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {company.savings_if_fixed >= 0 ? '+' : '-'}${Math.abs(company.savings_if_fixed).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">{company.recommended_action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <div className="text-gray-300">Upload a file and click analyze to see the risk assessment.</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
