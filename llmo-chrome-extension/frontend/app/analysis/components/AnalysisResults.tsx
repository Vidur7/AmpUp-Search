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

interface AnalysisResultsProps {
  activeTab?: 'analysis' | 'recommendations';
}

// Component to show blurred content with upgrade prompt
const BlurredSection = () => (
  <div className="relative">
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
      <p className="text-gray-800 font-semibold mb-4">Upgrade to see detailed analysis</p>
      <button
        onClick={() => window.open('https://ampup.ai/pricing', '_blank')}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-md hover:shadow-lg transition-all"
      >
        Upgrade Now
      </button>
    </div>
  </div>
);

export default function AnalysisResults({ activeTab = 'analysis' }: AnalysisResultsProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchAnalysisData = async () => {
      setLoading(true);
      
      // First check if data is passed directly in URL
      const data = searchParams.get('data');
      if (data) {
        try {
          const decodedData = JSON.parse(decodeURIComponent(data));
          setAnalysisData(decodedData);
          setError(null);
        } catch (err) {
          setError('Invalid analysis data');
          console.error('Error parsing analysis data:', err);
        } finally {
          setLoading(false);
        }
        return;
      }
      
      // If not, check if there's an ID to fetch from API
      const id = searchParams.get('id');
      if (id) {
        try {
          const token = localStorage.getItem('token');
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch(`http://localhost:8000/api/v1/analyses/${id}`, {
            headers,
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch analysis: ${response.statusText}`);
          }
          
          const analysisData = await response.json();
          setAnalysisData(analysisData);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load analysis data');
          console.error('Error fetching analysis:', err);
        } finally {
          setLoading(false);
        }
        return;
      }
      
      setError('No analysis data or ID provided');
      setLoading(false);
    };

    fetchAnalysisData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

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

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (score >= 60) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-r from-red-400 to-red-600';
  };

  // Check if user has exceeded free view limits
  const hasExceededFreeViews = analysisData.usage && analysisData.usage.full_views_used >= 2;
  const hasExceededAnalysis = analysisData.usage && analysisData.usage.analysis_count >= 5;

  // Determine which sections to blur
  const shouldBlurDetails = hasExceededFreeViews || hasExceededAnalysis;

  // Extract all recommendations from issues
  const allRecommendations: string[] = [
    ...analysisData.recommendations,
    ...analysisData.technical.issues
      .filter(issue => issue.recommendation)
      .map(issue => issue.recommendation as string),
    ...analysisData.structured.issues
      .filter(issue => issue.recommendation)
      .map(issue => issue.recommendation as string),
    ...analysisData.content.issues
      .filter(issue => issue.recommendation)
      .map(issue => issue.recommendation as string),
    ...analysisData.eeat.issues
      .filter(issue => issue.recommendation)
      .map(issue => issue.recommendation as string)
  ];

  // Remove duplicates
  const uniqueRecommendations = [...new Set(allRecommendations)];

  if (activeTab === 'recommendations') {
    return (
      <div className="space-y-8">
        {/* URL and Overall Score */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recommendations</h2>
            {analysisData.url && (
              <p className="text-gray-600 mt-1">{analysisData.url}</p>
            )}
          </div>
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full ${getScoreBgColor(analysisData.overall_score)} flex items-center justify-center text-white font-bold text-xl`}>
              {Math.round(analysisData.overall_score)}%
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="relative">
          {shouldBlurDetails && <BlurredSection />}
          <div className="space-y-6">
            {uniqueRecommendations.map((recommendation, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
                <p className="text-gray-800">{recommendation}</p>
              </div>
            ))}
            
            {uniqueRecommendations.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-600">No recommendations available for this analysis.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* URL and Overall Score */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
          {analysisData.url && (
            <p className="text-gray-600 mt-1">{analysisData.url}</p>
          )}
        </div>
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full ${getScoreBgColor(analysisData.overall_score)} flex items-center justify-center text-white font-bold text-xl`}>
            {Math.round(analysisData.overall_score)}%
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
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-sm text-gray-500 text-right">
        Analysis performed on: {new Date(analysisData.timestamp).toLocaleString()}
      </div>
    </div>
  );
} 