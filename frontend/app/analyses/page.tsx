'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';

const API_BASE_URL = 'http://localhost:8000/api/v1';

interface Analysis {
  url: string;
  overall_score: number;
  timestamp: string;
  id: string;
  title?: string;
  categories?: {
    [key: string]: number;
  };
}

export default function Analyses() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      console.log('Checking auth - Token exists:', !!token);
      console.log('Checking auth - User data exists:', !!userStr);
      
      if (!token || !userStr) {
        console.log('No token or user found, redirecting to signin');
        router.push('/auth/signin');
        return false;
      }
      
      try {
        // Validate user data
        const userData = JSON.parse(userStr);
        console.log('User data:', userData);
        if (userData.name) {
          setUserName(userData.name);
        } else if (userData.email) {
          setUserName(userData.email.split('@')[0]);
        }
        return true;
      } catch (e) {
        console.error('Invalid user data in localStorage:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/signin');
        return false;
      }
    };

    const fetchAnalyses = async () => {
      try {
        if (!checkAuth()) return;

        const token = localStorage.getItem('token');
        console.log('Fetching analyses with token:', token ? 'Token exists' : 'No token');
        
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };

        // Fetch all analyses
        const analysesResponse = await fetch(`${API_BASE_URL}/user/analyses?limit=50`, {
          method: 'GET',
          headers,
          credentials: 'include',
        });
        
        console.log('Analyses response status:', analysesResponse.status);
        
        if (!analysesResponse.ok) {
          const errorText = await analysesResponse.text();
          console.error('Analyses fetch error:', errorText);
          
          if (analysesResponse.status === 401) {
            console.log('Unauthorized, clearing tokens and redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/auth/signin');
            return;
          }
          throw new Error(`Failed to fetch analyses: ${errorText}`);
        }

        const analysesData = await analysesResponse.json();
        console.log('Fetched analyses data:', analysesData);
        setAnalyses(analysesData);
        setError(null);
      } catch (error) {
        console.error('Error fetching analyses data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load analyses data. Please try again later.');
        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [router]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (analyses.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No Analyses Yet</h2>
          <p className="text-gray-600 mb-6">You haven&apos;t analyzed any content yet. Install the Chrome extension to start analyzing websites.</p>
          <div className="space-y-4">
            <a
              href="https://chrome.google.com/webstore"
              className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
            >
              Install Chrome Extension
            </a>
            <p className="text-sm text-gray-500">
              Once installed, visit any website and click the extension to analyze it
            </p>
          </div>
        </div>
      );
    }

    // Group analyses by month for timeline view
    const groupedAnalyses: { [key: string]: Analysis[] } = {};
    const sortedAnalyses = [...analyses].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    sortedAnalyses.forEach(analysis => {
      const date = new Date(analysis.timestamp);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!groupedAnalyses[monthYear]) {
        groupedAnalyses[monthYear] = [];
      }
      
      groupedAnalyses[monthYear].push(analysis);
    });

    return (
      <>
        {/* View Toggle */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Timeline
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {analyses.length} analysis{analyses.length !== 1 ? 'es' : ''}
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyses.map((analysis) => (
              <div 
                key={analysis.id} 
                className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/analysis?id=${analysis.id}`)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                        {analysis.title || new URL(analysis.url).hostname}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {new Date(analysis.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                        analysis.overall_score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                        analysis.overall_score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                    >
                      {Math.round(analysis.overall_score)}
                    </div>
                  </div>
                  
                  {analysis.categories && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Category Scores</h4>
                      <div className="space-y-2">
                        {Object.entries(analysis.categories).slice(0, 3).map(([category, score]) => (
                          <div key={category} className="flex items-center">
                            <span className="text-xs text-gray-600 w-24 truncate">{category}</span>
                            <div className="flex-1 ml-2">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-indigo-600 h-1.5 rounded-full" 
                                  style={{ width: `${score}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-gray-700 ml-2">{Math.round(score)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button className="w-full text-sm text-center text-indigo-600 hover:text-indigo-800 font-medium py-2 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer">
                      View Full Report →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
            {Object.entries(groupedAnalyses).map(([monthYear, monthAnalyses]) => (
              <div key={monthYear} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">{monthYear}</h2>
                <div className="space-y-4">
                  {monthAnalyses.map(analysis => (
                    <div 
                      key={analysis.id} 
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => router.push(`/analysis?id=${analysis.id}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            analysis.overall_score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                            analysis.overall_score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                            'bg-gradient-to-r from-red-400 to-red-600'
                          }`}
                        >
                          {Math.round(analysis.overall_score)}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{new URL(analysis.url).hostname}</h3>
                          <p className="text-xs text-gray-500">
                            {new Date(analysis.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium py-2 px-4 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer">
                        View Report →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <DashboardLayout userName={userName}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Analyses</h1>
        {renderContent()}
      </div>
    </DashboardLayout>
  );
} 