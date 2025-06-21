'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Issue {
  severity: 'high' | 'medium' | 'low';
  message: string;
  recommendation?: string;
}

interface AnalysisData {
  id: string;
  url: string;
  overall_score: number;
  crawlability: {
    total_score: number;
    issues: Issue[];
  };
  structured_data: {
    total_score: number;
    issues: Issue[];
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
}

interface AnalysisResultsProps {
  activeTab: 'analysis' | 'recommendations';
  analysisId?: string;
  directData?: AnalysisData | null;
}

const BlurredSection = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    <div className="blur-sm pointer-events-none">
      {children}
    </div>
    <div className="absolute inset-0 flex items-center justify-center bg-white/50">
      <div className="text-center p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign up to unlock detailed insights</h3>
        <p className="text-gray-600 mb-4">Get access to comprehensive analysis and personalized recommendations</p>
        <button
          onClick={() => window.location.href = '/auth/signup'}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Sign Up Now
        </button>
      </div>
    </div>
  </div>
);

export default function AnalysisResults({ activeTab, analysisId, directData }: AnalysisResultsProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // If we have direct data, use it instead of fetching
    if (directData) {
      console.log('AnalysisResults - Using direct data:', directData);
      
      try {
        // Ensure data has all required fields with fallbacks
        const validatedData = {
          id: directData.id || 'temp-id',
          url: directData.url || 'unknown',
          overall_score: directData.overall_score || 0,
          crawlability: {
            total_score: directData.crawlability?.total_score || 0,
            issues: Array.isArray(directData.crawlability?.issues) 
              ? directData.crawlability.issues 
              : []
          },
          structured_data: {
            total_score: directData.structured_data?.total_score || 0,
            issues: Array.isArray(directData.structured_data?.issues)
              ? directData.structured_data.issues
              : []
          },
          content_structure: {
            total_score: directData.content_structure?.total_score || 0,
            issues: Array.isArray(directData.content_structure?.issues)
              ? directData.content_structure.issues
              : []
          },
          eeat: {
            total_score: directData.eeat?.total_score || 0,
            issues: Array.isArray(directData.eeat?.issues)
              ? directData.eeat.issues
              : []
          },
          recommendations: Array.isArray(directData.recommendations)
            ? directData.recommendations
            : [],
          timestamp: directData.timestamp || new Date().toISOString()
        };
        
        setAnalysisData(validatedData);
      } catch (error) {
        console.error('Error processing direct data:', error);
        setError('Failed to process analysis data');
      }
      
      setLoading(false);
      return;
    }

    // Otherwise fetch data using the ID
    const fetchAnalysisData = async () => {
      try {
        if (!analysisId) {
          console.error('AnalysisResults - No analysis ID provided');
          throw new Error('No analysis ID provided');
        }

        console.log('AnalysisResults - Fetching data for analysis ID:', analysisId);

        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:8000/api/v1/analysis/${analysisId}`, {
          headers,
        });

        if (!response.ok) {
          console.error('AnalysisResults - API error:', response.status, response.statusText);
          throw new Error(`Failed to fetch analysis data (${response.status})`);
        }

        const responseData = await response.json();
        console.log('AnalysisResults - Received data:', responseData);
        
        // Check if the data is wrapped in a 'data' property (API response format)
        const data = responseData.data || responseData;
        
        // Ensure data has all required fields with fallbacks
        const validatedData = {
          id: data.id || analysisId,
          url: data.url || 'unknown',
          overall_score: data.overall_score || 0,
          crawlability: {
            total_score: data.crawlability?.total_score || 0,
            issues: Array.isArray(data.crawlability?.issues)
              ? data.crawlability.issues
              : []
          },
          structured_data: {
            total_score: data.structured_data?.total_score || 0,
            issues: Array.isArray(data.structured_data?.issues)
              ? data.structured_data.issues
              : []
          },
          content_structure: {
            total_score: data.content_structure?.total_score || 0,
            issues: Array.isArray(data.content_structure?.issues)
              ? data.content_structure.issues
              : []
          },
          eeat: {
            total_score: data.eeat?.total_score || 0,
            issues: Array.isArray(data.eeat?.issues)
              ? data.eeat.issues
              : []
          },
          recommendations: Array.isArray(data.recommendations)
            ? data.recommendations
            : [],
          timestamp: data.timestamp || new Date().toISOString()
        };
        
        setAnalysisData(validatedData);
        setError(null);
      } catch (error) {
        console.error('Error fetching analysis data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load analysis data');
      } finally {
        setLoading(false);
      }
    };

    if (analysisId) {
      fetchAnalysisData();
    } else {
      setLoading(false);
    }
  }, [analysisId, directData]);

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (score >= 60) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-r from-red-400 to-red-600';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100 p-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Analysis Error</h3>
          <div className="text-red-600 text-lg mb-6 max-w-md">{error}</div>
          <div className="space-y-4 text-left bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 max-w-lg">
            <h4 className="font-semibold text-gray-700">Common causes:</h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>The website blocks automated access or scraping</li>
              <li>The website requires authentication or login</li>
              <li>The website uses anti-bot measures</li>
              <li>The URL is invalid or the page doesn&apos;t exist</li>
              <li>Network connectivity issues</li>
            </ul>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/analyses')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Return to Analyses
            </button>
            <button
              onClick={() => window.location.href = 'http://localhost:3000/dashboard'}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  const renderAnalysisContent = () => {
    const content = (
      <div className="space-y-10">
        {/* Overall Score */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Overall Score</h2>
          <div className="flex flex-col items-center justify-center">
            <div className={`w-40 h-40 rounded-full ${getScoreBgColor(analysisData.overall_score)} flex items-center justify-center text-white text-5xl font-bold shadow-lg`}>
              {analysisData.overall_score}
            </div>
            <p className="mt-4 text-gray-600 font-medium">out of 100 points</p>
            <div className="mt-6 text-center">
              <p className="text-lg text-gray-800">
                {analysisData.overall_score >= 80 ? 'Great job! Your page is well optimized.' : 
                 analysisData.overall_score >= 60 ? 'Your page needs some improvements.' : 
                 'Your page requires significant optimization.'}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Analysis Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Crawlability */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Crawlability</h3>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className={`w-28 h-28 rounded-full mx-auto ${getScoreBgColor(analysisData.crawlability.total_score)} flex items-center justify-center text-white text-3xl font-bold shadow-md`}>
                  {analysisData.crawlability.total_score}
                </div>
                <p className="mt-2 text-gray-500">out of 100</p>
              </div>
            </div>
            
            {isAuthenticated ? (
              <div className="space-y-3 flex-grow">
                {analysisData.crawlability.issues.length > 0 ? (
                  analysisData.crawlability.issues.map((issue, index) => {
                    // Only skip rendering if both message and recommendation are empty
                    if ((!issue.message || issue.message.trim() === '') && 
                        (!issue.recommendation || issue.recommendation.trim() === '')) {
                      return null;
                    }
                    
                    return (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 flex-shrink-0 ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {issue.severity === 'high' ? '!' : 
                             issue.severity === 'medium' ? '•' : '✓'}
                          </span>
                          <div>
                            {issue.message && issue.message.trim() !== '' && (
                              <p className="text-gray-800 font-medium">{issue.message}</p>
                            )}
                            {issue.recommendation && issue.recommendation.trim() !== '' && (
                              <p className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">Recommendation:</span> {issue.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }).filter(Boolean) // Filter out null values
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 italic">No issues found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-500">Sign in to view detailed issues</p>
              </div>
            )}
          </div>

          {/* Structured Data */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Structured Data</h3>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className={`w-28 h-28 rounded-full mx-auto ${getScoreBgColor(analysisData.structured_data.total_score)} flex items-center justify-center text-white text-3xl font-bold shadow-md`}>
                  {analysisData.structured_data.total_score}
                </div>
                <p className="mt-2 text-gray-500">out of 100</p>
              </div>
            </div>
            
            {isAuthenticated ? (
              <div className="space-y-3 flex-grow">
                {analysisData.structured_data.issues.length > 0 ? (
                  analysisData.structured_data.issues.map((issue, index) => {
                    // Only skip rendering if both message and recommendation are empty
                    if ((!issue.message || issue.message.trim() === '') && 
                        (!issue.recommendation || issue.recommendation.trim() === '')) {
                      return null;
                    }
                    
                    return (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 flex-shrink-0 ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {issue.severity === 'high' ? '!' : 
                             issue.severity === 'medium' ? '•' : '✓'}
                          </span>
                          <div>
                            {issue.message && issue.message.trim() !== '' && (
                              <p className="text-gray-800 font-medium">{issue.message}</p>
                            )}
                            {issue.recommendation && issue.recommendation.trim() !== '' && (
                              <p className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">Recommendation:</span> {issue.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }).filter(Boolean) // Filter out null values
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 italic">No issues found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-500">Sign in to view detailed issues</p>
              </div>
            )}
          </div>

          {/* Content Structure */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Content Structure</h3>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className={`w-28 h-28 rounded-full mx-auto ${getScoreBgColor(analysisData.content_structure.total_score)} flex items-center justify-center text-white text-3xl font-bold shadow-md`}>
                  {analysisData.content_structure.total_score}
                </div>
                <p className="mt-2 text-gray-500">out of 100</p>
              </div>
            </div>
            
            {isAuthenticated ? (
              <div className="space-y-3 flex-grow">
                {analysisData.content_structure.issues.length > 0 ? (
                  analysisData.content_structure.issues.map((issue, index) => {
                    // Only skip rendering if both message and recommendation are empty
                    if ((!issue.message || issue.message.trim() === '') && 
                        (!issue.recommendation || issue.recommendation.trim() === '')) {
                      return null;
                    }
                    
                    return (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 flex-shrink-0 ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {issue.severity === 'high' ? '!' : 
                             issue.severity === 'medium' ? '•' : '✓'}
                          </span>
                          <div>
                            {issue.message && issue.message.trim() !== '' && (
                              <p className="text-gray-800 font-medium">{issue.message}</p>
                            )}
                            {issue.recommendation && issue.recommendation.trim() !== '' && (
                              <p className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">Recommendation:</span> {issue.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }).filter(Boolean) // Filter out null values
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 italic">No issues found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-500">Sign in to view detailed issues</p>
              </div>
            )}
          </div>

          {/* E-E-A-T */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">E-E-A-T</h3>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className={`w-28 h-28 rounded-full mx-auto ${getScoreBgColor(analysisData.eeat.total_score)} flex items-center justify-center text-white text-3xl font-bold shadow-md`}>
                  {analysisData.eeat.total_score}
                </div>
                <p className="mt-2 text-gray-500">out of 100</p>
              </div>
            </div>
            
            {isAuthenticated ? (
              <div className="space-y-3 flex-grow">
                {analysisData.eeat.issues.length > 0 ? (
                  analysisData.eeat.issues.map((issue, index) => {
                    // Only skip rendering if both message and recommendation are empty
                    if ((!issue.message || issue.message.trim() === '') && 
                        (!issue.recommendation || issue.recommendation.trim() === '')) {
                      return null;
                    }
                    
                    return (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 flex-shrink-0 ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {issue.severity === 'high' ? '!' : 
                             issue.severity === 'medium' ? '•' : '✓'}
                          </span>
                          <div>
                            {issue.message && issue.message.trim() !== '' && (
                              <p className="text-gray-800 font-medium">{issue.message}</p>
                            )}
                            {issue.recommendation && issue.recommendation.trim() !== '' && (
                              <p className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">Recommendation:</span> {issue.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }).filter(Boolean) // Filter out null values
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 italic">No issues found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-500">Sign in to view detailed issues</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    return isAuthenticated ? content : <BlurredSection>{content}</BlurredSection>;
  };

  const renderRecommendations = () => {
    const content = (
      <div className="space-y-6">
        {/* AI Recommendations Coming Soon Notice */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">AI-Powered Recommendations Coming Soon</h3>
              <p className="text-indigo-700">We&apos;re enhancing our platform with advanced AI to provide even more personalized optimization suggestions.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Key Recommendations</h2>
          <div className="grid gap-4">
            {analysisData.recommendations.length > 0 ? (
              analysisData.recommendations.map((recommendation, index) => {
                // Skip error messages that might appear in recommendations
                if (recommendation.toLowerCase().includes('error') || 
                    recommendation.toLowerCase().includes('failed') ||
                    recommendation.toLowerCase().includes('http error')) {
                  return null;
                }
                
                return (
                  <div key={index} className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium">{recommendation}</p>
                      </div>
                    </div>
                  </div>
                );
              }).filter(Boolean)
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 italic">No recommendations available</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Implementation Guide</h2>
          <div className="space-y-6">
            <div className="border-l-4 border-indigo-500 pl-4 py-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Prioritize Your Actions</h3>
              <p className="text-gray-600">Focus on high severity issues first as they&apos;ll have the biggest impact on your optimization score.</p>
            </div>
            
            <div className="border-l-4 border-indigo-500 pl-4 py-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Technical Implementation</h3>
              <p className="text-gray-600">Make sure to update your robots.txt and implement structured data using JSON-LD format.</p>
            </div>
            
            <div className="border-l-4 border-indigo-500 pl-4 py-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Content Improvements</h3>
              <p className="text-gray-600">Structure your content with proper headings and ensure you&apos;re providing expertise, authoritativeness, and trustworthiness signals.</p>
            </div>
          </div>
        </div>
      </div>
    );

    return isAuthenticated ? content : <BlurredSection>{content}</BlurredSection>;
  };

  return (
    <div className="space-y-8">
      {error && activeTab === 'analysis' ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100 p-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Analysis Error</h3>
            <div className="text-red-600 text-lg mb-6 max-w-md">{error}</div>
            <div className="space-y-4 text-left bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 max-w-lg">
              <h4 className="font-semibold text-gray-700">Common causes:</h4>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>The website blocks automated access or scraping</li>
                <li>The website requires authentication or login</li>
                <li>The website uses anti-bot measures</li>
                <li>The URL is invalid or the page doesn&apos;t exist</li>
                <li>Network connectivity issues</li>
              </ul>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/analyses')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Return to Analyses
              </button>
              <button
                onClick={() => window.location.href = 'http://localhost:3000/dashboard'}
                className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        activeTab === 'analysis' ? renderAnalysisContent() : renderRecommendations()
      )}
    </div>
  );
} 