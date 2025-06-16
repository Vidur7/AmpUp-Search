'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { AnalysisData } from '../types';

interface Issue {
  type: 'check-pass' | 'check-fail' | 'check-warn';
  text: string;
  recommendation: string | null;
}

interface AnalysisData {
  url?: string;
  overall_score: number;
  crawlability: {
    total_score: number;
    issues: Issue[];
  };
  structured_data: {
    total_score: number;
    issues: Issue[];
    schema_types: string[];
  };
  content_structure: {
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

function BlurredSection() {
  const router = useRouter();
  
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm bg-white/70 rounded-md">
      <div className="text-center px-6 py-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unlock Detailed Analysis</h3>
        <p className="text-sm text-gray-600 mb-6">
          Sign up to access comprehensive insights and actionable AI visibility recommendations
        </p>
        <button
          onClick={() => router.push('/auth/signup')}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all flex items-center space-x-2"
        >
          <span>🔓 Unlock Now</span>
        </button>
      </div>
    </div>
  );
}

export default function AnalysisResults({ activeTab = 'analysis' }: AnalysisResultsProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const analysisId = searchParams.get('id');
        if (!analysisId) {
          throw new Error('No analysis ID provided');
        }

        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:8000/api/v1/analyses/${analysisId}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analysis data');
        }

        const data = await response.json();
        setAnalysisData(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching analysis data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load analysis data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [searchParams]);

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (score >= 60) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-r from-red-400 to-red-600';
  };

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

  // Extract all recommendations from issues
  const allRecommendations: string[] = [
    ...(analysisData.recommendations || []),
    ...(analysisData.crawlability?.issues || [])
      .filter(issue => issue.recommendation)
      .map(issue => issue.recommendation as string),
    ...(analysisData.structured_data?.issues || [])
      .filter(issue => issue.recommendation)
      .map(issue => issue.recommendation as string),
    ...(analysisData.content_structure?.issues || [])
      .filter(issue => issue.recommendation)
      .map(issue => issue.recommendation as string),
    ...(analysisData.eeat?.issues || [])
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
            <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Recommendations</h2>
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
          {!isAuthenticated && <BlurredSection />}
          <div className={`space-y-6 ${!isAuthenticated ? 'blur-sm pointer-events-none select-none' : ''}`}>
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
    <div className="w-[380px] h-[520px] flex flex-col overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600">
      {/* Fixed Header with Buttons */}
      <div className="flex-none bg-indigo-700/50 backdrop-blur-sm p-2">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-white">Detailed Analysis</h2>
            {analysisData.url && (
              <p className="text-xs text-white/80 truncate max-w-[200px]">{analysisData.url}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded transition-colors"
            >
              Export
            </button>
            <button
              onClick={handleRescan}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded transition-colors"
            >
              Rescan
            </button>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="flex-none p-2">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <p className="text-xs opacity-80">Overall Score</p>
            <p className="text-2xl font-bold">{Math.round(analysisData.overall_score)}%</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-lg">
              {Math.round(analysisData.overall_score)}%
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Analysis Sections */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="relative">
          {!isAuthenticated && <BlurredSection />}
          <div className={`space-y-2 ${!isAuthenticated ? 'blur-sm pointer-events-none select-none' : ''}`}>
            {/* Crawlability Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-1">Crawlability</h3>
              <ul className="space-y-1">
                {analysisData.crawlability?.issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${
                      issue.type === 'check-pass' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <span className="text-[10px]">{issue.type === 'check-pass' ? '✓' : '×'}</span>
                    </span>
                    <div>
                      <p className="text-xs text-gray-800">{issue.text}</p>
                      {issue.recommendation && (
                        <p className="text-[10px] text-gray-600">{issue.recommendation}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Structured Data Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-1">Structured Data</h3>
              <ul className="space-y-1">
                {analysisData.structured_data?.issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${
                      issue.type === 'check-pass' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <span className="text-[10px]">{issue.type === 'check-pass' ? '✓' : '×'}</span>
                    </span>
                    <div>
                      <p className="text-xs text-gray-800">{issue.text}</p>
                      {issue.recommendation && (
                        <p className="text-[10px] text-gray-600">{issue.recommendation}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Content Structure Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-1">Content Structure</h3>
              <ul className="space-y-1">
                {analysisData.content_structure?.issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${
                      issue.type === 'check-pass' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <span className="text-[10px]">{issue.type === 'check-pass' ? '✓' : '×'}</span>
                    </span>
                    <div>
                      <p className="text-xs text-gray-800">{issue.text}</p>
                      {issue.recommendation && (
                        <p className="text-[10px] text-gray-600">{issue.recommendation}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* EEAT Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-1">E-E-A-T</h3>
              <ul className="space-y-1">
                {analysisData.eeat?.issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${
                      issue.type === 'check-pass' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <span className="text-[10px]">{issue.type === 'check-pass' ? '✓' : '×'}</span>
                    </span>
                    <div>
                      <p className="text-xs text-gray-800">{issue.text}</p>
                      {issue.recommendation && (
                        <p className="text-[10px] text-gray-600">{issue.recommendation}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 