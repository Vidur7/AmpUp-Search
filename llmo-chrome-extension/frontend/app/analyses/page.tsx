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
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        console.log('No token or user found, redirecting to signin');
        router.push('/auth/signin');
        return false;
      }
      
      try {
        // Validate user data
        const userData = JSON.parse(userStr);
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
        
        if (!analysesResponse.ok) {
          const errorText = await analysesResponse.text();
          
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
          <p className="text-gray-600 mb-6">You haven&apos;t analyzed any content yet.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
          >
            Start Your First Analysis
          </button>
        </div>
      );
    }

    return (
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
              
              <button
                className="mt-4 w-full py-2 text-sm text-center text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Full Report →
              </button>
            </div>
          </div>
        ))}
      </div>
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