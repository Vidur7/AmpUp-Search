'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Issue {
  text: string;
  type: 'check-pass' | 'check-fail' | 'check-warn';
  recommendation: string | null;
  playbook: string | null;
}

interface AnalysisData {
  url?: string;
  overall_score: number;
  technical: {
    total_score: number;
    issues: Issue[];
  };
  structured: {
    total_score: number;
    issues: Issue[];
  };
  content: {
    total_score: number;
    issues: Issue[];
  };
  eeat: {
    total_score: number;
    issues: Issue[];
  };
  recommendations: string[];
  timestamp: string;
  usage?: {
    analysis_count: number;
    full_views_used: number;
  };
}

// Component to show blurred content with upgrade prompt
const BlurredSection = () => (
  <div className="relative">
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
      <p className="text-gray-800 font-semibold mb-4">Upgrade to see detailed analysis</p>
      <button
        onClick={() => window.open('https://ampup.ai/pricing', '_blank')}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
      >
        Upgrade Now
      </button>
    </div>
  </div>
);

export default function AnalysisResults() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(data));
        setAnalysisData(decodedData);
      } catch (err) {
        setError('Invalid analysis data');
        console.error('Error parsing analysis data:', err);
      }
    } else {
      setError('No analysis data provided');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-red-800 font-semibold mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Check if user has exceeded free view limits
  const hasExceededFreeViews = analysisData.usage && analysisData.usage.full_views_used >= 2;
  const hasExceededAnalysis = analysisData.usage && analysisData.usage.analysis_count >= 5;

  // Determine which sections to blur
  const shouldBlurDetails = hasExceededFreeViews || hasExceededAnalysis;

  return (
    <div className="space-y-8">
      {/* URL and Overall Score */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
            {analysisData.url && (
              <p className="text-gray-600 mt-1">{analysisData.url}</p>
            )}
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(analysisData.overall_score)}`}>
              {Math.round(analysisData.overall_score)}%
            </div>
            <div className="text-sm text-gray-500">Overall Score</div>
          </div>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {shouldBlurDetails && <BlurredSection />}
        
        {/* Technical Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Score</span>
              <span className={`font-semibold ${getScoreColor(analysisData.technical.total_score)}`}>
                {analysisData.technical.total_score}%
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Issues</h4>
              <ul className="space-y-2">
                {analysisData.technical.issues.map((issue, index) => (
                  <li key={index} className="text-sm">
                    <div className={`flex items-start gap-2 ${issue.type === 'check-fail' ? 'text-red-600' : 'text-gray-600'}`}>
                      <span>{issue.type === 'check-fail' ? '❌' : '✓'}</span>
                      <span>{issue.text}</span>
                    </div>
                    {issue.recommendation && (
                      <p className="ml-6 mt-1 text-sm text-blue-600">
                        Recommendation: {issue.recommendation}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Structured Data */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Structured Data</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Score</span>
              <span className={`font-semibold ${getScoreColor(analysisData.structured.total_score)}`}>
                {analysisData.structured.total_score}%
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Issues</h4>
              <ul className="space-y-2">
                {analysisData.structured.issues.map((issue, index) => (
                  <li key={index} className="text-sm">
                    <div className={`flex items-start gap-2 ${issue.type === 'check-fail' ? 'text-red-600' : 'text-gray-600'}`}>
                      <span>{issue.type === 'check-fail' ? '❌' : '✓'}</span>
                      <span>{issue.text}</span>
                    </div>
                    {issue.recommendation && (
                      <p className="ml-6 mt-1 text-sm text-blue-600">
                        Recommendation: {issue.recommendation}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Content Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Score</span>
              <span className={`font-semibold ${getScoreColor(analysisData.content.total_score)}`}>
                {analysisData.content.total_score}%
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Issues</h4>
              <ul className="space-y-2">
                {analysisData.content.issues.map((issue, index) => (
                  <li key={index} className="text-sm">
                    <div className={`flex items-start gap-2 ${issue.type === 'check-fail' ? 'text-red-600' : 'text-gray-600'}`}>
                      <span>{issue.type === 'check-fail' ? '❌' : '✓'}</span>
                      <span>{issue.text}</span>
                    </div>
                    {issue.recommendation && (
                      <p className="ml-6 mt-1 text-sm text-blue-600">
                        Recommendation: {issue.recommendation}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* E-E-A-T Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">E-E-A-T Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Score</span>
              <span className={`font-semibold ${getScoreColor(analysisData.eeat.total_score)}`}>
                {analysisData.eeat.total_score}%
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Issues</h4>
              <ul className="space-y-2">
                {analysisData.eeat.issues.map((issue, index) => (
                  <li key={index} className="text-sm">
                    <div className={`flex items-start gap-2 ${issue.type === 'check-fail' ? 'text-red-600' : 'text-gray-600'}`}>
                      <span>{issue.type === 'check-fail' ? '❌' : '✓'}</span>
                      <span>{issue.text}</span>
                    </div>
                    {issue.recommendation && (
                      <p className="ml-6 mt-1 text-sm text-blue-600">
                        Recommendation: {issue.recommendation}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations - Also blur if exceeded limits */}
      <div className="bg-white rounded-lg shadow-sm p-6 relative">
        {shouldBlurDetails && <BlurredSection />}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Recommendations</h3>
        <ul className="space-y-2">
          {analysisData.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-600">
              <span className="text-indigo-500">•</span>
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Timestamp */}
      <div className="text-sm text-gray-500 text-right">
        Analysis performed on: {new Date(analysisData.timestamp).toLocaleString()}
      </div>
    </div>
  );
} 